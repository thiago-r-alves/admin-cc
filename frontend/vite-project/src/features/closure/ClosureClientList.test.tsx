import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClosureClientList } from './ClosureClientList';

describe('ClosureClientList', () => {
  it('mostra spinner no botão que está abrindo o modal', () => {
    render(
      <ClosureClientList
        clients={[
          {
            _id: 'cli-1',
            clientName: 'Cliente Teste',
            hasPendingClosureItems: true,
          },
        ]}
        loading={false}
        paymentStatus="pending"
        openingAction={{ clientId: 'cli-1', viewMode: 'create_closure' }}
        onOpenCreateClosure={vi.fn()}
        onOpenGeneratedNotes={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Gerar fechamento do cliente' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[aria-hidden="true"]')).toHaveClass('animate-spin');
  });

  it('não mostra gerar fechamento no filtro de pagas', () => {
    render(
      <ClosureClientList
        clients={[
          {
            _id: 'cli-1',
            clientName: 'Cliente Pago',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: true,
          },
        ]}
        loading={false}
        paymentStatus="paid"
        onOpenCreateClosure={vi.fn()}
        onOpenGeneratedNotes={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Gerar fechamento do cliente' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver notas geradas' })).toBeInTheDocument();
  });

  it('não mostra notas geradas no filtro de informações pendentes', () => {
    render(
      <ClosureClientList
        clients={[
          {
            _id: 'cli-1',
            clientName: 'Cliente Pendencia',
            hasPendingClosureMetadata: true,
            hasGeneratedClosureGroups: true,
          },
        ]}
        loading={false}
        paymentStatus="metadata_pending"
        onOpenCreateClosure={vi.fn()}
        onOpenGeneratedNotes={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ver caçambas com informações pendentes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver notas geradas' })).not.toBeInTheDocument();
  });
});
