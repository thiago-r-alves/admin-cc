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
  it('envia metadata_pending no filtro de pagamento e exibe a nova opção', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        return buildJsonResponse([]);
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(screen.getByRole('option', { name: 'Informações pendentes' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pagamento'), {
      target: { value: 'metadata_pending' },
    });

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes('paymentStatus=metadata_pending'),
        ),
      ).toBe(true),
    );
  });
  it('envia data inicial mesmo sem data final no filtro de fechamento', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        return buildJsonResponse([]);
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    fireEvent.change(screen.getByLabelText('Data Inicial'), {
      target: { value: '2026-05-15' },
    });

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = new URL(String(input), 'http://localhost');
          return (
            url.searchParams.get('startDate') === '2026-05-15' &&
            !url.searchParams.has('endDate')
          );
        }),
      ).toBe(true),
    );
  });
  it('troca o CTA principal no filtro de informações pendentes', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        return buildJsonResponse([
          {
            _id: 'cli-1',
            clientName: 'Cliente Pendencia',
            hasPendingClosureItems: true,
            hasPendingClosureMetadata: true,
            hasGeneratedClosureGroups: false,
          },
        ]);
      }
      return buildJsonResponse([]);
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
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal-mock')).toHaveTextContent(
        'Cliente Pendencia::create_closure',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Gerar fechamento do cliente' })).not.toBeInTheDocument();
  });
  it('mantém o modal aberto sem loading bloqueante durante refetch da página', async () => {
    let clientsRequestCount = 0;
    const stalledResponse = new Promise<Response>(() => undefined);
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients?')) {
        clientsRequestCount += 1;
        if (clientsRequestCount === 1) {
          return buildJsonResponse([
            {
              _id: 'cli-1',
              clientName: 'Cliente Pendencia',
              hasPendingClosureItems: true,
              hasPendingClosureMetadata: true,
              hasGeneratedClosureGroups: false,
            },
          ]);
        }
        return stalledResponse;
      }
      return buildJsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(await screen.findByText('Cliente Pendencia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar fechamento do cliente' }));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal-mock')).toHaveTextContent(
        'Cliente Pendencia::create_closure',
      ),
    );

    fireEvent.change(screen.getByLabelText('Pagamento'), {
      target: { value: 'metadata_pending' },
    });

    await waitFor(() => expect(clientsRequestCount).toBeGreaterThan(1));
    expect(screen.queryByText('Carregando clientes para fechamento...')).not.toBeInTheDocument();
    expect(screen.getByTestId('client-orders-modal-mock')).toBeInTheDocument();
  });
});
