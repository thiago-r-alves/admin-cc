type CacheEntry<T> = { value: T; expiresAt: number };

const TTL_MS = 30_000;
const MAX_ENTRIES = 200;
const entries = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
let generation = 0;

const touch = <T>(key: string, entry: CacheEntry<T>) => {
  entries.delete(key);
  entries.set(key, entry as CacheEntry<unknown>);
};

const trim = () => {
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (!oldest) break;
    entries.delete(oldest);
  }
};

export const normalizeQueryKey = (namespace: string, query: Record<string, unknown>) => {
  const normalized = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && String(value) !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  return `${namespace}:${normalized}`;
};

export const getOrSetQueryCache = async <T>(
  key: string,
  loader: () => Promise<T>,
): Promise<{ value: T; status: 'HIT' | 'MISS' }> => {
  const now = Date.now();
  const cached = entries.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    touch(key, cached);
    return { value: cached.value, status: 'HIT' };
  }
  if (cached) entries.delete(key);

  const inFlight = pending.get(key) as Promise<T> | undefined;
  if (inFlight) return { value: await inFlight, status: 'HIT' };

  const requestGeneration = generation;
  const promise = loader();
  pending.set(key, promise as Promise<unknown>);
  try {
    const value = await promise;
    if (requestGeneration === generation) {
      entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
      trim();
    }
    return { value, status: 'MISS' };
  } finally {
    if (pending.get(key) === promise) pending.delete(key);
  }
};

export const invalidateQueryCaches = (...namespaces: string[]) => {
  generation += 1;
  const prefixes = namespaces.map((namespace) => `${namespace}:`);
  for (const key of entries.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) entries.delete(key);
  }
  for (const key of pending.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) pending.delete(key);
  }
};

export const clearQueryCacheForTests = () => {
  entries.clear();
  pending.clear();
  generation += 1;
};

export const QUERY_CACHE_NAMESPACES = {
  clients: 'clients',
  closureClients: 'closure-clients',
  clientOrders: 'client-orders',
  closureGroups: 'closure-groups',
} as const;

export const invalidateOperationalQueryCaches = () => invalidateQueryCaches(
  QUERY_CACHE_NAMESPACES.closureClients,
  QUERY_CACHE_NAMESPACES.clientOrders,
  QUERY_CACHE_NAMESPACES.closureGroups,
);
