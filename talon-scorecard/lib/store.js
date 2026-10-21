import { Redis } from '@upstash/redis';

const KEY = 'talon:gtm:data';
const EMPTY = { contacts: [], metrics: [], activities: [], uploadedAt: null, fileName: null };

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Local development without Redis keeps data in memory until the server restarts.
const memory = globalThis.__talonMemory ?? (globalThis.__talonMemory = { data: null });

export const storageReady = Boolean(redis) || process.env.NODE_ENV !== 'production';

export async function getData() {
  if (redis) return { ...EMPTY, ...((await redis.get(KEY)) ?? {}) };
  if (process.env.NODE_ENV === 'production') return { ...EMPTY, storageMissing: true };
  return { ...EMPTY, ...(memory.data ?? {}) };
}

export async function saveData(data) {
  if (redis) return redis.set(KEY, data);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Storage is not connected. Add the Upstash Redis integration in Vercel, then redeploy.');
  }
  memory.data = data;
}
