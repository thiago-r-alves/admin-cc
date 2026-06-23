import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientList from './ClientList';

describe('ClientList', () => {
  const client = {
    _id: 'client-1',
    clientName: 'Cliente Teste',
    cnpjCpf: '11.222.333/0001-44',
    email: 'cliente@example.com',
    rgInscricaoEstadual: 'IE-123',
    contactName: 'Contato',
    contactNumber: '99999-0000',
    address: 'Rua Teste',
    addressNumber: '10',
    neighborhood: 'Centro',
    city: 'Jacarei',
    cep: '12345-000',
  };

  it('exibe e-mail e RG/IE do cliente', () => {
    render(
      <ClientList
        clients={[client]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
    expect(screen.getByText('IE-123')).toBeInTheDocument();
  });

  it('mostra botão Pedidos quando onViewOrders é informado', () => {
    const onViewOrders = vi.fn();

    render(
      <ClientList
        clients={[client]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewOrders={onViewOrders}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /pedidos/i }));

    expect(onViewOrders).toHaveBeenCalledWith(client);
  });
});
