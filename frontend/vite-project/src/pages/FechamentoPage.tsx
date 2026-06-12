import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IClient } from '../interfaces';
import ClientOrdersModal from '../components/ClientOrdersModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import type { ClientOrdersModalProps } from '../components/clientOrdersModal/types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

const Subtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 160px 160px 180px minmax(240px, 1fr);
  gap: 0.8rem;
  align-items: end;

  @media (max-width: 980px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.3rem;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Input = styled.input`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.58rem 0.65rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.58rem 0.65rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const SearchWrap = styled.div`
  position: relative;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.9rem;
  top: calc(50% + 0.65rem);
  transform: translateY(-50%);
  display: inline-flex;
  color: #9ca3af;
  pointer-events: none;
`;

const SearchInput = styled(Input)`
  padding-left: 2.45rem;
`;


const ClientsWrap = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

const ClientRow = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.1rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: #fffafa;
  }

  @media (max-width: 980px) {
    align-items: stretch;
    flex-direction: column;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ClientInfo = styled.div`
  min-width: 0;
  flex: 1 1 340px;
`;

const ClientName = styled.span`
  display: block;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.3;
  word-break: break-word;
`;

const ActionButtons = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
  flex: 0 0 auto;
  min-width: min(100%, 420px);

  @media (max-width: 980px) {
    width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }
`;

const ClientActionButton = styled.button`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0.6rem 0.95rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  color: #6b1f1f;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  background: #ffffff;
  cursor: pointer;
  flex: 0 0 auto;
  max-width: 100%;
  line-height: 1.2;
  text-align: center;

  &:hover {
    border-color: #e30613;
    color: #991b1b;
    background: #fff1f2;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  padding: 1.2rem;
  border: 1px dashed #fecaca;
  border-radius: 8px;
  background: #fffafa;
  color: #6b7280;
`;

const apiUrl = import.meta.env.VITE_API_URL;

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

type ClosurePaymentStatus = 'all' | 'pending' | 'invoice_pending' | 'paid' | 'metadata_pending';

const getClosureActionLabel = (paymentStatus: ClosurePaymentStatus) =>
  paymentStatus === 'metadata_pending'
    ? 'Ver caçambas com informações pendentes'
    : 'Gerar fechamento do cliente';

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
      if (isIsoDate(startDate) && isIsoDate(endDate)) {
        query.append('startDate', startDate);
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
    const q = norm(search);
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
      return fields.some((f) => norm(f).includes(q));
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

      <Toolbar>
        <Field>
          <Label htmlFor="closure-start-date">Data Inicial</Label>
          <Input
            id="closure-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="closure-end-date">Data Final</Label>
          <Input
            id="closure-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="closure-payment-status">Pagamento</Label>
          <Select
            id="closure-payment-status"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as ClosurePaymentStatus)}
          >
            <option value="all">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="metadata_pending">Informações pendentes</option>
            <option value="invoice_pending">NF pendente</option>
            <option value="paid">Pagas</option>
          </Select>
        </Field>
        <SearchWrap>
          <Label htmlFor="closure-search">Buscar Cliente</Label>
          <SearchIcon aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </SearchIcon>
          <SearchInput
            id="closure-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ/CPF, endereco, bairro, cidade, CEP..."
          />
        </SearchWrap>
      </Toolbar>

      {showBlockingLoading ? (
        <EmptyState>Carregando clientes para fechamento...</EmptyState>
      ) : filteredClients.length ? (
        <ClientsWrap>
          {filteredClients.map((client) => (
            <ClientRow key={client._id} data-testid={`closure-client-row-${client._id}`}>
              <ClientInfo>
                <ClientName>{client.clientName}</ClientName>
              </ClientInfo>
              <ActionButtons>
                {(paymentStatus === 'metadata_pending'
                  ? client.hasPendingClosureMetadata
                  : client.hasPendingClosureItems) && (
                  <ClientActionButton
                    type="button"
                    onClick={() => openOrdersModal(client, 'create_closure')}
                  >
                    {getClosureActionLabel(paymentStatus)}
                  </ClientActionButton>
                )}
                {client.hasGeneratedClosureGroups && (
                  <ClientActionButton
                    type="button"
                    onClick={() => openOrdersModal(client, 'generated_notes')}
                  >
                    Ver notas geradas
                  </ClientActionButton>
                )}
              </ActionButtons>
            </ClientRow>
          ))}
        </ClientsWrap>
      ) : (
        <EmptyState>
          Nenhum cliente com retirada concluida encontrado para os filtros selecionados.
        </EmptyState>
      )}

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


