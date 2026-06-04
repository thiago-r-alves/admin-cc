import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type {
  BillingGranularity,
  IBillingSummaryResponse,
  ICity,
  IClient,
} from '../interfaces';
import { CACAMBA_CONTENT_TYPES } from '../interfaces';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import { getDefaultBillingDateRange, getTopAverageTicketClients, formatCurrency, formatPercent } from './billing.helpers';

const apiUrl = import.meta.env.VITE_API_URL;

const Page = styled.div`
  display: grid;
  gap: 1.25rem;
`;

const SectionCard = styled.section`
  border: 1px solid #f1d3d8;
  border-radius: 22px;
  padding: 1.2rem;
  background:
    linear-gradient(180deg, rgba(255, 245, 247, 0.7) 0%, rgba(255, 255, 255, 0.98) 100%),
    #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  align-items: end;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const sharedFieldCss = `
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0.68rem 0.78rem;
  border: 1px solid #f3c2ca;
  border-radius: 12px;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.9rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
    transform: translateY(-1px);
  }
`;

const Input = styled.input`${sharedFieldCss}`;
const Select = styled.select`${sharedFieldCss}`;

const GranularityBar = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  padding: 0.35rem;
  border: 1px solid #f3c2ca;
  border-radius: 999px;
  background: #fff7f8;
`;

const GranularityButton = styled.button<{ $active: boolean }>`
  min-height: 40px;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#e30613' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#7f1d1d')};
  cursor: pointer;
  font-size: 0.83rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCard = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #f5d5db;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #fff8f8 100%);

  &::after {
    content: '';
    position: absolute;
    inset: auto -40px -40px auto;
    width: 120px;
    height: 120px;
    border-radius: 999px;
    background: rgba(227, 6, 19, 0.07);
  }
`;

const KpiLabel = styled.span`
  display: block;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const KpiValue = styled.strong`
  display: block;
  margin-top: 0.6rem;
  color: #111827;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.05;
`;

const KpiFootnote = styled.span`
  display: block;
  margin-top: 0.45rem;
  color: #7f1d1d;
  font-size: 0.82rem;
  font-weight: 700;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1.08rem;
`;

const CardSubtitle = styled.p`
  margin: 0.3rem 0 0;
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.45;
`;

const TrendChartWrap = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const TrendChartSvg = styled.svg`
  display: block;
  width: 100%;
  height: 280px;
`;

const TrendAxisLabel = styled.text`
  fill: #6b7280;
  font-size: 11px;
  font-weight: 700;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  flex-wrap: wrap;
`;

const LegendPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #f0c8cf;
  border-radius: 999px;
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
  }
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const InsightCard = styled.div`
  border: 1px solid #f2d6da;
  border-radius: 18px;
  padding: 1rem;
  background: #ffffff;
`;

const InsightLabel = styled.span`
  display: block;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const InsightValue = styled.strong`
  display: block;
  margin-top: 0.55rem;
  color: #111827;
  font-size: 1.02rem;
  line-height: 1.35;
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const TableCard = styled(SectionCard)`
  padding: 1rem;
