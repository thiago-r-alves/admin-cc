import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IClient } from '../interfaces';
import ClientOrdersModal from '../components/ClientOrdersModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import type { ClientOrdersModalProps } from '../components/clientOrdersModal/types';
import { ClosureClientList } from '../features/closure/ClosureClientList';
import { ClosureFilters } from '../features/closure/ClosureFilters';
import { isIsoDate, normClosureSearch } from '../features/closure/closure.helpers';
import type { ClosurePaymentStatus } from '../features/closure/closure.types';

import {
  Container,
  Header,
  Title,
  Subtitle,
} from '../features/closure/closure.styles';

const apiUrl = import.meta.env.VITE_API_URL;

const FechamentoPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<ClosurePaymentStatus>('all');
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientSnapshot, setSelectedClientSnapshot] = useState<IClient | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<ClientOrdersModalProps['viewMode']>('create_closure');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const isOrdersModalOpenRef = useRef(false);
  const selectedClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    isOrdersModalOpenRef.current = isOrdersModalOpen;
  }, [isOrdersModalOpen]);

  useEffect(() => {
    selectedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  const fetchClosureClients = useCallback(async () => {
    const keepModalContext = isOrdersModalOpenRef.current;
    try {
      if (!keepModalContext) {
        setLoading(true);
      }
      const query = new URLSearchParams();
      query.append('closure', 'true');
      if (isIsoDate(startDate)) {
        query.append('startDate', startDate);
      }
      if (isIsoDate(endDate)) {
        query.append('endDate', endDate);
      }
      query.append('paymentStatus', paymentStatus);
      const response = await fetch(`${apiUrl}/clients?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ tone: 'error', message: data.message || 'Erro ao buscar fechamentos.' });
        if (!keepModalContext) {
          setClients([]);
        }
        return;
      }

      const fetchedClients = Array.isArray(data) ? (data as IClient[]) : [];
      setClients(fetchedClients);
      setSelectedClientSnapshot((current) => {
        const nextSelectedClientId = selectedClientIdRef.current;
        if (!nextSelectedClientId) return current;
        return fetchedClients.find((client) => client._id === nextSelectedClientId) || current;
      });
    } catch (error) {
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
  }, [startDate, endDate, paymentStatus]);

  const handleClosureStateChanged = useCallback(async () => {
    await fetchClosureClients();
  }, [fetchClosureClients]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = normClosureSearch(search);
    return clients.filter((c) => {
      const fields = [
        c.clientName,
        c.cnpjCpf,
        c.address,
        c.addressNumber,
        c.neighborhood,
        c.city,
        c.cep,
        c.contactName,
        c.contactNumber,
      ];
      return fields.some((f) => normClosureSearch(f).includes(q));
    });
  }, [clients, search]);

  const openOrdersModal = (
    client: IClient,
    viewMode: ClientOrdersModalProps['viewMode'] = 'create_closure',
  ) => {
    setSelectedClientId(client._id);
    setSelectedClientSnapshot(client);
    setModalViewMode(viewMode);
    setIsOrdersModalOpen(true);
  };

  const closeOrdersModal = () => {
    setIsOrdersModalOpen(false);
    setSelectedClientId(null);
    setSelectedClientSnapshot(null);
    setModalViewMode('create_closure');
  };

  const modalClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((client) => client._id === selectedClientId) || selectedClientSnapshot;
  }, [clients, selectedClientId, selectedClientSnapshot]);

  const showBlockingLoading = loading && !isOrdersModalOpen;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClosureClients();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchClosureClients, search]);

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
          <Subtitle>Retiradas concluidas dentro do periodo selecionado</Subtitle>
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
        clients={filteredClients}
        loading={showBlockingLoading}
        paymentStatus={paymentStatus}
        onOpenCreateClosure={(client) => openOrdersModal(client, 'create_closure')}
        onOpenGeneratedNotes={(client) => openOrdersModal(client, 'generated_notes')}
      />

      {isOrdersModalOpen && modalClient && (
        <ClientOrdersModal
          client={modalClient}
          startDate={startDate}
          endDate={endDate}
          type="retirada"
          viewMode={modalViewMode}
          paymentStatus={paymentStatus}
          closureMode
          onClosureStateChanged={handleClosureStateChanged}
          onClose={closeOrdersModal}
        />
      )}
    </Container>
  );
};

export default FechamentoPage;
