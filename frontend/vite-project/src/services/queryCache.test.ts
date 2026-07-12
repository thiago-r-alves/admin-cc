import { describe, expect, it, vi } from 'vitest';
import { getCachedQuery, invalidateFrontendQueryCache, runCachedQuery } from './queryCache';

describe('queryCache', () => {
  it('deduplica requisicoes simultaneas e permite invalidacao por prefixo', async () => {
    let release: (() => void) | undefined;
    const loader = vi.fn(() => new Promise<string>((resolve) => { release = () => resolve('dados'); }));
    const first = runCachedQuery('clients:page-1', loader);
    const second = runCachedQuery('clients:page-1', loader);
    release?.();
    expect(await first).toBe('dados');
    expect(await second).toBe('dados');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(getCachedQuery('clients:page-1')).toBe('dados');

    invalidateFrontendQueryCache('clients:');
    expect(getCachedQuery('clients:page-1')).toBeUndefined();
  });
});
