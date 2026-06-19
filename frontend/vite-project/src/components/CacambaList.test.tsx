import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CacambaList from './CacambaList';
import type { ICacamba } from '../interfaces';

const baseCacamba: ICacamba = {
  _id: 'cac-1',
  numero: '415',
  tipo: 'entrega',
  local: 'via_publica',
  orderId: 'ord-1',
  createdAt: '2026-05-16T12:00:00.000Z',
};

describe('CacambaList', () => {
  it('oculta a badge de tipo quando showTypeBadge=false', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} showTypeBadge={false} />);

    expect(screen.queryByText('Entrega')).not.toBeInTheDocument();
    expect(screen.getByText('#415')).toBeInTheDocument();
  });

  it('mantem a badge de tipo visivel por padrao', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} />);

    expect(screen.getByText('Entrega')).toBeInTheDocument();
  });

  it('usa label customizado na acao de edicao', () => {
    const onEdit = vi.fn();
    render(
      <CacambaList
        cacambas={[baseCacamba]}
        showTitle={false}
        onEdit={onEdit}
        editLabel="Editar caçamba"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));

    expect(onEdit).toHaveBeenCalledWith(baseCacamba);
  });

  it('exibe acao para voltar caçamba para pendente quando callback é informado', () => {
    const onReturnToPending = vi.fn();
    const paidCacamba: ICacamba = {
      ...baseCacamba,
      tipo: 'retirada',
      paymentStatus: 'paga',
    };

    render(
      <CacambaList
        cacambas={[paidCacamba]}
        showTitle={false}
        onReturnToPending={onReturnToPending}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para pendente' }));

    expect(onReturnToPending).toHaveBeenCalledWith(paidCacamba);
  });

  it('exibe a data da entrega vinculada para caçambas de retirada', () => {
    const deliveryDate = new Date('2026-05-10T09:30:00.000Z').toLocaleString('pt-BR');

    render(
      <CacambaList
        cacambas={[
          {
            ...baseCacamba,
            tipo: 'retirada',
            closureDelivery: {
              date: '2026-05-10T09:30:00.000Z',
              driverName: 'Motorista entrega',
              placa: 'ABC1D23',
              orderNumber: 42,
            },
          },
        ]}
        showTitle={false}
      />,
    );

    expect(screen.getByText('Data da entrega:')).toBeInTheDocument();
    expect(screen.getByText(deliveryDate)).toBeInTheDocument();
  });
});
