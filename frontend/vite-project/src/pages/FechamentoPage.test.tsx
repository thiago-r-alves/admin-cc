import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FechamentoPage from './FechamentoPage';

const modalSpy = vi.fn();

vi.mock('../components/ClientOrdersModal', () => ({
  default: (props: { viewMode?: 'create_closure' | 'generated_notes'; client: { clientName: string } }) => {
    modalSpy(props);
    return (
      <div data-testid="client-orders-modal-mock">
        {props.client.clientName}::{props.viewMode}
      </div>
    );
  },
}));

const buildJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

describe('FechamentoPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
    modalSpy.mockReset();
  });

  it('separa os botões de criar fechamento e consultar notas geradas', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        return buildJsonResponse([
          {
            _id: 'cli-1',
            clientName: 'Cliente Pendencia',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: false,
          },
          {
            _id: 'cli-2',
            clientName: 'Cliente Notas',
            hasPendingClosureItems: false,
            hasGeneratedClosureGroups: true,
          },
          {
            _id: 'cli-3',
            clientName: 'Cliente Ambos',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: true,
          },
        ]);
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(await screen.findByText('Cliente Pendencia')).toBeInTheDocument();
    expect(screen.getByTestId('closure-client-row-cli-1')).toHaveTextContent(
      'Gerar fechamento do cliente',
    );
    expect(screen.getByTestId('closure-client-row-cli-1')).not.toHaveTextContent('Ver notas geradas');
    expect(screen.getByTestId('closure-client-row-cli-2')).not.toHaveTextContent(
      'Gerar fechamento do cliente',
    );
    expect(screen.getByTestId('closure-client-row-cli-2')).toHaveTextContent('Ver notas geradas');
    expect(screen.getByTestId('closure-client-row-cli-3')).toHaveTextContent(
      'Gerar fechamento do cliente',
    );
    expect(screen.getByTestId('closure-client-row-cli-3')).toHaveTextContent('Ver notas geradas');
  });

  it('abre o modal no modo correto para cada botão', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        return buildJsonResponse([
          {
            _id: 'cli-3',
            clientName: 'Cliente Ambos',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: true,
          },
        ]);
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(await screen.findByText('Cliente Ambos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Gerar fechamento do cliente' }));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal-mock')).toHaveTextContent(
        'Cliente Ambos::create_closure',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver notas geradas' }));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal-mock')).toHaveTextContent(
        'Cliente Ambos::generated_notes',
      ),
    );
  });
});
