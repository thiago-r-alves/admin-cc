import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AcompanhamentoFilters, AcompanhamentoItem } from '../admin.helpers';
import { AcompanhamentoTab } from './AcompanhamentoTab';

vi.mock('react-select', () => ({
  default: ({
    inputId,
    options,
    value,
    onChange,
    placeholder,
  }: {
    inputId?: string;
    options: Array<{ value: string; label: string }>;
    value?: { value: string; label: string } | null;
    onChange: (value: { value: string; label: string } | null) => void;
    placeholder: string;
  }) => (
    <select
      id={inputId}
      aria-label={placeholder}
      value={value?.value || ''}
      onChange={(event) => onChange(options.find((option) => option.value === event.target.value) || null)}
    >
      <option value="">Selecione...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../../services/api', () => ({
  apiUrl: 'http://api.test',
}));

const filters: AcompanhamentoFilters = {
  numero: '',
  cacambaCount: '',
  clientName: '',
  cnpjCpf: '',
  contact: '',
  phone: '',
  serviceOrder: '',
  serviceOrderDigital: '',
  address: '',
  neighborhood: '',
  city: '',
  cep: '',
};

const item: AcompanhamentoItem = {
  numero: '123',
  numeroValue: 123,
  createdAtMs: new Date('2026-05-01T10:00:00.000Z').getTime(),
  activeCacambaCount: 1,
  cacamba: {
    _id: 'cac-1',
    numero: '123',
    tipo: 'entrega',
    orderId: 'ord-1',
    local: 'via_publica',
    createdAt: '2026-05-01T10:00:00.000Z',
    horaServicoDigitos: '001',
  },
  order: {
    _id: 'ord-1',
    orderNumber: 10,
    clientName: 'Cliente Atual',
    contactName: 'Ana',
    contactNumber: '11999990000',
    neighborhood: 'Centro',
    address: 'Rua A',
    addressNumber: '20',
    city: 'Sao Jose dos Campos',
    cep: '12200-000',
    type: 'entrega',
    priority: 0,
    status: 'concluido',
    placa: 'abc1234',
  },
};

const trackResponse = {
  numero: '123',
  total: 2,
  currentStatus: 'retirada',
  firstRegisteredAt: '2026-05-01T10:00:00.000Z',
  lastRegisteredAt: '2026-05-04T10:00:00.000Z',
  events: [
    {
      _id: 'evt-1',
      numero: '123',
      tipo: 'entrega',
      local: 'via_publica',
      createdAt: '2026-05-01T10:00:00.000Z',
      horaServicoDigitos: '001',
      order: {
        _id: 'ord-1',
        orderNumber: 10,
        clientName: 'Cliente Histórico',
        contactName: 'Ana',
        contactNumber: '11999990000',
        neighborhood: 'Centro',
        address: 'Rua A',
        addressNumber: '20',
        city: 'Sao Jose dos Campos',
        cep: '12200-000',
        type: 'entrega',
        status: 'concluido',
        motorista: { _id: 'drv-1', username: 'Motorista Um' },
        placa: 'abc1234',
      },
    },
    {
      _id: 'evt-2',
      numero: '123',
      tipo: 'retirada',
      local: 'canteiro_obra',
      contentType: 'Entulho limpo',
      price: 210,
      createdAt: '2026-05-04T10:00:00.000Z',
      horaServicoDigitos: '002',
      order: {
        _id: 'ord-2',
        orderNumber: 11,
        clientName: 'Cliente Histórico',
        contactName: 'Ana',
        contactNumber: '11999990000',
        neighborhood: 'Centro',
        address: 'Rua A',
        addressNumber: '20',
        city: 'Sao Jose dos Campos',
        cep: '12200-000',
        type: 'retirada',
        status: 'concluido',
        motorista: { _id: 'drv-1', username: 'Motorista Um' },
        placa: 'def5678',
      },
    },
  ],
};

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response;

const errorResponse = (body: unknown) =>
  ({
    ok: false,
    status: 500,
    json: async () => body,
  }) as Response;

const renderTab = (authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>) =>
  render(
    <AcompanhamentoTab
      items={[item]}
      filters={filters}
      sortMode="default"
      onFiltersChange={vi.fn()}
      onSortModeChange={vi.fn()}
      onEditCacamba={vi.fn()}
      onDeleteCacamba={vi.fn()}
      onOpenImage={vi.fn()}
      authenticatedFetch={authenticatedFetch}
    />,
  );

const createAuthenticatedFetch = (
  trackResponseFactory: (url: string) => Promise<Response> = async () => okResponse(trackResponse),
) =>
  vi.fn(async (url: string) => {
    if (url.includes('/cacambas/tracked-numbers')) {
      return okResponse({ numbers: ['123', '999'] });
    }
    return trackResponseFactory(url);
  });

describe('AcompanhamentoTab track', () => {
  it('carrega opções, busca a caçamba selecionada e mostra loading seguido da timeline', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const authenticatedFetch = createAuthenticatedFetch(async () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    renderTab(authenticatedFetch);

    await screen.findByRole('option', { name: 'Caçamba #123' });
    fireEvent.change(await screen.findByLabelText('Histórico da caçamba'), { target: { value: '123' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(screen.getByText('Carregando histórico da caçamba...')).toBeInTheDocument();
    resolveFetch(okResponse(trackResponse));

    expect(await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ })).toBeInTheDocument();
    expect(screen.getAllByText('Cliente Histórico')).toHaveLength(2);
    expect(screen.getByText('Retirada')).toBeInTheDocument();
    expect(screen.getByText('R$ 210,00')).toBeInTheDocument();
    expect(within(screen.getAllByTestId(/cacamba-track-event-/)[0]).getByText('Retirada')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Ordenar histórico'), { target: { value: 'oldest' } });
    expect(within(screen.getAllByTestId(/cacamba-track-event-/)[0]).getByText('Entrega')).toBeInTheDocument();
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/tracked-numbers');
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/track?numero=123');
  });

  it('exibe mensagem quando não existe histórico', async () => {
    const authenticatedFetch = createAuthenticatedFetch(async () =>
      okResponse({ ...trackResponse, total: 0, currentStatus: null, events: [] }),
    );
    renderTab(authenticatedFetch);

    await screen.findByRole('option', { name: 'Caçamba #999' });
    fireEvent.change(await screen.findByLabelText('Histórico da caçamba'), { target: { value: '999' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(await screen.findByText('Nenhum histórico encontrado para esta caçamba.')).toBeInTheDocument();
  });

  it('exibe erro retornado pela API', async () => {
    const authenticatedFetch = createAuthenticatedFetch(async () => errorResponse({ message: 'Erro controlado.' }));
    renderTab(authenticatedFetch);

    await screen.findByRole('option', { name: 'Caçamba #123' });
    fireEvent.change(await screen.findByLabelText('Histórico da caçamba'), { target: { value: '123' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(await screen.findByText('Erro controlado.')).toBeInTheDocument();
  });

  it('exibe erro ao carregar opções de caçambas já rastreadas', async () => {
    const authenticatedFetch = vi.fn(async (url: string) => {
      if (url.includes('/cacambas/tracked-numbers')) {
        return errorResponse({ message: 'Falha ao carregar caçambas.' });
      }
      return okResponse(trackResponse);
    });
    renderTab(authenticatedFetch);

    expect(await screen.findByText('Falha ao carregar caçambas.')).toBeInTheDocument();
  });

  it('valida seleção obrigatória antes de buscar histórico', async () => {
    const authenticatedFetch = createAuthenticatedFetch();
    renderTab(authenticatedFetch);

    const button = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    const form = button.closest('form');
    if (!form) throw new Error('History form not found.');
    fireEvent.submit(form);

    expect(await screen.findByText('Selecione uma caçamba para buscar o histórico.')).toBeInTheDocument();
    expect(authenticatedFetch).not.toHaveBeenCalledWith(expect.stringContaining('/cacambas/track?numero='));
  });

  it('abre o track pelo card sem quebrar os filtros existentes', async () => {
    const authenticatedFetch = createAuthenticatedFetch();
    renderTab(authenticatedFetch);

    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('acompanhamento-track-cac-1'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/track?numero=123');
    });
    expect(await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
  });
});
