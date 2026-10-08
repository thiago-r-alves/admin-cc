import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IBillingSummaryResponse } from '../../interfaces';
import { BillingTrendChart } from './BillingTrendChart';

const months: IBillingSummaryResponse['timeseries'] = [
  { label: '01/2026', start: '2026-01-01', end: '2026-01-31', revenue: 600, count: 3 },
  { label: '02/2026', start: '2026-02-01', end: '2026-02-28', revenue: 0, count: 0 },
];

describe('BillingTrendChart', () => {
  it('não desenha receita positiva para meses sem faturamento e permite consultar pelo foco', () => {
    render(<BillingTrendChart items={months} />);

    expect(Number(screen.getByTestId('billing-month-bar-0').getAttribute('height'))).toBeGreaterThan(0);
    expect(screen.getByTestId('billing-month-bar-1')).toHaveAttribute('height', '0');
    expect(within(screen.getByTestId('billing-month-details')).getByText('R$ 200,00')).toBeInTheDocument();

    fireEvent.focus(screen.getByRole('button', { name: 'Ver detalhes de 02/2026' }));

    const details = within(screen.getByTestId('billing-month-details'));
    expect(details.getByText('02/2026')).toBeInTheDocument();
    expect(details.getAllByText('R$ 0,00')).toHaveLength(2);
    expect(details.getByText('0')).toBeInTheDocument();
  });

  it('substitui a seleção quando o mês não pertence mais ao novo resumo', () => {
    const { rerender } = render(<BillingTrendChart items={months} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de 02/2026' }));

    rerender(<BillingTrendChart items={[
      { label: '03/2026', start: '2026-03-01', end: '2026-03-31', revenue: 450, count: 1 },
    ]} />);

    const details = within(screen.getByTestId('billing-month-details'));
    expect(details.getByText('03/2026')).toBeInTheDocument();
    expect(details.queryByText('02/2026')).not.toBeInTheDocument();
    expect(details.getAllByText('R$ 450,00')).toHaveLength(2);
  });

  it('lida com meses todos zerados e apresenta os valores completos na tabela acessível', () => {
    render(<BillingTrendChart items={months.map((month) => ({ ...month, revenue: 0, count: 0 }))} />);

    expect(screen.getByTestId('billing-month-bar-0')).toHaveAttribute('height', '0');
    expect(screen.getByTestId('billing-month-bar-1')).toHaveAttribute('height', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));

    const table = within(screen.getByRole('table', { name: 'Faturamento por mês' }));
    expect(table.getAllByRole('row')).toHaveLength(3);
    expect(table.getAllByText('R$ 0,00')).toHaveLength(4);
    expect(screen.getByTestId('billing-trend-chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('leva a rolagem local ao mês em destaque ao abrir e voltar ao gráfico', () => {
    const widthMock = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    try {
      render(<BillingTrendChart items={Array.from({ length: 6 }, (_, index) => ({
        label: `${String(index + 1).padStart(2, '0')}/2026`,
        start: `2026-${String(index + 1).padStart(2, '0')}-01`,
        end: `2026-${String(index + 1).padStart(2, '0')}-28`,
        revenue: index === 4 ? 600 : 0,
        count: index === 4 ? 3 : 0,
      }))} />);

      expect(screen.getByLabelText('Rolagem do gráfico mensal').scrollLeft).toBeGreaterThan(0);
      fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
      fireEvent.click(screen.getByRole('button', { name: 'Gráfico' }));

      expect(screen.getByLabelText('Rolagem do gráfico mensal').scrollLeft).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Ver detalhes de 05/2026' })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      widthMock.mockRestore();
    }
  });

  it('mantém o eixo visível sem deslocar o gráfico quando o mês em destaque já cabe na tela', () => {
    const widthMock = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700);
    try {
      render(<BillingTrendChart items={Array.from({ length: 12 }, (_, index) => ({
        label: `${String(index + 1).padStart(2, '0')}/2026`,
        start: `2026-${String(index + 1).padStart(2, '0')}-01`,
        end: `2026-${String(index + 1).padStart(2, '0')}-28`,
        revenue: index === 4 ? 600 : 0,
        count: index === 4 ? 3 : 0,
      }))} />);

      expect(screen.getByLabelText('Rolagem do gráfico mensal').scrollLeft).toBe(0);
      fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
      fireEvent.click(screen.getByRole('button', { name: 'Gráfico' }));

      expect(screen.getByLabelText('Rolagem do gráfico mensal').scrollLeft).toBe(0);
      expect(screen.getByRole('button', { name: 'Ver detalhes de 05/2026' })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      widthMock.mockRestore();
    }
  });
});
