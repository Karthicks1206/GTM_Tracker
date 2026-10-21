import { NextResponse } from 'next/server';
import { parseUpload } from '../../../lib/parse.js';
import { getData, saveData } from '../../../lib/store.js';

export const runtime = 'nodejs';
const MAX_BYTES = 4 * 1024 * 1024; // Vercel's request limit is 4.5 MB

const LABELS = { contacts: 'Contacts', metrics: 'Weekly metrics', activities: 'Activities' };

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File is over 4 MB.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { parts, warnings } = await parseUpload(file.name, buffer);

    const current = await getData();
    // Each sheet in the file replaces that part of the data; parts not in the file are kept.
    const next = { ...current, ...parts, uploadedAt: new Date().toISOString(), fileName: file.name };
    delete next.storageMissing;
    await saveData(next);

    const replaced = Object.entries(parts).map(([k, rows]) => `${LABELS[k]}: ${rows.length} row${rows.length === 1 ? '' : 's'}`);
    const kept = Object.keys(LABELS).filter((k) => !(k in parts)).map((k) => LABELS[k]);
    return NextResponse.json({ ok: true, replaced, kept, warnings });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 400 });
  }
}
