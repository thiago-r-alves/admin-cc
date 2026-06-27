import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientOrdersModal from '../ClientOrdersModal';

vi.mock('../../utils/clientOrdersPdf', () => ({
  buildClientOrdersPdf: vi.fn(),
  downloadClientOrdersPdf: vi.fn(async () => undefined),
}));

describe('ClientOrdersModal (history mode)', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('exibe filtros operacionais e refaz a busca ao alternar o tipo', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      if (!input) {
        throw new Error('Expected request input.');
      }

      return {
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 401,
            clientId: 'cli-1',
            clientName: 'Cliente Historico',
            contactName: '',
            contactNumber: '',
            neighborhood: '',
            address: '',
            addressNumber: '',
            type: 'retirada',
            priority: 0,
            status: 'concluido',
            createdAt: '2026-05-10T10:00:00.000Z',
            cacambas: [],
          },
        ],
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ClientOrdersModal
        client={{ _id: 'cli-1', clientName: 'Cliente Historico' }}
        onClose={vi.fn()}
        closureMode={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Todos os pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retiradas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entregas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Início')).toBeInTheDocument();
    expect(screen.getByLabelText('Fim')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Local')).toBeInTheDocument();
    expect(screen.getByLabelText('Busca')).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Retiradas' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const calls = fetchMock.mock.calls;
    expect(String(calls[1]?.[0] ?? '')).toContain('type=retirada');

    fireEvent.click(screen.getByRole('button', { name: 'Entregas' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(String(calls[2]?.[0] ?? '')).toContain('type=entrega');

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'concluido' } });
    fireEvent.change(screen.getByLabelText('Local'), { target: { value: 'via_publica' } });
    fireEvent.change(screen.getByLabelText('Busca'), { target: { value: '401' } });

    await waitFor(() =>
      expect(
        calls.some(([input]) =>
          String(input).includes('status=concluido') &&
          String(input).includes('local=via_publica') &&
          String(input).includes('q=401'),
        ),
      ).toBe(true),
    );
  });
});
