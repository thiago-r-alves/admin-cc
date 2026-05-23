import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ClientOrdersSummary from './ClientOrdersSummary';

describe('ClientOrdersSummary', () => {
  it('renderiza totais e contador de selecionadas em modo fechamento', () => {
    render(
      <ClientOrdersSummary
        clientTotal={350}
        totalOrders={2}
        totalCacambas={4}
        closureMode
        selectedCount={1}
      />,
    );

    expect(screen.getByText(/Total do cliente \(Retiradas\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantidade total de pedidos: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantidade total de caçambas: 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Caçambas selecionadas: 1/i)).toBeInTheDocument();
  });
});
