import React, { useEffect, useMemo, useState } from 'react';
import type {
  IBillingSummaryResponse,
  ICity,
  IClient,
} from '../interfaces';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import { BillingDashboard } from '../features/billing/BillingDashboard';
import { BillingFiltersPanel } from '../features/billing/BillingFiltersPanel';
import { BILLING_GRANULARITY } from '../features/billing/billing.constants';
import type { BillingFilters } from '../features/billing/billing.types';
import { getDefaultBillingDateRange } from './billing.helpers';

const apiUrl = import.meta.env.VITE_API_URL;

import {
  Page,
  EmptyState,
  LoadingState,
} from '../features/billing/billing.styles';

const FaturamentoPage: React.FC = () => {
  const defaultRange = useMemo(() => getDefaultBillingDateRange(), []);
  const [clients, setClients] = useState<IClient[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [summary, setSummary] = useState<IBillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const initialFilters = useMemo<BillingFilters>(() => ({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    city: '',
    clientId: '',
    contentType: '',
  }), [defaultRange.endDate, defaultRange.startDate]);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [city, setCity] = useState('');
  const [clientId, setClientId] = useState('');
  const [contentType, setContentType] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<BillingFilters>(initialFilters);

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
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          granularity: BILLING_GRANULARITY,
        });
        if (appliedFilters.city) query.append('city', appliedFilters.city);
        if (appliedFilters.clientId) query.append('clientId', appliedFilters.clientId);
        if (appliedFilters.contentType) query.append('contentType', appliedFilters.contentType);

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
  }, [appliedFilters]);

  const hasResults = Boolean(summary && summary.summary.totalCacambas > 0);
  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({
      startDate,
      endDate,
      city,
      clientId,
      contentType,
    });
  };

  const handleClearFilters = () => {
    setStartDate(initialFilters.startDate);
    setEndDate(initialFilters.endDate);
    setCity(initialFilters.city);
    setClientId(initialFilters.clientId);
    setContentType(initialFilters.contentType);
    setAppliedFilters(initialFilters);
  };

  return (
    <Page>
      <ActionFeedbackBanner
        message={feedback?.message}
        tone={feedback?.tone}
        onClose={() => setFeedback(null)}
      />

      <BillingFiltersPanel
        startDate={startDate}
        endDate={endDate}
        city={city}
        clientId={clientId}
        contentType={contentType}
        clients={clients}
        cities={cities}
        loading={loading}
        loadingFilters={loadingFilters}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onCityChange={setCity}
        onClientIdChange={setClientId}
        onContentTypeChange={setContentType}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <LoadingState>Carregando indicadores de faturamento...</LoadingState>
      ) : !summary ? (
        <EmptyState>Não foi possível carregar o resumo de faturamento.</EmptyState>
      ) : !hasResults ? (
        <EmptyState data-testid="billing-empty-state">
          Nenhum faturamento encontrado para os filtros selecionados.
        </EmptyState>
      ) : (
        <BillingDashboard summary={summary} />
      )}
    </Page>
  );
};

export default FaturamentoPage;
