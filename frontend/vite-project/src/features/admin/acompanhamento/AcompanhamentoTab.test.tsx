import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
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
    clientId: 'client-1',
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

const clientHistoryResponse = [
  {
    _id: 'ord-old',
    orderNumber: 9,
    clientId: 'client-1',
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
    motorista: { _id: 'drv-1', username: 'Motorista Um' },
    placa: 'abc1234',
    createdAt: '2026-04-30T10:00:00.000Z',
    cacambas: [
      {
        _id: 'cac-old',
        numero: '122',
        tipo: 'entrega',
        orderId: 'ord-old',
        local: 'via_publica',
        createdAt: '2026-04-30T10:00:00.000Z',
        horaServicoDigitos: '000',
      },
    ],
  },
  {
    _id: 'ord-new',
    orderNumber: 10,
    clientId: 'client-1',
    clientName: 'Cliente Atual',
    contactName: 'Ana',
    contactNumber: '11999990000',
    neighborhood: 'Centro',
    address: 'Rua A',
    addressNumber: '20',
    city: 'Sao Jose dos Campos',
    cep: '12200-000',
    type: 'retirada',
    priority: 0,
    status: 'concluido',
    motorista: { _id: 'drv-1', username: 'Motorista Um' },
    placa: 'def5678',
    createdAt: '2026-05-04T10:00:00.000Z',
    cacambas: [
      {
        _id: 'cac-new',
        numero: '123',
        tipo: 'retirada',
        orderId: 'ord-new',
        local: 'canteiro_obra',
        contentType: 'Entulho limpo',
        price: 210,
        createdAt: '2026-05-04T10:00:00.000Z',
        horaServicoDigitos: '002',
      },
    ],
  },
];

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

