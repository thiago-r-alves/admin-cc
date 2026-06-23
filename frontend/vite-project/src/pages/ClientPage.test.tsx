import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientPage from './ClientPage';

const modalSpy = vi.hoisted(() => vi.fn());

vi.mock('../components/ClientOrdersModal', () => ({
  default: (props: { client: { clientName: string }; closureMode?: boolean; onClose: () => void }) => {
    modalSpy(props);
    return (
      <div data-testid="client-orders-modal-mock">
        {props.client.clientName}::{String(props.closureMode)}
        <button type="button" onClick={props.onClose}>
          Fechar histórico
        </button>
      </div>
    );
  },
}));

const buildJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

describe('ClientPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
    modalSpy.mockReset();
  });

  it('abre o histórico de pedidos do cliente e fecha o modal', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: /pedidos/i }));

    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal-mock')).toHaveTextContent(
        'Cliente Historico::false',
      ),
    );
    expect(modalSpy).toHaveBeenCalledWith(expect.objectContaining({ closureMode: false }));

    fireEvent.click(screen.getByRole('button', { name: /fechar histórico/i }));

    await waitFor(() =>
      expect(screen.queryByTestId('client-orders-modal-mock')).not.toBeInTheDocument(),
    );
  });
});
