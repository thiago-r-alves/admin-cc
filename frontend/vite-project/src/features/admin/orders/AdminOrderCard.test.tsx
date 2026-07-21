import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../../../interfaces';
import { AdminOrderCard } from './AdminOrderCard';

vi.mock('../../../utils/orderPdf', () => ({
  downloadOrderPdf: vi.fn(async () => undefined),
}));

describe('AdminOrderCard comprovante reutilizado', () => {
  beforeEach(async () => {
    const { downloadOrderPdf } = await import('../../../utils/orderPdf');
    vi.mocked(downloadOrderPdf).mockClear();
  });

  const renderCard = (order: IOrder) =>
    render(
      <AdminOrderCard
        order={order}
        onOpenImage={vi.fn()}
        onEditCacamba={vi.fn()}
        onEditCacambaPrice={vi.fn()}
        onCorrectOrder={vi.fn()}
        onChangeClient={vi.fn()}
        onDeleteOrder={vi.fn()}
        onDeleteCacamba={vi.fn()}
      />,
    );

  it('exibe origem, coletor e motorista atual separadamente', () => {
    const order: IOrder = {
      _id: 'ord-2',
      orderNumber: 202,
      clientId: 'cli-1',
      clientName: 'Cliente',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      type: 'entrega',
      priority: 0,
      status: 'concluido',
      motorista: { _id: 'drv-1', username: 'Motorista atual' },
      deliveryProof: {
        type: 'no_responsible',
        note: 'Portaria fechada.',
        capturedAt: '2026-07-12T12:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'Motorista coletor',
        isReused: true,
        reusedFromOrderId: 'ord-1',
        reusedFromOrderNumber: 101,
        reusedAt: '2026-07-12T14:00:00.000Z',
      },
    };

    renderCard(order);

    expect(screen.getByText('Comprovante reutilizado')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('Motorista Coletor')).toBeInTheDocument();
    expect(screen.getByText('Motorista Atual')).toBeInTheDocument();
    expect(screen.getByText('Portaria fechada.')).toBeInTheDocument();
  });

  it('pergunta se deve incluir QR Code Pix ao baixar pedido de entrega', async () => {
    const { downloadOrderPdf } = await import('../../../utils/orderPdf');
    const order: IOrder = {
      _id: 'ord-entrega',
      orderNumber: 303,
      clientName: 'Cliente Entrega',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      type: 'entrega',
      priority: 0,
      status: 'concluido',
      motorista: { _id: 'drv-1', username: 'Motorista' },
      cacambaPrice: 250,
    };

    renderCard(order);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar Pedido' }));
    expect(screen.getByRole('dialog', { name: 'Incluir QR Code de pagamento?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Incluir QR Code Pix' }));

    await waitFor(() =>
      expect(downloadOrderPdf).toHaveBeenCalledWith(order, { includePaymentQrCode: true }),
    );
  });

  it('mostra nota individual somente quando pedido concluido tem mais de uma cacamba', () => {
    const order: IOrder = {
      _id: 'ord-multi',
      orderNumber: 404,
      clientName: 'Cliente',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      type: 'retirada',
      priority: 0,
      status: 'concluido',
      motorista: { _id: 'drv-1', username: 'Motorista' },
      cacambas: [
        { _id: 'cac-1', numero: '101', tipo: 'retirada', local: 'via_publica', orderId: 'ord-multi', createdAt: '2026-07-12T12:00:00.000Z' },
        { _id: 'cac-2', numero: '102', tipo: 'retirada', local: 'via_publica', orderId: 'ord-multi', createdAt: '2026-07-12T12:00:00.000Z' },
      ],
    };

    const { rerender } = renderCard(order);

    expect(screen.getAllByRole('button', { name: 'Baixar nota individual' })).toHaveLength(2);

    rerender(
      <AdminOrderCard
        order={{ ...order, cacambas: [order.cacambas?.[0] as NonNullable<IOrder['cacambas']>[number]] }}
        onOpenImage={vi.fn()}
        onEditCacamba={vi.fn()}
        onEditCacambaPrice={vi.fn()}
        onCorrectOrder={vi.fn()}
        onChangeClient={vi.fn()}
        onDeleteOrder={vi.fn()}
        onDeleteCacamba={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Baixar nota individual' })).not.toBeInTheDocument();
  });

  it('baixa nota individual de retirada diretamente com a cacamba correta', async () => {
    const { downloadOrderPdf } = await import('../../../utils/orderPdf');
    const firstCacamba = { _id: 'cac-1', numero: '101', tipo: 'retirada' as const, local: 'via_publica' as const, orderId: 'ord-retirada', createdAt: '2026-07-12T12:00:00.000Z' };
    const order: IOrder = {
      _id: 'ord-retirada',
      orderNumber: 405,
      clientName: 'Cliente Retirada',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      type: 'retirada',
      priority: 0,
      status: 'concluido',
      motorista: { _id: 'drv-1', username: 'Motorista' },
      cacambas: [
        firstCacamba,
        { _id: 'cac-2', numero: '102', tipo: 'retirada', local: 'canteiro_obra', orderId: 'ord-retirada', createdAt: '2026-07-12T12:30:00.000Z' },
      ],
    };

    renderCard(order);

    fireEvent.click(screen.getAllByRole('button', { name: 'Baixar nota individual' })[0]);

    await waitFor(() =>
      expect(downloadOrderPdf).toHaveBeenCalledWith(order, {
        includePaymentQrCode: false,
        individualCacamba: firstCacamba,
      }),
    );
  });

  it('em entrega pergunta QR Code ao baixar nota individual e usa a cacamba escolhida', async () => {
    const { downloadOrderPdf } = await import('../../../utils/orderPdf');
    const firstCacamba = { _id: 'cac-1', numero: '101', tipo: 'entrega' as const, local: 'via_publica' as const, orderId: 'ord-entrega', createdAt: '2026-07-12T12:00:00.000Z', price: 120 };
    const order: IOrder = {
      _id: 'ord-entrega',
      orderNumber: 406,
      clientName: 'Cliente Entrega',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      type: 'entrega',
      priority: 0,
      status: 'concluido',
      motorista: { _id: 'drv-1', username: 'Motorista' },
      cacambas: [
        firstCacamba,
        { _id: 'cac-2', numero: '102', tipo: 'entrega', local: 'canteiro_obra', orderId: 'ord-entrega', createdAt: '2026-07-12T12:30:00.000Z', price: 130 },
      ],
    };

    renderCard(order);

    fireEvent.click(screen.getAllByRole('button', { name: 'Baixar nota individual' })[0]);
    expect(screen.getByRole('dialog', { name: 'Incluir QR Code de pagamento?' })).toBeInTheDocument();
    expect(screen.getByText(/nota individual da caçamba 101/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Incluir QR Code Pix' }));

    await waitFor(() =>
      expect(downloadOrderPdf).toHaveBeenCalledWith(order, {
        includePaymentQrCode: true,
        individualCacamba: firstCacamba,
      }),
    );
  });
});
