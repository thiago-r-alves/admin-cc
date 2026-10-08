import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency, formatPercent, getTopAverageTicketClients } from '../../pages/billing.helpers';
import { cn } from '../../utils/cn';
import { BillingClientRanking } from './BillingClientRanking';
import { BillingComparisonCard } from './BillingComparisonCard';
import { BillingIcon } from './BillingIcon';
import { BillingTrendChart } from './BillingTrendChart';
import { RankingTable } from './RankingTable';
import {
  CardHeader,
  CardSubtitle,
  CardTitle,
  InsightCard,
  InsightLabel,
  InsightsGrid,
  InsightValue,
  KpiCard,
  KpiFootnote,
  KpiLabel,
  KpiValue,
  SectionCard,
  TablesGrid,
} from './billing.styles';

type BillingDashboardProps = {
  summary: IBillingSummaryResponse;
};

export const BillingDashboard = ({ summary }: BillingDashboardProps) => {
  const { totalRevenue, totalCacambas, averageTicket, activeClients, previousPeriodRevenue, revenueDeltaPercent } = summary.summary;
  const topAverageClients = getTopAverageTicketClients(summary, summary.topClients.length);
  const hasPrevious = previousPeriodRevenue > 0;
  const monthlyAverage = summary.timeseries.length > 0 ? totalRevenue / summary.timeseries.length : 0;
  const revenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0;
  const formatParticipation = (revenue: number) =>
    `${(totalRevenue > 0 ? revenue / totalRevenue * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  return (
    <>
      <div className="grid min-w-0 grid-cols-[1.45fr_repeat(3,minmax(0,1fr))] gap-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
        <KpiCard className="border-t-2 border-t-brand">
          <div className="flex items-center justify-between gap-3">
            <KpiLabel>Faturamento total</KpiLabel>
            <BillingIcon name="revenue" className="h-5 w-5 shrink-0 text-brand" />
          </div>
          <strong className="mt-3 block break-words text-[clamp(1.8rem,2.5vw,2.5rem)] font-bold leading-tight tabular-nums tracking-tight text-slate-950">{formatCurrency(totalRevenue)}</strong>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-ui-md px-2 py-1 text-xs font-semibold tabular-nums',
              !hasPrevious || revenueDeltaPercent === 0 ? 'bg-slate-100 text-slate-600' : revenueDeltaPercent > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
            )}>
              {hasPrevious && revenueDeltaPercent !== 0 && <BillingIcon name={revenueDeltaPercent > 0 ? 'arrow-up' : 'arrow-down'} className="h-3.5 w-3.5" />}
              {hasPrevious ? formatPercent(revenueDeltaPercent) : 'Sem base anterior'}
            </span>
            {hasPrevious && <span className="text-[11px] text-slate-500">vs período anterior</span>}
          </div>
        </KpiCard>
        <KpiCard>
          <div className="flex items-center justify-between gap-3">
            <KpiLabel>Caçambas faturadas</KpiLabel>
            <BillingIcon name="cacambas" className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <KpiValue>{totalCacambas.toLocaleString('pt-BR')}</KpiValue>
          <KpiFootnote>Retiradas concluídas e pagas</KpiFootnote>
        </KpiCard>
        <KpiCard>
          <div className="flex items-center justify-between gap-3">
            <KpiLabel>Ticket médio por caçamba</KpiLabel>
            <BillingIcon name="revenue" className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <KpiValue>{formatCurrency(averageTicket)}</KpiValue>
          <KpiFootnote>Faturamento dividido pelas caçambas</KpiFootnote>
        </KpiCard>
        <KpiCard>
          <div className="flex items-center justify-between gap-3">
            <KpiLabel>Clientes ativos</KpiLabel>
            <BillingIcon name="clients" className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          <KpiValue>{activeClients.toLocaleString('pt-BR')}</KpiValue>
          <KpiFootnote>{formatCurrency(revenuePerClient)} de receita média por cliente</KpiFootnote>
        </KpiCard>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_290px] gap-5 max-[1100px]:grid-cols-1">
        <SectionCard>
          <CardHeader>
            <div>
              <CardTitle>Evolução do faturamento</CardTitle>
              <CardSubtitle>Receita mensal e volume de caçambas no período selecionado.</CardSubtitle>
            </div>
          </CardHeader>
          <BillingTrendChart items={summary.timeseries} />
        </SectionCard>
        <BillingComparisonCard summary={summary.summary} />
      </div>

      <InsightsGrid>
        <InsightCard>
          <InsightLabel>Maior cliente</InsightLabel>
          <InsightValue>{summary.highlights.topClientName || 'Sem destaque'}</InsightValue>
          <p className="mb-0 mt-2 text-xs leading-5 text-slate-500">
            <span className="font-semibold tabular-nums text-slate-700">{formatCurrency(summary.highlights.topClientRevenue)}</span>
            {' · '}{formatParticipation(summary.highlights.topClientRevenue)} do faturamento
          </p>
        </InsightCard>
        <InsightCard>
          <InsightLabel>Pico do período</InsightLabel>
          <InsightValue>{formatCurrency(summary.highlights.bestBucketRevenue)}</InsightValue>
          <p className="mb-0 mt-2 text-xs text-slate-500">{summary.highlights.bestBucketLabel || 'Sem destaque'} · Maior receita mensal</p>
        </InsightCard>
        <InsightCard>
          <InsightLabel>Média mensal</InsightLabel>
          <InsightValue>{formatCurrency(monthlyAverage)}</InsightValue>
          <p className="mb-0 mt-2 text-xs leading-5 text-slate-500">
            {summary.timeseries.length} {summary.timeseries.length === 1 ? 'mês' : 'meses'} no recorte, incluindo meses sem receita. Os meses nas extremidades podem ser parciais.
          </p>
        </InsightCard>
      </InsightsGrid>

      <TablesGrid>
        <BillingClientRanking clients={summary.topClients} totalRevenue={totalRevenue} />
        <RankingTable
          title="Maiores tickets médios"
          subtitle="Clientes com maior valor médio por retirada."
          headers={['Cliente', 'Ticket médio', 'Receita', 'Caçambas', 'Participação']}
          rows={topAverageClients.map((item) => [
            item.clientName,
            formatCurrency(item.averageTicket),
            formatCurrency(item.revenue),
            item.cacambaCount,
            formatParticipation(item.revenue),
          ])}
        />
        <RankingTable
          title="Cidades com maior faturamento"
          subtitle="Onde a receita está mais concentrada."
          headers={['Cidade', 'Receita', 'Caçambas', 'Ticket médio', 'Participação']}
          rows={summary.topCities.map((item) => [
            item.city,
            formatCurrency(item.revenue),
            item.cacambaCount,
            formatCurrency(item.cacambaCount > 0 ? item.revenue / item.cacambaCount : 0),
            formatParticipation(item.revenue),
          ])}
        />
        <RankingTable
          title="Tipos de conteúdo com maior faturamento"
          subtitle="Ajuda a validar quais resíduos mais puxam a operação."
          headers={['Conteúdo', 'Receita', 'Caçambas', 'Ticket médio', 'Participação']}
          rows={summary.topContentTypes.map((item) => [
            item.contentType,
            formatCurrency(item.revenue),
            item.cacambaCount,
            formatCurrency(item.cacambaCount > 0 ? item.revenue / item.cacambaCount : 0),
            formatParticipation(item.revenue),
          ])}
        />
      </TablesGrid>
    </>
  );
};
