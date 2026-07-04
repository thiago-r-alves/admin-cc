import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../../interfaces';
import OrderCard from './OrderCard';

const baseOrder: IOrder = {
  _id: 'ord-1',
  orderNumber: 4001,
  clientId: 'cli-1',
  clientName: 'Cliente Teste',
  contactName: '',
  contactNumber: '',
  neighborhood: '',
  address: '',
  addressNumber: '',
  type: 'retirada',
  priority: 0,
  status: 'concluido',
  createdAt: '2026-05-10T10:00:00.000Z',
  cacambas: [
    {
      _id: 'cac-1',
      numero: '101',
      tipo: 'retirada',
      orderId: 'ord-1',
      createdAt: '2026-05-10T10:00:00.000Z',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 100,
    },
  ],
};

describe('OrderCard', () => {
  it('destaca o numero do pedido em vermelho', () => {
    render(
      <OrderCard
        order={baseOrder}
        closureMode
        selectedCacambaIds={[]}
        onToggleSelect={vi.fn()}
        onImageClick={vi.fn()}
        onEditPrice={vi.fn()}
        onEditContentType={vi.fn()}
      />,
    );

    expect(getComputedStyle(screen.getByText('Pedido #4001')).color).toBe('rgb(227, 6, 19)');
  });

  it('mostra motorista e placa do pedido no card da caçamba', () => {
    render(
      <OrderCard
        order={{
          ...baseOrder,
          motorista: { _id: 'drv-1', username: 'Motorista Pedido' },
          placa: 'ped1a23',
        }}
        closureMode={false}
        selectedCacambaIds={[]}
        onToggleSelect={vi.fn()}
        onImageClick={vi.fn()}
        onEditPrice={vi.fn()}
        onEditContentType={vi.fn()}
      />,
    );

    expect(screen.getByText(/Motorista Pedido/)).toBeInTheDocument();
    expect(screen.getByText(/PED1A23/)).toBeInTheDocument();
  });

  it('abre edicao da caçamba com o tipo do pedido no fechamento', () => {
    const onEditCacamba = vi.fn();
    render(
      <OrderCard
        order={baseOrder}
        closureMode
        selectedCacambaIds={[]}
        onToggleSelect={vi.fn()}
        onImageClick={vi.fn()}
        onEditPrice={vi.fn()}
        onEditContentType={vi.fn()}
        onEditCacamba={onEditCacamba}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));

    expect(onEditCacamba).toHaveBeenCalledWith({
      cacamba: expect.objectContaining({ _id: 'cac-1' }),
      orderType: 'retirada',
    });
  });
});
