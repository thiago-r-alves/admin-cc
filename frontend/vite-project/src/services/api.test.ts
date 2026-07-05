import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authFetch, clearStoredSession, jsonFetch } from './api';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<FetchFn>>;

const getFirstRequestHeaders = (fetchMock: FetchMock) => {
  const firstCall = fetchMock.mock.calls[0];
  if (!firstCall) throw new Error('fetch was not called.');
  return new Headers(firstCall[1]?.headers);
};

describe('api service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('envia token e parseia JSON em jsonFetch', async () => {
    localStorage.setItem('token', 'token-123');
    const fetchMock = vi.fn<FetchFn>(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const payload = await jsonFetch<{ ok: boolean }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ active: true }),
    });

    const headers = getFirstRequestHeaders(fetchMock);
    expect(payload).toEqual({ ok: true });
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('nao define content-type manualmente para FormData', async () => {
    localStorage.setItem('token', 'token-123');
    const fetchMock = vi.fn<FetchFn>(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('/upload', { method: 'POST', body: new FormData() });

    const headers = getFirstRequestHeaders(fetchMock);
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('chama onUnauthorized quando nao existe token', async () => {
    const onUnauthorized = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(authFetch('/orders', { onUnauthorized })).rejects.toThrow('Token not found');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chama onUnauthorized quando API retorna 401', async () => {
    localStorage.setItem('token', 'token-123');
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })));

    await expect(authFetch('/orders', { onUnauthorized })).rejects.toThrow('Authentication failed');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('limpa a sessao armazenada', () => {
    localStorage.setItem('token', 'token-123');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('username', 'Motorista Teste');
    localStorage.setItem('token_expires_at', '123');

    clearStoredSession();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('token_expires_at')).toBeNull();
  });
});
