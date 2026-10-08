import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency, formatPercent } from '../../pages/billing.helpers';
import { cn } from '../../utils/cn';
import { BillingIcon } from './BillingIcon';
import { CardSubtitle, CardTitle, SectionCard } from './billing.styles';

type BillingComparisonCardProps = {
  summary: IBillingSummaryResponse['summary'];
};

export const BillingComparisonCard = ({ summary }: BillingComparisonCardProps) => {
  const difference = summary.totalRevenue - summary.previousPeriodRevenue;
  const maxRevenue = Math.max(summary.totalRevenue, summary.previousPeriodRevenue);
  const hasPrevious = summary.previousPeriodRevenue > 0;

  return (
    <SectionCard className="flex h-full flex-col">
      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-ui-md border border-slate-200 bg-slate-50 text-slate-500">
        <BillingIcon name="trend" className="h-4 w-4" />
      </span>
      <CardTitle>Comparativo de períodos</CardTitle>
      <CardSubtitle>Intervalo anterior de mesma duração, com os mesmos filtros.</CardSubtitle>
      <div className="my-6 grid gap-5">
        {[
          { label: 'Período atual', value: summary.totalRevenue, current: true },
          { label: 'Período anterior', value: summary.previousPeriodRevenue, current: false },
        ].map((period) => (
          <div key={period.label}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-500">{period.label}</span>
              <strong className="tabular-nums text-slate-800">{formatCurrency(period.value)}</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <div className={cn('h-full rounded-full', period.current ? 'bg-brand' : 'bg-slate-300')} style={{ width: `${maxRevenue > 0 ? period.value / maxRevenue * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <p className="mb-2 mt-0 text-xs text-slate-500">Variação vs período anterior</p>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-lg tabular-nums text-slate-900">{difference > 0 ? '+ ' : ''}{formatCurrency(difference)}</strong>
          <span className="rounded-ui-md bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600">
            {hasPrevious ? formatPercent(summary.revenueDeltaPercent) : 'Sem base anterior'}
          </span>
        </div>
        <p className="mb-0 mt-3 text-[11px] leading-4 text-slate-400">Diferença entre as receitas dos dois intervalos.</p>
      </div>
    </SectionCard>
  );
};
