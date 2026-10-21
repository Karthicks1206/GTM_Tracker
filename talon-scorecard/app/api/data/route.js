import { NextResponse } from 'next/server';
import { getData, saveData } from '../../../lib/store.js';

export const runtime = 'nodejs';
const PARTS = ['contacts', 'metrics', 'activities'];

// DELETE { part: 'contacts' | 'metrics' | 'activities' | 'all', id?: string }
// With an id, removes one row; without, clears that part.
export async function DELETE(req) {
  try {
    const { part, id } = await req.json().catch(() => ({}));
    if (part !== 'all' && !PARTS.includes(part)) {
      return NextResponse.json({ error: 'Unknown section.' }, { status: 400 });
    }
    const data = await getData();
    delete data.storageMissing;

    if (part === 'all') {
      for (const p of PARTS) data[p] = [];
      data.uploadedAt = null;
      data.fileName = null;
    } else if (id) {
      const before = data[part].length;
      data[part] = data[part].filter((r) => r.id !== id);
      if (data[part].length === before) return NextResponse.json({ error: 'Row not found. Refresh and try again.' }, { status: 404 });
    } else {
      data[part] = [];
    }
    await saveData(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Delete failed.' }, { status: 400 });
  }
}