const renderTab = (
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  callbacks: {
    onEditCacamba?: ComponentProps<typeof AcompanhamentoTab>['onEditCacamba'];
    onDeleteCacamba?: ComponentProps<typeof AcompanhamentoTab>['onDeleteCacamba'];
  } = {},
) =>
  render(
    <AcompanhamentoTab
      items={[item]}
      filters={filters}
      sortMode="default"
      onFiltersChange={vi.fn()}
      onSortModeChange={vi.fn()}
      onEditCacamba={callbacks.onEditCacamba || vi.fn()}
      onDeleteCacamba={callbacks.onDeleteCacamba || vi.fn()}
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
    if (url.includes('/clients/client-1/orders')) {
      return okResponse(clientHistoryResponse);
    }
    if (url.endsWith('/clients')) {
      return okResponse([
        { _id: 'client-1', clientName: 'Cliente Atual' },
        { _id: 'client-2', clientName: 'Outro Cliente' },
      ]);
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

    const trackDialog = await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ });
    expect(trackDialog).toBeInTheDocument();
    expect(screen.getAllByText('Cliente Histórico')).toHaveLength(2);
    expect(screen.getByText('Total de movimentações: 2')).toBeInTheDocument();
    expect(screen.getByText(/Primeira locação:/)).toBeInTheDocument();
    expect(screen.getByText(/Última locação:/)).toBeInTheDocument();
    expect(screen.getByText('Retirada')).toBeInTheDocument();
    expect(screen.getByText('R$ 210,00')).toBeInTheDocument();
    expect(within(screen.getAllByTestId(/cacamba-track-event-/)[0]).getByText('Retirada')).toBeInTheDocument();
    expect(within(trackDialog).getAllByRole('button', { name: 'Editar número da caçamba' })).toHaveLength(2);
    expect(within(trackDialog).getAllByRole('button', { name: 'Excluir caçamba' })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Ordenar histórico'), { target: { value: 'oldest' } });
    expect(within(screen.getAllByTestId(/cacamba-track-event-/)[0]).getByText('Entrega')).toBeInTheDocument();
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/tracked-numbers');
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/track?numero=123');
  });

  it('aciona edição e exclusão do evento específico no histórico da caçamba', async () => {
    const authenticatedFetch = createAuthenticatedFetch();
    const onEditCacamba = vi.fn();
    const onDeleteCacamba = vi.fn();
    renderTab(authenticatedFetch, { onEditCacamba, onDeleteCacamba });

    await screen.findByRole('option', { name: 'Caçamba #123' });
    fireEvent.change(await screen.findByLabelText('Histórico da caçamba'), { target: { value: '123' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ })).toBeInTheDocument();
    const firstEvent = screen.getAllByTestId(/cacamba-track-event-/)[0];

    fireEvent.click(within(firstEvent).getByRole('button', { name: 'Editar número da caçamba' }));
    expect(onEditCacamba).toHaveBeenCalledWith(
      expect.objectContaining({
        orderType: 'retirada',
        cacamba: expect.objectContaining({
          _id: 'evt-2',
          numero: '123',
          tipo: 'retirada',
          orderId: 'ord-2',
        }),
        onUpdated: expect.any(Function),
      }),
    );

    fireEvent.click(within(firstEvent).getByRole('button', { name: 'Excluir caçamba' }));
    expect(onDeleteCacamba).toHaveBeenCalledWith('evt-2', '123', expect.any(Function), {
      skipRefresh: true,
    });
  });

  it('usa o tipo do evento como fallback ao editar histórico sem pedido vinculado', async () => {
    const responseWithoutOrder = {
      ...trackResponse,
      events: [
        {
          ...trackResponse.events[0],
          _id: 'evt-sem-pedido',
          tipo: 'entrega',
          order: null,
        },
      ],
    };
    const authenticatedFetch = createAuthenticatedFetch(async () => okResponse(responseWithoutOrder));
    const onEditCacamba = vi.fn();
    renderTab(authenticatedFetch, { onEditCacamba });

    await screen.findByRole('option', { name: 'Caçamba #123' });
    fireEvent.change(await screen.findByLabelText('Histórico da caçamba'), { target: { value: '123' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico da caçamba' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar número da caçamba' }));

    expect(onEditCacamba).toHaveBeenCalledWith(
      expect.objectContaining({
        orderType: 'entrega',
        cacamba: expect.objectContaining({
          _id: 'evt-sem-pedido',
          orderId: '',
        }),
      }),
    );
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
    expect(screen.getByRole('button', { name: 'Ver histórico da caçamba' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('acompanhamento-track-cac-1'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/cacambas/track?numero=123');
    });
    expect(await screen.findByRole('dialog', { name: /Histórico da caçamba #123/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
  });

  it('carrega clientes, busca o histórico selecionado e ordena os pedidos', async () => {
    const authenticatedFetch = createAuthenticatedFetch();
    renderTab(authenticatedFetch);

    await screen.findByRole('option', { name: 'Cliente Atual' });
    fireEvent.change(await screen.findByLabelText('Histórico do cliente'), { target: { value: 'client-1' } });
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico do cliente' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);

    expect(await screen.findByRole('dialog', { name: /Histórico do cliente - Cliente Atual/ })).toBeInTheDocument();
    expect(screen.getByText('Total de pedidos: 2')).toBeInTheDocument();
    expect(within(screen.getAllByTestId(/client-history-order-/)[0]).getAllByText('Retirada')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Caçambas vinculadas')[0]).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Ordenar histórico'), { target: { value: 'oldest' } });
    expect(within(screen.getAllByTestId(/client-history-order-/)[0]).getAllByText('Entrega')[0]).toBeInTheDocument();
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/clients');
    expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/clients/client-1/orders');
  });

  it('mostra loading, vazio e erro do histórico do cliente', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const authenticatedFetch = vi.fn(async (url: string) => {
      if (url.includes('/cacambas/tracked-numbers')) {
        return okResponse({ numbers: ['123'] });
      }
      if (url.endsWith('/clients')) {
        return okResponse([{ _id: 'client-1', clientName: 'Cliente Atual' }]);
      }
      if (url.includes('/clients/client-1/orders')) {
        return new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        });
      }
      return okResponse(trackResponse);
    });
    renderTab(authenticatedFetch);

    await screen.findByRole('option', { name: 'Cliente Atual' });
    const clientSelect = await screen.findByLabelText('Histórico do cliente');
    fireEvent.change(clientSelect, { target: { value: 'client-1' } });
    await waitFor(() => expect(clientSelect).toHaveValue('client-1'));
    const searchButton = screen.getByRole('button', { name: 'Buscar histórico do cliente' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());
    fireEvent.click(searchButton);
    expect(screen.getByText('Carregando histórico do cliente...')).toBeInTheDocument();
    resolveFetch(okResponse([]));
    expect(await screen.findByText('Nenhum histórico encontrado para este cliente.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Fechar histórico do cliente'));
    resolveFetch = () => {};
    fireEvent.click(screen.getByRole('button', { name: 'Buscar histórico do cliente' }));
    resolveFetch(errorResponse({ message: 'Erro no histórico do cliente.' }));
    expect(await screen.findByText('Erro no histórico do cliente.')).toBeInTheDocument();
  });

  it('abre o histórico do cliente pelo card', async () => {
    const authenticatedFetch = createAuthenticatedFetch();
    renderTab(authenticatedFetch);

    fireEvent.click(screen.getByTestId('acompanhamento-client-history-cac-1'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('http://api.test/clients/client-1/orders');
    });
    expect(await screen.findByRole('dialog', { name: /Histórico do cliente - Cliente Atual/ })).toBeInTheDocument();
  });
});
