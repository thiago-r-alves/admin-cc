import { render, screen } from '@testing-library/react';
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
});
