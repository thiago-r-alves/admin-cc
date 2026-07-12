import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientPage from './ClientPage';

const buildJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

describe('ClientPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('lista clientes sem exibir a ação de pedidos', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients')) {
        return buildJsonResponse([
          {
            _id: 'cli-1',
            clientName: 'Cliente Historico',
            contactName: 'Contato',
            contactNumber: '99999-0000',
            address: 'Rua Teste',
            addressNumber: '10',
            neighborhood: 'Centro',
          },
        ]);
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ClientPage />);

    expect(await screen.findByText('Cliente Historico')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pedidos/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('client-orders-modal-mock')).not.toBeInTheDocument();
  });

  it('envia busca paginada uma vez apos o debounce', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      void input;
      return buildJsonResponse({ items: [], page: 1, pageSize: 25, totalItems: 0, totalPages: 1 });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ClientPage />);
    await act(async () => { await Promise.resolve(); });

    const input = screen.getByTestId('clients-search-input');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ana' } });
    await act(async () => { vi.advanceTimersByTime(299); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(1); await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('paginated=true');
    expect(String(fetchMock.mock.calls[1][0])).toContain('q=ana');
    vi.useRealTimers();
  });

  it('mantem a busca ao trocar de pagina', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      void input;
      return buildJsonResponse({ items: [], page: 1, pageSize: 25, totalItems: 30, totalPages: 2 });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ClientPage />);
    const next = await screen.findByRole('button', { name: 'Próxima' });
    fireEvent.click(next);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('page=2'))).toBe(true);
  });
});
