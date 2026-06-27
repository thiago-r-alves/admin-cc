import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency, formatPercent, getTopAverageTicketClients } from '../../pages/billing.helpers';
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
  KpiGrid,
  KpiLabel,
  KpiValue,
  SectionCard,
  TablesGrid,
} from './billing.styles';

type BillingDashboardProps = {
  summary: IBillingSummaryResponse;
};

export const BillingDashboard = ({ summary }: BillingDashboardProps) => {
  const topAverageClients = getTopAverageTicketClients(summary);

  return (
    <>
      <KpiGrid>
        <KpiCard>
          <KpiLabel>Faturamento total</KpiLabel>
          <KpiValue>{formatCurrency(summary.summary.totalRevenue)}</KpiValue>
          <KpiFootnote>Período anterior: {formatCurrency(summary.summary.previousPeriodRevenue)}</KpiFootnote>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Ticket médio por caçamba</KpiLabel>
          <KpiValue>{formatCurrency(summary.summary.averageTicket)}</KpiValue>
          <KpiFootnote>{summary.summary.totalCacambas} retiradas faturadas</KpiFootnote>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Clientes ativos</KpiLabel>
          <KpiValue>{summary.summary.activeClients}</KpiValue>
          <KpiFootnote>{summary.topClients.length} clientes no ranking</KpiFootnote>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Variação vs período anterior</KpiLabel>
          <KpiValue>{formatPercent(summary.summary.revenueDeltaPercent)}</KpiValue>
          <KpiFootnote>Com base no recorte aplicado</KpiFootnote>
        </KpiCard>
      </KpiGrid>

      <SectionCard>
        <CardHeader>
          <div>
            <CardTitle>Evolução do faturamento</CardTitle>
            <CardSubtitle>Leitura por bucket temporal para validar sazonalidade e ritmo de fechamento.</CardSubtitle>
          </div>
        </CardHeader>
        <BillingTrendChart items={summary.timeseries} />
      </SectionCard>

      <InsightsGrid>
        <InsightCard>
          <InsightLabel>Maior cliente</InsightLabel>
          <InsightValue>{summary.highlights.topClientName || 'Sem destaque'}</InsightValue>
        </InsightCard>
        <InsightCard>
          <InsightLabel>Pico do período</InsightLabel>
          <InsightValue>
            {summary.highlights.bestBucketLabel
              ? `${summary.highlights.bestBucketLabel} • ${formatCurrency(summary.highlights.bestBucketRevenue)}`
              : 'Sem destaque'}
          </InsightValue>
        </InsightCard>
        <InsightCard>
          <InsightLabel>Caçambas pagas</InsightLabel>
          <InsightValue>{summary.summary.totalCacambas}</InsightValue>
        </InsightCard>
      </InsightsGrid>

      <TablesGrid>
        <RankingTable
          title="Clientes com maior faturamento"
          subtitle="Quem mais gerou receita no recorte selecionado."
          headers={['Cliente', 'Receita', 'Caçambas', 'Ticket médio']}
          rows={summary.topClients.slice(0, 5).map((item) => [
            item.clientName,
            formatCurrency(item.revenue),
            item.cacambaCount,
            formatCurrency(item.averageTicket),
          ])}
        />
        <RankingTable
          title="Maiores tickets médios"
          subtitle="Clientes com maior valor médio por retirada."
          headers={['Cliente', 'Ticket médio', 'Receita', 'Caçambas']}
          rows={topAverageClients.map((item) => [
            item.clientName,
            formatCurrency(item.averageTicket),
            formatCurrency(item.revenue),
            item.cacambaCount,
          ])}
        />
        <RankingTable
          title="Cidades com maior faturamento"
          subtitle="Onde a receita está mais concentrada."
          headers={['Cidade', 'Receita', 'Caçambas']}
          rows={summary.topCities.slice(0, 5).map((item) => [
            item.city,
            formatCurrency(item.revenue),
            item.cacambaCount,
          ])}
        />
        <RankingTable
          title="Tipos de conteúdo com maior faturamento"
          subtitle="Ajuda a validar quais resíduos mais puxam a operação."
          headers={['Conteúdo', 'Receita', 'Caçambas']}
          rows={summary.topContentTypes.slice(0, 5).map((item) => [
            item.contentType,
            formatCurrency(item.revenue),
            item.cacambaCount,
          ])}
        />
      </TablesGrid>
    </>
  );
};
