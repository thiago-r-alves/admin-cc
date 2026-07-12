import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IClient, IPaginatedResponse } from '../interfaces';
import ClientOrdersModal from '../components/ClientOrdersModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import type { ClientOrdersModalProps } from '../components/clientOrdersModal/types';
import { ClosureClientList } from '../features/closure/ClosureClientList';
import { ClosureFilters } from '../features/closure/ClosureFilters';
import { isIsoDate } from '../features/closure/closure.helpers';
import Pagination from '../components/ui/Pagination';
import { getCachedQuery, invalidateFrontendQueryCache, runCachedQuery } from '../services/queryCache';
import type { ClosurePaymentStatus } from '../features/closure/closure.types';

import {
  Container,
  Header,
  Title,
  Subtitle,
} from '../features/closure/closure.styles';

const apiUrl = import.meta.env.VITE_API_URL;
type OrdersModalViewMode = NonNullable<ClientOrdersModalProps['viewMode']>;
type OpeningOrdersModal = {
  clientId: string;
  viewMode: OrdersModalViewMode;
} | null;

const FechamentoPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1 });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<ClosurePaymentStatus>('all');
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientSnapshot, setSelectedClientSnapshot] = useState<IClient | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<OrdersModalViewMode>('create_closure');
  const [openingOrdersModal, setOpeningOrdersModal] = useState<OpeningOrdersModal>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const isOrdersModalOpenRef = useRef(false);
  const selectedClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    isOrdersModalOpenRef.current = isOrdersModalOpen;
  }, [isOrdersModalOpen]);

  useEffect(() => {
    selectedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  const fetchClosureClients = useCallback(async (signal?: AbortSignal) => {
    const keepModalContext = isOrdersModalOpenRef.current;
    try {
      if (!keepModalContext) {
        setLoading(true);
      }
      const query = new URLSearchParams();
      query.append('closure', 'true');
      query.append('paginated', 'true');
      query.append('page', String(page));
      query.append('pageSize', '25');
      if (isIsoDate(startDate)) {
        query.append('startDate', startDate);
      }
      if (isIsoDate(endDate)) {
        query.append('endDate', endDate);
      }
      query.append('paymentStatus', paymentStatus);
      if (debouncedSearch.trim()) query.append('q', debouncedSearch.trim());
      const url = `${apiUrl}/clients?${query.toString()}`;
      const cacheKey = `closure-clients:${url}`;
      const cached = getCachedQuery<IPaginatedResponse<IClient>>(cacheKey);
      if (cached) {
        setClients(cached.items);
        setPagination({ totalItems: cached.totalItems, totalPages: cached.totalPages });
        if (!keepModalContext) setLoading(false);
      }
      const data = await runCachedQuery(cacheKey, async () => {
        const response = await fetch(url, { signal, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'Erro ao buscar fechamentos.');
        return Array.isArray(body)
          ? { items: body, page: 1, pageSize: body.length, totalItems: body.length, totalPages: 1 }
          : body as IPaginatedResponse<IClient>;
      });
      if (signal?.aborted) return;
      const fetchedClients = data.items;
      setClients(fetchedClients);
      setPagination({ totalItems: data.totalItems, totalPages: data.totalPages });
      setSelectedClientSnapshot((current) => {
        const nextSelectedClientId = selectedClientIdRef.current;
        if (!nextSelectedClientId) return current;
        return fetchedClients.find((client) => client._id === nextSelectedClientId) || current;
      });
    } catch (error) {
      if (signal?.aborted) return;
      console.error(error);
      setFeedback({ tone: 'error', message: 'Erro ao buscar fechamentos.' });
      if (!keepModalContext) {
        setClients([]);
      }
    } finally {
      if (!keepModalContext) {
        setLoading(false);
      }
    }
  }, [startDate, endDate, paymentStatus, debouncedSearch, page]);

  const handleClosureStateChanged = useCallback(async () => {
    invalidateFrontendQueryCache('closure-clients:');
    await fetchClosureClients();
  }, [fetchClosureClients]);

  const openOrdersModal = (
    client: IClient,
    viewMode: OrdersModalViewMode = 'create_closure',
  ) => {
    setSelectedClientId(client._id);
    setSelectedClientSnapshot(client);
    setModalViewMode(viewMode);
    setOpeningOrdersModal({ clientId: client._id, viewMode });
    setIsOrdersModalOpen(true);
  };

  const closeOrdersModal = () => {
    setIsOrdersModalOpen(false);
    setSelectedClientId(null);
    setSelectedClientSnapshot(null);
    setModalViewMode('create_closure');
    setOpeningOrdersModal(null);
  };

  const handleOrdersModalInitialContentReady = useCallback(() => {
    setOpeningOrdersModal(null);
  }, []);

  const modalClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((client) => client._id === selectedClientId) || selectedClientSnapshot;
  }, [clients, selectedClientId, selectedClientSnapshot]);

  const showBlockingLoading = loading && !isOrdersModalOpen;

  useEffect(() => {
    const controller = new AbortController();
    void fetchClosureClients(controller.signal);
    return () => controller.abort();
  }, [fetchClosureClients]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [startDate, endDate, paymentStatus]);

  return (
    <Container>
      <ActionFeedbackBanner
        message={feedback?.message}
        tone={feedback?.tone}
        onClose={() => setFeedback(null)}
      />

      <Header>
        <div>
          <Title>Fechamento</Title>
          <Subtitle>Retiradas concluidas e entregas ainda em obra dentro do periodo selecionado</Subtitle>
        </div>
      </Header>

      <ClosureFilters
        startDate={startDate}
        endDate={endDate}
        paymentStatus={paymentStatus}
        search={search}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPaymentStatusChange={setPaymentStatus}
        onSearchChange={setSearch}
      />

      <ClosureClientList
        clients={clients}
        loading={showBlockingLoading}
        paymentStatus={paymentStatus}
        openingAction={openingOrdersModal}
        onOpenCreateClosure={(client) => openOrdersModal(client, 'create_closure')}
        onOpenGeneratedNotes={(client) => openOrdersModal(client, 'generated_notes')}
      />
      <Pagination page={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} onPageChange={setPage} disabled={loading} />

      {isOrdersModalOpen && modalClient && (
        <ClientOrdersModal
          client={modalClient}
          startDate={startDate}
          endDate={endDate}
          viewMode={modalViewMode}
          paymentStatus={paymentStatus}
          closureMode
          onClosureStateChanged={handleClosureStateChanged}
          onInitialContentReady={handleOrdersModalInitialContentReady}
          onClose={closeOrdersModal}
        />
      )}
    </Container>
  );
};

export default FechamentoPage;
