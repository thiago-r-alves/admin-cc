import { describe, expect, it, vi } from 'vitest';
import {
  getOrSetQueryCache,
  invalidateQueryCaches,
  normalizeQueryKey,
} from '../../src/shared/queryCache';

describe('query cache', () => {
  it('normaliza a chave, reutiliza valor e invalida namespace', async () => {
    const loader = vi.fn(async () => ({ ok: true }));
    const key = normalizeQueryKey('clients', { page: 1, q: 'ana' });
    expect(key).toBe(normalizeQueryKey('clients', { q: 'ana', page: 1 }));

    expect((await getOrSetQueryCache(key, loader)).status).toBe('MISS');
    expect((await getOrSetQueryCache(key, loader)).status).toBe('HIT');
    expect(loader).toHaveBeenCalledTimes(1);

    invalidateQueryCaches('clients');
    expect((await getOrSetQueryCache(key, loader)).status).toBe('MISS');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('deduplica carregamentos simultaneos', async () => {
    let release: (() => void) | undefined;
    const loader = vi.fn(() => new Promise<string>((resolve) => { release = () => resolve('ok'); }));
    const first = getOrSetQueryCache('closure-clients:same', loader);
    const second = getOrSetQueryCache('closure-clients:same', loader);
    release?.();
    expect((await first).value).toBe('ok');
    expect((await second).value).toBe('ok');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
