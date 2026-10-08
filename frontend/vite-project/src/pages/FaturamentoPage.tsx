import React, { useEffect, useMemo, useState } from 'react';
import type { IBillingSummaryResponse, ICity, IClient } from '../interfaces';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import { BillingDashboard } from '../features/billing/BillingDashboard';
import { BillingFiltersPanel } from '../features/billing/BillingFiltersPanel';
import { BillingPageHeader } from '../features/billing/BillingPageHeader';
import { BILLING_GRANULARITY } from '../features/billing/billing.constants';
import type { BillingFilters } from '../features/billing/billing.types';
import { Page, EmptyState, LoadingState } from '../features/billing/billing.styles';
import { getDefaultBillingDateRange } from './billing.helpers';

const apiUrl = import.meta.env.VITE_API_URL;
const authenticatedFetch = (input: string) =>
  fetch(input, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const FaturamentoPage: React.FC = () => {
  const initialFilters = useMemo<BillingFilters>(() => ({
    ...getDefaultBillingDateRange(), city: '', clientId: '', contentType: '',
  }), []);
  const [clients, setClients] = useState<IClient[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [summary, setSummary] = useState<IBillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [filters, setFilters] = useState<BillingFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<BillingFilters>(initialFilters);
  const [summaryFilters, setSummaryFilters] = useState<BillingFilters>(initialFilters);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const loadFilters = async () => {
      try {
        const [clientsResponse, citiesResponse] = await Promise.all([
          authenticatedFetch(`${apiUrl}/clients`), authenticatedFetch(`${apiUrl}/cities`),
        ]);
        const [clientsData, citiesData] = await Promise.all([
          clientsResponse.json(), citiesResponse.json(),
        ]);
        if (!active) return;
        if (!clientsResponse.ok) throw new Error(clientsData.message || 'Erro ao carregar clientes.');
        if (!citiesResponse.ok) throw new Error(citiesData.message || 'Erro ao carregar cidades.');
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setCities(Array.isArray(citiesData) ? citiesData : []);
      } catch (error) {
        if (active) setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Erro ao carregar filtros de faturamento.' });
      } finally {
        if (active) setLoadingFilters(false);
      }
    };
    void loadFilters();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          startDate: appliedFilters.startDate, endDate: appliedFilters.endDate,
          granularity: BILLING_GRANULARITY,
        });
        if (appliedFilters.city) query.append('city', appliedFilters.city);
        if (appliedFilters.clientId) query.append('clientId', appliedFilters.clientId);
        if (appliedFilters.contentType) query.append('contentType', appliedFilters.contentType);
        const response = await authenticatedFetch(`${apiUrl}/billing/summary?${query.toString()}`);
        const data = await response.json();
        if (!active) return;
        if (!response.ok) throw new Error(data.message || 'Erro ao carregar faturamento.');
        setSummary(data as IBillingSummaryResponse);
        setSummaryFilters(appliedFilters);
      } catch (error) {
        if (active) setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Erro ao carregar faturamento.' });
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSummary();
    return () => { active = false; };
  }, [appliedFilters, refreshVersion]);

  const displayedFilters = summary ? summaryFilters : appliedFilters;
  const hasPendingChanges = (Object.keys(filters) as Array<keyof BillingFilters>)
    .some((key) => filters[key] !== displayedFilters[key]);
  const changeFilter = (key: keyof BillingFilters, value: string) =>
    setFilters((previous) => ({ ...previous, [key]: value }));

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!filters.startDate || !filters.endDate) {
      setFeedback({ tone: 'error', message: 'Informe a data inicial e a data final.' });
      return;
    }
    if (filters.startDate > filters.endDate) {
      setFeedback({ tone: 'error', message: 'A data inicial deve ser anterior ou igual à data final.' });
      return;
    }
    setFeedback(null);
    setAppliedFilters({ ...filters });
  };
  const handleClearFilters = () => {
    setFeedback(null);
    setFilters(initialFilters);
    setAppliedFilters({ ...initialFilters });
  };
  const handleRefresh = () => {
    setFeedback(null);
    setRefreshVersion((version) => version + 1);
  };

  return (
    <Page>
      <BillingPageHeader
        filters={displayedFilters}
        clientName={clients.find((client) => client._id === displayedFilters.clientId)?.clientName}
        loading={loading}
        onRefresh={handleRefresh}
      />
      <ActionFeedbackBanner message={feedback?.message} tone={feedback?.tone} onClose={() => setFeedback(null)} />
      <BillingFiltersPanel
        {...filters}
        clients={clients}
        cities={cities}
        loading={loading}
        loadingFilters={loadingFilters}
        hasPendingChanges={hasPendingChanges}
        onStartDateChange={(value) => changeFilter('startDate', value)}
        onEndDateChange={(value) => changeFilter('endDate', value)}
        onCityChange={(value) => changeFilter('city', value)}
        onClientIdChange={(value) => changeFilter('clientId', value)}
        onContentTypeChange={(value) => changeFilter('contentType', value)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
      {loading && <LoadingState role="status" aria-live="polite">{summary ? 'Atualizando indicadores de faturamento...' : 'Carregando indicadores de faturamento...'}</LoadingState>}
      <div className="grid min-w-0 gap-6" aria-busy={loading}>
        {!summary ? (
          !loading && <EmptyState>Não foi possível carregar o resumo de faturamento. Use Atualizar dados para tentar novamente.</EmptyState>
        ) : summary.summary.totalCacambas === 0 ? (
          <EmptyState data-testid="billing-empty-state">Nenhum faturamento encontrado para os filtros selecionados. Experimente ampliar o período ou limpar os filtros.</EmptyState>
        ) : (
          <BillingDashboard summary={summary} />
        )}
      </div>
      <details className="rounded-ui-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-600">Como os valores são calculados</summary>
        <p className="mb-0 mt-3">O faturamento considera retiradas concluídas, com caçambas marcadas como pagas e preço informado. As datas seguem a última atualização do pedido de retirada. A comparação usa o intervalo anterior de mesma duração e os mesmos filtros.</p>
      </details>
    </Page>
  );
};

export default FaturamentoPage;
