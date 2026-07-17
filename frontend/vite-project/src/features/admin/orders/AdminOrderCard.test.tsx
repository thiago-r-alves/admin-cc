import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../../../interfaces';
import { AdminOrderCard } from './AdminOrderCard';

vi.mock('../../../utils/orderPdf', () => ({
  downloadOrderPdf: vi.fn(async () => undefined),
}));

describe('AdminOrderCard comprovante reutilizado', () => {
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
});
