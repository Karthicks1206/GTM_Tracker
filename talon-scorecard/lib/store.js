import { Redis } from '@upstash/redis';

const KEY = 'talon:gtm:data';
const EMPTY = { contacts: [], metrics: [], activities: [], uploadedAt: null, fileName: null };

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Local development without Redis keeps data in memory until the server restarts.
const memory = globalThis.__talonMemory ?? (globalThis.__talonMemory = { data: null });

export const storageReady = Boolean(redis) || process.env.NODE_ENV !== 'production';

async function load() {
  if (redis) return { ...EMPTY, ...((await redis.get(KEY)) ?? {}) };
  if (process.env.NODE_ENV === 'production') return { ...EMPTY, storageMissing: true };
  return { ...EMPTY, ...(memory.data ?? {}) };
}

// Rows saved by an older version have no id, so they can't be deleted.
// Give them one and save it back the first time they're read.
export async function getData() {
  const data = await load();
  if (data.storageMissing) return data;
  let changed = false;
  for (const part of ['contacts', 'metrics', 'activities']) {
    for (const row of data[part]) {
      if (!row.id) {
        row.id = crypto.randomUUID();
        changed = true;
      }
    }
  }
  if (changed) await saveData(data);
  return data;
}

export async function saveData(data) {
  if (redis) return redis.set(KEY, data);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Storage is not connected. Add the Upstash Redis integration in Vercel, then redeploy.');
  }
  memory.data = data;
}
