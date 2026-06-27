import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../interfaces';
import CorrectOrderModal from './CorrectOrderModal';

const driver = { _id: 'driver-1', username: 'Motorista 1' };

const baseOrder: IOrder = {
  _id: 'order-1',
  orderNumber: 10,
  clientId: 'client-1',
  clientName: 'Cliente',
  contactName: 'Contato',
  contactNumber: '123',
  neighborhood: 'Centro',
  address: 'Rua 1',
  addressNumber: '10',
  type: 'retirada',
  priority: 0,
  status: 'pendente',
  motorista: driver,
  cacambas: [],
};

const submitCorrectionForm = () => {
  const form = screen.getByRole('button', { name: 'Salvar correção' }).closest('form');
  if (!form) throw new Error('Correction form not found.');
  fireEvent.submit(form);
};

describe('CorrectOrderModal', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        new Response(JSON.stringify({ ...baseOrder, ...(init?.body ? JSON.parse(String(init.body)) : {}) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  it('exige valor ao corrigir pedido para entrega', async () => {
    const onChanged = vi.fn();
    const onClose = vi.fn();
    render(
      <CorrectOrderModal
        apiUrl="http://api.test"
        order={baseOrder}
        drivers={[driver]}
        onClose={onClose}
        onChanged={onChanged}
      />,
    );

    expect(screen.getByLabelText('Valor da caçamba (R$)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tipo do pedido'), { target: { value: 'entrega' } });
    expect(screen.getByLabelText('Valor da caçamba (R$)')).toBeInTheDocument();

    submitCorrectionForm();
    expect(await screen.findByText('Informe o valor da caçamba para pedidos de entrega.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Valor da caçamba (R$)'), { target: { value: '190,25' } });
    submitCorrectionForm();

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body));
    expect(body).toEqual(
      expect.objectContaining({
        type: 'entrega',
        cacambaPrice: 190.25,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('envia valor ao corrigir pedido para retirada quando informado', async () => {
    const onChanged = vi.fn();
    render(
      <CorrectOrderModal
        apiUrl="http://api.test"
        order={baseOrder}
        drivers={[driver]}
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    fireEvent.change(screen.getByLabelText('Valor da caçamba (R$)'), { target: { value: '180' } });
    submitCorrectionForm();

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body));
    expect(body).toEqual(
      expect.objectContaining({
        type: 'retirada',
        cacambaPrice: 180,
      }),
    );
  });
});
