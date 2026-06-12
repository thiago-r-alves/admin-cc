import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FechamentoPage from './FechamentoPage';

describe('FechamentoPage integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('preserva o modal e evita loading bloqueante ao salvar valor pendente', async () => {
    let patchCount = 0;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/clients?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'cli-1',
              clientName: 'Cliente Pendencia',
              hasPendingClosureItems: true,
              hasPendingClosureMetadata: true,
              hasGeneratedClosureGroups: false,
            },
          ],
        } as Response);
      }

      if (url.includes('/clients/cli-1/orders?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'ord-1',
              orderNumber: 4001,
              clientId: 'cli-1',
              clientName: 'Cliente Pendencia',
              contactName: '',
              contactNumber: '',
              neighborhood: '',
              address: '',
              addressNumber: '',
              type: 'retirada',
              priority: 0,
              status: 'concluido',
              cacambas: [
                {
                  _id: 'cac-1',
                  numero: '101',
                  tipo: 'retirada',
                  paymentStatus: 'pendente',
                  contentType: 'Entulho limpo',
                  orderId: 'ord-1',
                  createdAt: '2026-05-10T10:00:00.000Z',
                },
              ],
            },
          ],
        } as Response);
      }

      if (url.includes('/cacambas/cac-1') && init?.method === 'PATCH') {
        patchCount += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cacamba: {
              _id: 'cac-1',
              numero: '101',
              tipo: 'retirada',
              paymentStatus: 'pendente',
              contentType: 'Entulho limpo',
              price: 180,
              orderId: 'ord-1',
              createdAt: '2026-05-10T10:00:00.000Z',
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    fireEvent.change(screen.getByLabelText('Pagamento'), {
      target: { value: 'metadata_pending' },
    });

    expect(await screen.findByText('Cliente Pendencia')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ver caçambas com informações pendentes' }),
    );

    expect(await screen.findByText('Pedido #4001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar valor' }));
    fireEvent.change(screen.getByLabelText('Valor (R$)'), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(patchCount).toBe(1));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Carregando clientes para fechamento...')).not.toBeInTheDocument();
    expect(
      screen.getByText('Nenhuma caçamba com informações pendentes encontrada para este cliente.'),
    ).toBeInTheDocument();
  });
});
