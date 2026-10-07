import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../../interfaces';
import { DriverOrdersSection } from './DriverOrdersSection';

const baseOrder: IOrder = {
  _id: 'order-1',
  orderNumber: 101,
  clientName: 'Cliente Teste',
  contactName: 'Responsável',
  contactNumber: '12999990000',
  address: 'Rua A',
  addressNumber: '10',
  neighborhood: 'Centro',
  city: 'São José dos Campos',
  cep: '12200-000',
  type: 'entrega',
  priority: 0,
  status: 'pendente',
  cacambas: [],
};

const renderOrders = (order: IOrder, onOpenRoute = vi.fn()) =>
  render(
    <DriverOrdersSection
      orders={[order]}
      onOpenRoute={onOpenRoute}
      onCompleteOrder={vi.fn()}
      onAddCacamba={vi.fn()}
      onOpenImage={vi.fn()}
      onEditCacamba={vi.fn()}
      onDeleteCacamba={vi.fn()}
    />,
  );

describe('DriverOrdersSection referência', () => {
  it('mostra a referência separada do endereço e mantém apenas os campos do endereço na rota', () => {
    const onOpenRoute = vi.fn();
    renderOrders({ ...baseOrder, reference: '  Portão azul, ao lado da padaria.  ' }, onOpenRoute);

    expect(screen.getByText('Referência')).toBeInTheDocument();
    expect(screen.getByText('Portão azul, ao lado da padaria.')).toBeInTheDocument();
    expect(screen.getByText('Rua A, 10 - Centro - São José dos Campos - CEP 12200-000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir no Maps' }));

    expect(onOpenRoute).toHaveBeenCalledTimes(1);
    expect(onOpenRoute).toHaveBeenCalledWith('Rua A', '10', 'Centro', 'São José dos Campos', '12200-000');
  });

  it.each([undefined, '', ' \n\t '])('oculta referência ausente ou vazia (%j)', (reference) => {
    renderOrders({ ...baseOrder, reference });

    expect(screen.queryByText('Referência')).not.toBeInTheDocument();
    expect(screen.getByText('Endereço da obra')).toBeInTheDocument();
  });

  it('preserva texto longo e quebras de linha da referência', () => {
    const reference = `Entrada pelo portão lateral.\n${'Seguir pelo corredor até a obra. '.repeat(30).trim()}`;
    renderOrders({ ...baseOrder, reference });

    const label = screen.getByText('Referência');
    expect(label.nextElementSibling?.textContent).toBe(reference);
  });
});
