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
    expect(screen.getByText(/Quantidade total de ca.*mbas: 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Ca.*mbas selecionadas: 1/i)).toBeInTheDocument();
  });

  it('renderiza apenas total quando compactOnlyTotal=true', () => {
    render(
      <ClientOrdersSummary
        clientTotal={1200}
        totalOrders={10}
        totalCacambas={30}
        closureMode
        selectedCount={5}
        compactOnlyTotal
      />,
    );

    expect(screen.getByText(/Total do cliente \(Retiradas\):/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quantidade total de pedidos:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quantidade total de ca.*mbas:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ca.*mbas selecionadas:/i)).not.toBeInTheDocument();
  });
});