`;

const TableWrap = styled.div`
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.8rem 0.3rem;
    border-bottom: 1px solid #f4e0e4;
    text-align: left;
    font-size: 0.88rem;
  }

  th {
    color: #6b7280;
    font-size: 0.73rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  td {
    color: #1f2937;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const EmptyState = styled.div`
  border: 1px dashed #efb2bb;
  border-radius: 16px;
  padding: 1.25rem;
  background: #fffafa;
  color: #6b7280;
`;

const LoadingState = styled(EmptyState)`
  color: #7f1d1d;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1rem;
`;

const TrendChart = ({ items }: { items: IBillingSummaryResponse['timeseries'] }) => {
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 0);
  const width = 760;
  const height = 280;
  const chartTop = 18;
  const chartBottom = 232;
  const chartHeight = chartBottom - chartTop;
  const slotWidth = width / Math.max(items.length, 1);
  const barWidth = Math.min(52, slotWidth * 0.52);

  return (
    <TrendChartWrap data-testid="billing-trend-chart">
      <TrendChartSvg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução do faturamento">
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

const RankingTable = ({
  title,
  subtitle,
  headers,
  rows,
}: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}) => (
  <TableCard>
    <CardHeader>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </div>
    </CardHeader>
    {rows.length ? (
      <TableWrap>
        <Table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    ) : (
      <EmptyState>Nenhum dado disponível para este recorte.</EmptyState>
    )}
  </TableCard>
);

const FaturamentoPage: React.FC = () => {
  const defaultRange = useMemo(() => getDefaultBillingDateRange(), []);
  const [clients, setClients] = useState<IClient[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [summary, setSummary] = useState<IBillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [granularity, setGranularity] = useState<BillingGranularity>('monthly');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [city, setCity] = useState('');
  const [clientId, setClientId] = useState('');
  const [contentType, setContentType] = useState('');

  const authenticatedFetch = async (input: string) =>
    fetch(input, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

  useEffect(() => {
    let active = true;

    const loadFilters = async () => {
      try {
        setLoadingFilters(true);
        const [clientsResponse, citiesResponse] = await Promise.all([
          authenticatedFetch(`${apiUrl}/clients`),
          authenticatedFetch(`${apiUrl}/cities`),
        ]);

        const [clientsData, citiesData] = await Promise.all([
          clientsResponse.json(),
          citiesResponse.json(),
        ]);

        if (!active) return;

        if (!clientsResponse.ok) {
          throw new Error(clientsData.message || 'Erro ao carregar clientes.');
        }
        if (!citiesResponse.ok) {
          throw new Error(citiesData.message || 'Erro ao carregar cidades.');
        }

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setCities(Array.isArray(citiesData) ? citiesData : []);
      } catch (error) {
        if (!active) return;
        setFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Erro ao carregar filtros de faturamento.',
        });
      } finally {
        if (active) {
          setLoadingFilters(false);
        }
      }
    };

    loadFilters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          startDate,
          endDate,
          granularity,
        });
        if (city) query.append('city', city);
        if (clientId) query.append('clientId', clientId);
        if (contentType) query.append('contentType', contentType);

        const response = await authenticatedFetch(`${apiUrl}/billing/summary?${query.toString()}`);
        const data = await response.json();
        if (!active) return;
        if (!response.ok) {
          throw new Error(data.message || 'Erro ao carregar faturamento.');
        }
        setSummary(data as IBillingSummaryResponse);
      } catch (error) {
        if (!active) return;
        setSummary(null);
        setFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Erro ao carregar faturamento.',
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, [city, clientId, contentType, endDate, granularity, startDate]);

  const hasResults = Boolean(summary && summary.summary.totalCacambas > 0);
  const topAverageClients = useMemo(() => getTopAverageTicketClients(summary), [summary]);
  const granularityLabels: Record<BillingGranularity, string> = {
    monthly: 'Mensal',
    semiannual: 'Semestral',
    annual: 'Anual',
  };

  return (
    <Page>
      <ActionFeedbackBanner
        message={feedback?.message}
        tone={feedback?.tone}
        onClose={() => setFeedback(null)}
      />

      <SectionCard>
        <FilterHeader>
          <div>
            <FilterTitle>Recorte analítico</FilterTitle>
            <CardSubtitle>Escolha a granularidade e os filtros que fazem sentido para validar sua operação.</CardSubtitle>
          </div>

          <GranularityBar aria-label="Granularidade do faturamento">
            {(['monthly', 'semiannual', 'annual'] as BillingGranularity[]).map((item) => (
              <GranularityButton
                key={item}
                type="button"
                $active={granularity === item}
                onClick={() => setGranularity(item)}
              >
                {granularityLabels[item]}
              </GranularityButton>
            ))}
          </GranularityBar>
        </FilterHeader>

        <FiltersGrid>
          <Field>
            <Label htmlFor="billing-start-date">Data inicial</Label>
            <Input
              id="billing-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="billing-end-date">Data final</Label>
            <Input
              id="billing-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="billing-city">Cidade</Label>
            <Select id="billing-city" value={city} onChange={(event) => setCity(event.target.value)} disabled={loadingFilters}>
              <option value="">Todas</option>
              {cities.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="billing-client">Cliente</Label>
            <Select id="billing-client" value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={loadingFilters}>
              <option value="">Todos</option>
              {clients.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.clientName}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="billing-content-type">Tipo de conteúdo</Label>
            <Select
              id="billing-content-type"
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
            >
              <option value="">Todos</option>
              {CACAMBA_CONTENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </FiltersGrid>
      </SectionCard>

      {loading ? (
        <LoadingState>Carregando indicadores de faturamento...</LoadingState>
      ) : !summary ? (
        <EmptyState>Não foi possível carregar o resumo de faturamento.</EmptyState>
      ) : !hasResults ? (
        <EmptyState data-testid="billing-empty-state">
          Nenhum faturamento encontrado para os filtros selecionados.
        </EmptyState>
      ) : (
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
              <KpiFootnote>{granularityLabels[granularity]} com base no recorte atual</KpiFootnote>
            </KpiCard>
          </KpiGrid>

          <SectionCard>
            <CardHeader>
              <div>
                <CardTitle>Evolução do faturamento</CardTitle>
                <CardSubtitle>Leitura por bucket temporal para validar sazonalidade e ritmo de fechamento.</CardSubtitle>
              </div>
            </CardHeader>
            <TrendChart items={summary.timeseries} />
          </SectionCard>

          <InsightsGrid>
            <InsightCard>
              <InsightLabel>Maior cliente</InsightLabel>
              <InsightValue>{summary.highlights.topClientName || 'Sem destaque'}</InsightValue>
            </InsightCard>
            <InsightCard>
              <InsightLabel>Pico do período</InsightLabel>
              <InsightValue>
                {summary.highlights.bestBucketLabel ? `${summary.highlights.bestBucketLabel} • ${formatCurrency(summary.highlights.bestBucketRevenue)}` : 'Sem destaque'}
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
      )}
    </Page>
  );
};

export default FaturamentoPage;
