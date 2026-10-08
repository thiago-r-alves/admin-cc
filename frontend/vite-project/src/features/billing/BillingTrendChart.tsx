import { useEffect, useId, useRef, useState } from 'react';
import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency } from '../../pages/billing.helpers';
import { cn } from '../../utils/cn';
import { BillingIcon } from './BillingIcon';

type BillingTrendChartProps = {
  items: IBillingSummaryResponse['timeseries'];
};

const getMonthKey = (item: IBillingSummaryResponse['timeseries'][number]) => `${item.start}-${item.label}`;
const getAverageTicket = (revenue: number, count: number) => count > 0 ? revenue / count : 0;

export const BillingTrendChart = ({ items }: BillingTrendChartProps) => {
  const chartTitleId = useId();
  const chartDescriptionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [mode, setMode] = useState<'chart' | 'table'>('chart');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedMonth = items.find((item) => getMonthKey(item) === selectedKey)
    || items.reduce<typeof items[number] | undefined>((best, item) => !best || item.revenue > best.revenue ? item : best, undefined);
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 0);
  const width = Math.max(640, Math.floor(containerWidth), items.length * 68 + 124);
  const height = 236;
  const chartLeft = 108;
  const chartRight = 16;
  const chartTop = 22;
  const chartBottom = 218;
  const chartHeight = chartBottom - chartTop;
  const slotWidth = (width - chartLeft - chartRight) / Math.max(items.length, 1);
  const barWidth = Math.min(38, slotWidth * 0.56);
  const currentKey = selectedMonth ? getMonthKey(selectedMonth) : null;
  const selectedIndex = items.findIndex((item) => getMonthKey(item) === currentKey);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (mode !== 'chart' || !scroller || scroller.clientWidth === 0 || selectedIndex < 0) return;
    const monthLeft = chartLeft + selectedIndex * slotWidth;
    const monthRight = monthLeft + slotWidth;
    if (monthLeft >= scroller.scrollLeft && monthRight <= scroller.scrollLeft + scroller.clientWidth) return;
    const monthCenter = monthLeft + slotWidth / 2;
    scroller.scrollLeft = Math.max(0, Math.min(monthCenter - scroller.clientWidth / 2, width - scroller.clientWidth));
  }, [mode, selectedIndex, slotWidth, width]);

  return (
    <div ref={containerRef} className="min-w-0" data-testid="billing-trend-chart">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" aria-hidden />
          Receita por período
        </span>
        <div className="inline-flex rounded-ui-md border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Exibição da evolução">
          {([
            { value: 'chart', label: 'Gráfico', icon: 'trend' },
            { value: 'table', label: 'Tabela', icon: 'table' },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-ui-sm px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus-strong',
                mode === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <BillingIcon name={option.icon} className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-ui-md border border-dashed border-slate-200 p-5 text-sm text-slate-500">Nenhum dado mensal disponível para este recorte.</p>
      ) : mode === 'chart' ? (
        <>
          <div ref={scrollRef} className="w-full min-w-0 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus-strong" tabIndex={0} aria-label="Rolagem do gráfico mensal">
            <div style={{ width }}>
              <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-[236px] w-full" role="img" aria-labelledby={chartTitleId} aria-describedby={chartDescriptionId}>
                <title id={chartTitleId}>Evolução do faturamento</title>
                <desc id={chartDescriptionId}>Faturamento mensal em reais. Selecione um mês nos botões abaixo para consultar receita, caçambas e ticket médio, ou use a opção Tabela para ler todos os valores.</desc>
                {[0, 1, 2, 3].map((index) => {
                  const y = chartTop + chartHeight * (index / 3);
                  return (
                    <g key={index}>
                      <line x1={chartLeft} x2={width - chartRight} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={index === 3 ? undefined : '3 5'} />
                      <text x={chartLeft - 12} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-medium">
                        {formatCurrency((maxRevenue * (3 - index)) / 3)}
                      </text>
                    </g>
                  );
                })}
                {items.map((item, index) => {
                  const x = chartLeft + index * slotWidth + (slotWidth - barWidth) / 2;
                  const barHeight = maxRevenue > 0 && item.revenue > 0 ? item.revenue / maxRevenue * chartHeight : 0;
                  return (
                    <g key={getMonthKey(item)}>
                      <rect
                        data-testid={`billing-month-bar-${index}`}
                        x={x}
                        y={chartBottom - barHeight}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        className={getMonthKey(item) === currentKey ? 'fill-brand' : 'fill-brand/60'}
                      >
                        <title>{item.label}: {formatCurrency(item.revenue)}, {item.count} caçambas</title>
                      </rect>
                    </g>
                  );
                })}
              </svg>
              <div className="grid" style={{ marginLeft: chartLeft, marginRight: chartRight, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
                {items.map((item) => (
                  <button
                    key={getMonthKey(item)}
                    type="button"
                    aria-label={`Ver detalhes de ${item.label}`}
                    aria-pressed={getMonthKey(item) === currentKey}
                    onClick={() => setSelectedKey(getMonthKey(item))}
                    onFocus={() => setSelectedKey(getMonthKey(item))}
                    className={cn(
                      'min-h-11 rounded-ui-md px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-focus-strong',
                      getMonthKey(item) === currentKey ? 'bg-brand-soft font-semibold text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectedMonth && (
            <div className="mt-4 rounded-ui-md border border-slate-200 bg-slate-50/70 p-3.5" data-testid="billing-month-details" aria-live="polite" aria-atomic="true">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">Detalhe do mês</span>
                <strong className="text-xs text-slate-800">{selectedMonth.label}</strong>
              </div>
              <dl className="grid grid-cols-3 gap-3 max-[560px]:grid-cols-1">
                <div className="min-w-0">
                  <dt className="text-[11px] text-slate-500">Receita</dt>
                  <dd className="m-0 mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(selectedMonth.revenue)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] text-slate-500">Caçambas faturadas</dt>
                  <dd className="m-0 mt-1 text-sm font-semibold tabular-nums text-slate-900">{selectedMonth.count}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] text-slate-500">Ticket médio</dt>
                  <dd className="m-0 mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(getAverageTicket(selectedMonth.revenue, selectedMonth.count))}</dd>
                </div>
              </dl>
            </div>
          )}
          <p className="mb-0 mt-3 text-[11px] leading-4 text-slate-400">Selecione um mês para ver os detalhes. {items.length} {items.length === 1 ? 'mês' : 'meses'} no recorte.</p>
        </>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-ui-md border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus-strong" tabIndex={0} aria-label="Rolagem da tabela mensal">
          <table className="w-full min-w-[440px] border-collapse text-sm">
            <caption className="sr-only">Faturamento por mês</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Mês', 'Faturamento', 'Caçambas', 'Ticket médio'].map((label, index) => (
                  <th key={label} scope="col" className={cn('px-3 py-3 text-xs font-semibold text-slate-500', index === 0 ? 'text-left' : 'text-right')}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={getMonthKey(item)} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-3 py-3 text-left text-xs font-medium text-slate-600">{item.label}</th>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-slate-800">{formatCurrency(item.revenue)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600">{item.count}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600">{formatCurrency(getAverageTicket(item.revenue, item.count))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
