import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../../../interfaces';
import { AdminOrderCard } from './AdminOrderCard';

describe('AdminOrderCard comprovante reutilizado', () => {
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

    render(
      <AdminOrderCard
        order={order}
        onOpenImage={vi.fn()}
        onEditCacamba={vi.fn()}
        onEditCacambaPrice={vi.fn()}
        onCorrectOrder={vi.fn()}
        onChangeClient={vi.fn()}
        onDeleteOrder={vi.fn()}
      />,
    );

    expect(screen.getByText('Comprovante reutilizado')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('Motorista coletor')).toBeInTheDocument();
    expect(screen.getByText('Motorista atual')).toBeInTheDocument();
    expect(screen.getByText('Portaria fechada.')).toBeInTheDocument();
  });
});
