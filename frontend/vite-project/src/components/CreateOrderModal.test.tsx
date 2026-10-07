import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateOrderModal from './CreateOrderModal';

vi.mock('react-select', () => ({
  default: ({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options: Array<{ value: string; label: string }>;
    value?: { value: string; label: string } | null;
    onChange: (value: { value: string; label: string } | null) => void;
    placeholder: string;
  }) => (
    <select
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

const client = {
  _id: 'client-1',
  clientName: 'Cliente Teste',
  cnpjCpf: '11.111.111/0001-11',
  contactName: 'Contato',
  contactNumber: '12999999999',
  neighborhood: 'Centro',
  address: 'Rua 1',
  addressNumber: '10',
  reference: 'Ao lado da farmácia',
  city: 'São José dos Campos',
};

const clientWithoutReference = { ...client, _id: 'client-2', clientName: 'Cliente antigo', reference: undefined };

const drivers = [{ _id: 'driver-1', username: 'motorista 1' }];

const submitCreateOrderForm = () => {
  const form = screen.getByRole('button', { name: /criar pedido/i }).closest('form');
  if (!form) throw new Error('Create order form not found.');
  fireEvent.submit(form);
};

describe('CreateOrderModal', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/clients')) {
          return new Response(JSON.stringify([client, clientWithoutReference]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/cities')) {
          return new Response(
            JSON.stringify([
              { _id: 'city-1', name: 'São José dos Campos' },
              { _id: 'city-2', name: 'Cidade Nova' },
            ]),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
        if (url.includes('/orders')) {
          return new Response(JSON.stringify({ _id: 'order-1', ...(init?.body ? JSON.parse(String(init.body)) : {}) }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('{}', { status: 200 });
      }),
    );
  });

  it('exige e envia valor para pedido de entrega', async () => {
    const onOrderCreated = vi.fn();
    const onClose = vi.fn();
    render(<CreateOrderModal onClose={onClose} onOrderCreated={onOrderCreated} drivers={drivers} />);

    const clientInput = await screen.findByLabelText('Digite nome, CPF ou CNPJ...');
    fireEvent.change(clientInput, {
      target: { value: client._id },
    });
    expect(await screen.findByRole('option', { name: 'Motorista 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('order-type-entrega'));

    expect(screen.getByPlaceholderText('Ex: 180,00')).toBeInTheDocument();

    submitCreateOrderForm();
    expect(await screen.findByText('Informe o valor da caçamba para pedidos de entrega.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ex: 180,00'), { target: { value: '180,50' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'fto2e29' } });
    fireEvent.change(selects[3], { target: { value: drivers[0]._id } });
    submitCreateOrderForm();

    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1));
    const ordersCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(([url]) =>
      String(url).includes('/orders'),
    );
    expect(JSON.parse(String(ordersCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        type: 'entrega',
        cacambaPrice: 180.5,
      }),
    );
  });

  it('exibe e envia valor para pedido de retirada quando informado', async () => {
    const onOrderCreated = vi.fn();
    render(<CreateOrderModal onClose={vi.fn()} onOrderCreated={onOrderCreated} drivers={drivers} />);

    fireEvent.change(await screen.findByLabelText('Digite nome, CPF ou CNPJ...'), {
      target: { value: client._id },
    });
    fireEvent.click(screen.getByTestId('order-type-retirada'));

    expect(screen.getByPlaceholderText('Ex: 180,00')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ex: 180,00'), { target: { value: '250' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'fto2e29' } });
    fireEvent.change(selects[3], { target: { value: drivers[0]._id } });
    submitCreateOrderForm();

    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1));
    const ordersCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(([url]) =>
      String(url).includes('/orders'),
    );
    expect(JSON.parse(String(ordersCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        type: 'retirada',
        cacambaPrice: 250,
      }),
    );
  });

  it('carrega cidades dinamicas no campo de cidade', async () => {
    render(<CreateOrderModal onClose={vi.fn()} onOrderCreated={vi.fn()} drivers={drivers} />);

    fireEvent.change(await screen.findByLabelText('Digite nome, CPF ou CNPJ...'), {
      target: { value: client._id },
    });

    const selects = screen.getAllByRole('combobox');
    expect(selects[2]).toHaveDisplayValue('São José dos Campos');
    expect(screen.getByRole('option', { name: 'Cidade Nova' })).toBeInTheDocument();
  });

  it.each([
    ['personalizar', '  Entrada pelo portão azul  ', 'Entrada pelo portão azul'],
    ['apagar', '', ''],
  ])('permite %s a referência herdada sem alterar o Maps ou o cliente', async (_action, inputValue, expectedValue) => {
    const onOrderCreated = vi.fn();
    render(<CreateOrderModal onClose={vi.fn()} onOrderCreated={onOrderCreated} drivers={drivers} />);

    fireEvent.change(await screen.findByLabelText('Digite nome, CPF ou CNPJ...'), {
      target: { value: client._id },
    });
    const referenceInput = screen.getByLabelText('Referência (opcional)');
    expect(referenceInput).toHaveValue(client.reference);
    expect(referenceInput).not.toBeRequired();
    const mapFrame = screen.getByTitle('Mapa do endereço do pedido');
    const mapLink = screen.getByRole('link', { name: /local verificado/i });
    const expectedMapAddress = [client.address, client.addressNumber, client.neighborhood, client.city, 'Brasil'].join(', ');
    const originalMapSrc = mapFrame.getAttribute('src');
    const originalMapHref = mapLink.getAttribute('href');
    expect(new URL(originalMapSrc!).searchParams.get('q')).toBe(expectedMapAddress);
    expect(new URL(originalMapHref!).searchParams.get('query')).toBe(expectedMapAddress);

    fireEvent.change(referenceInput, { target: { value: inputValue } });
    expect(mapFrame).toHaveAttribute('src', originalMapSrc);
    expect(mapLink).toHaveAttribute('href', originalMapHref);
    fireEvent.click(screen.getByTestId('order-type-retirada'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'fto2e29' } });
    fireEvent.change(selects[3], { target: { value: drivers[0]._id } });
    submitCreateOrderForm();

    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1));
    const calls = vi.mocked(fetch).mock.calls;
    const ordersCall = calls.find(([url]) => String(url).includes('/orders'));
    expect(JSON.parse(String(ordersCall?.[1]?.body))).toEqual(expect.objectContaining({ reference: expectedValue }));
    expect(calls.some(([url, init]) => String(url).includes('/clients') && init?.method === 'PATCH')).toBe(false);
  });

  it('limpa a referência ao selecionar um cliente antigo ou remover a seleção', async () => {
    const onOrderCreated = vi.fn();
    render(<CreateOrderModal onClose={vi.fn()} onOrderCreated={onOrderCreated} drivers={drivers} />);

    const clientPicker = await screen.findByLabelText('Digite nome, CPF ou CNPJ...');
    fireEvent.change(clientPicker, { target: { value: client._id } });
    fireEvent.change(screen.getByLabelText('Referência (opcional)'), { target: { value: 'Referência personalizada' } });
    fireEvent.change(screen.getByLabelText('Digite nome, CPF ou CNPJ...'), { target: { value: clientWithoutReference._id } });
    expect(screen.getByLabelText('Referência (opcional)')).toHaveValue('');
    fireEvent.click(screen.getByTestId('order-type-retirada'));
    submitCreateOrderForm();
    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1));
    const ordersCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/orders'));
    expect(JSON.parse(String(ordersCall?.[1]?.body))).toEqual(expect.objectContaining({ reference: '' }));

    fireEvent.change(screen.getByLabelText('Digite nome, CPF ou CNPJ...'), { target: { value: '' } });
    expect(screen.queryByLabelText('Referência (opcional)')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Digite nome, CPF ou CNPJ...'), { target: { value: clientWithoutReference._id } });
    expect(screen.getByLabelText('Referência (opcional)')).toHaveValue('');
  });

  it('copia a referência da entrega para retirada planejada e permite editar', async () => {
    const onOrderCreated = vi.fn();
    render(
      <CreateOrderModal
        onClose={vi.fn()}
        onOrderCreated={onOrderCreated}
        drivers={drivers}
        initialPreset={{
          ...client,
          mode: 'withdrawal',
          clientId: client._id,
          reference: 'Entrada pela rua lateral',
          plannedWithdrawalCacambaIds: ['cacamba-1'],
          cacambaNumbers: ['123'],
        }}
      />,
    );

    await screen.findByRole('option', { name: client.city });
    const referenceInput = screen.getByLabelText('Referência (opcional)');
    expect(referenceInput).toHaveValue('Entrada pela rua lateral');
    expect(referenceInput).toBeEnabled();
    fireEvent.change(referenceInput, { target: { value: '  Retirar pelo portão principal  ' } });
    submitCreateOrderForm();

    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1));
    const ordersCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/orders'));
    expect(JSON.parse(String(ordersCall?.[1]?.body))).toEqual(expect.objectContaining({
      type: 'retirada',
      reference: 'Retirar pelo portão principal',
      plannedWithdrawalCacambaIds: ['cacamba-1'],
    }));
  });
});
