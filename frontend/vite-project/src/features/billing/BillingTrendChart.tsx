import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency } from '../../pages/billing.helpers';
import {
  LegendPill,
  LegendRow,
  TrendAxisLabel,
  TrendChartSvg,
  TrendChartWrap,
} from './billing.styles';

type BillingTrendChartProps = {
  items: IBillingSummaryResponse['timeseries'];
};

export const BillingTrendChart = ({ items }: BillingTrendChartProps) => {
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 0);
  const width = Math.max(760, items.length * 84);
  const height = 280;
  const chartTop = 18;
  const chartBottom = 232;
  const chartHeight = chartBottom - chartTop;
  const slotWidth = width / Math.max(items.length, 1);
  const barWidth = Math.min(52, slotWidth * 0.52);

  return (
    <TrendChartWrap data-testid="billing-trend-chart">
      <TrendChartSvg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Evolução do faturamento"
      >
        <defs>
          <linearGradient id="billing-bar-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const y = chartTop + chartHeight * (index / 3);
          return (
            <g key={index}>
              <line x1="12" x2={width - 12} y1={y} y2={y} stroke="#f5d5db" strokeDasharray="4 6" />
              <TrendAxisLabel x="4" y={y - 4}>
                {formatCurrency((maxRevenue * (3 - index)) / 3)}
              </TrendAxisLabel>
            </g>
          );
        })}
        {items.map((item, index) => {
          const x = index * slotWidth + (slotWidth - barWidth) / 2;
          const safeHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * chartHeight : 6;
          const y = chartBottom - safeHeight;
          return (
            <g key={`${item.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(safeHeight, 6)}
                rx="16"
                fill="url(#billing-bar-gradient)"
              />
              <TrendAxisLabel x={x + barWidth / 2} y={height - 18} textAnchor="middle">
                {item.label}
              </TrendAxisLabel>
            </g>
          );
        })}
      </TrendChartSvg>
      <LegendRow>
        <LegendPill>Receita por período</LegendPill>
        <span style={{ color: '#6b7280', fontSize: '0.82rem', fontWeight: 700 }}>
          Total de buckets: {items.length}
        </span>
      </LegendRow>
    </TrendChartWrap>
  );
};
