type Entry = { value: unknown; expiresAt: number };

const TTL_MS = 30_000;
const entries = new Map<string, Entry>();
const pending = new Map<string, Promise<unknown>>();
let generation = 0;

export const getCachedQuery = <T>(key: string): T | undefined => {
  const entry = entries.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return entry.value as T;
};

export const runCachedQuery = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  const current = pending.get(key) as Promise<T> | undefined;
  if (current) return current;
  const requestGeneration = generation;
  const promise = loader();
  pending.set(key, promise as Promise<unknown>);
  try {
    const value = await promise;
    if (requestGeneration === generation) entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
    return value;
  } finally {
    if (pending.get(key) === promise) pending.delete(key);
  }
};

export const invalidateFrontendQueryCache = (prefix?: string) => {
  generation += 1;
  if (!prefix) {
    entries.clear();
    pending.clear();
    return;
  }
  for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key);
  for (const key of pending.keys()) if (key.startsWith(prefix)) pending.delete(key);
};
