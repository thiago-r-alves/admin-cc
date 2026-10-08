import type { BillingFilters } from './billing.types';
import { BillingIcon } from './BillingIcon';
import { formatBillingDateRange } from '../../pages/billing.helpers';

type BillingPageHeaderProps = {
  filters: BillingFilters;
  clientName?: string;
  loading: boolean;
  onRefresh: () => void;
};

export const BillingPageHeader = ({ filters, clientName, loading, onRefresh }: BillingPageHeaderProps) => (
  <header className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Visão geral financeira</p>
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-slate-950">Faturamento</h1>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-500">Acompanhe receita, volume e desempenho por período.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-ui-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-60">
        <BillingIcon name="refresh" className={loading ? 'animate-spin motion-reduce:animate-none' : ''} />
        Atualizar dados
      </button>
    </div>
    <div data-testid="billing-applied-filters" aria-label="Filtros aplicados" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-ui-lg border border-slate-200 bg-white px-4 py-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ui-md bg-brand-soft text-brand"><BillingIcon name="calendar" /></span>
        <div className="min-w-0">
          <p className="m-0 text-xs text-slate-500">Período em análise</p>
          <p className="m-0 mt-1 font-semibold text-slate-800">{formatBillingDateRange(filters.startDate, filters.endDate)}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-relaxed text-slate-500">
        <span>Cidade: <strong className="font-semibold text-slate-700">{filters.city || 'Todas'}</strong></span>
        <span className="min-w-0 break-words">Cliente: <strong className="font-semibold text-slate-700">{filters.clientId ? clientName || 'Cliente selecionado' : 'Todos'}</strong></span>
        <span>Conteúdo: <strong className="font-semibold text-slate-700">{filters.contentType || 'Todos'}</strong></span>
      </div>
    </div>
  </header>
);
