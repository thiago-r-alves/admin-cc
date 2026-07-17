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
  city: 'São José dos Campos',
};

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
          return new Response(JSON.stringify([client]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
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
});
