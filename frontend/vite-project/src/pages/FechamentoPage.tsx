import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { IClient, IOrder } from '../interfaces';
import ClientOrdersModal from '../components/ClientOrdersModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import { downloadClosureZip } from '../utils/closureZip';

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
  grid-template-columns: 160px 160px minmax(240px, 1fr) auto;
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

const PrimaryActionButton = styled.button`
  min-height: 43px;
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.18);

  &:hover:enabled {
    background: #c9000b;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ClientsWrap = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

const ClientRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.1rem;
  border: 0;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: #fffafa;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ClientName = styled.span`
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const ViewOrdersBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.45rem 0.8rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  color: #6b1f1f;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
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

const FechamentoPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fetchClosureClients = async () => {
    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      setClients([]);
      setAppliedRange(null);
      return;
    }

    try {
      setLoading(true);
      const selectedStartDate = startDate;
      const selectedEndDate = endDate;
      const query = new URLSearchParams();
      query.append('closure', 'true');
      query.append('startDate', selectedStartDate);
      query.append('endDate', selectedEndDate);
      const response = await fetch(`${apiUrl}/clients?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ tone: 'error', message: data.message || 'Erro ao buscar fechamentos.' });
        setClients([]);
        setAppliedRange(null);
        return;
      }

      const fetchedClients = Array.isArray(data) ? (data as IClient[]) : [];
      setClients(fetchedClients);
      setAppliedRange({ startDate: selectedStartDate, endDate: selectedEndDate });
    } catch (error) {
      console.error(error);
      setFeedback({ tone: 'error', message: 'Erro ao buscar fechamentos.' });
      setClients([]);
      setAppliedRange(null);
    } finally {
      setLoading(false);
    }
  };

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

  const canSearch = isIsoDate(startDate) && isIsoDate(endDate);
  const hasAppliedRange = Boolean(appliedRange?.startDate && appliedRange?.endDate);

  const fetchOrdersForClient = async (clientId: string) => {
    if (!appliedRange) return [];
    const query = new URLSearchParams();
    query.append('closure', 'true');
    query.append('startDate', appliedRange.startDate);
    query.append('endDate', appliedRange.endDate);
    const response = await fetch(`${apiUrl}/clients/${encodeURIComponent(clientId)}/orders?${query.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({} as any));
      throw new Error(data.message || 'Erro ao buscar pedidos do cliente.');
    }
    const orders = (await response.json()) as IOrder[];
    return orders;
  };

  const handleDownloadAll = async () => {
    if (!hasAppliedRange || filteredClients.length === 0) return;
    try {
      setDownloadingAll(true);
      const clientsData: Array<{ client: IClient; orders: IOrder[] }> = [];
      const failedClients: string[] = [];

      for (const client of filteredClients) {
        try {
          const orders = await fetchOrdersForClient(client._id);
          clientsData.push({ client, orders });
        } catch (error) {
          console.error('Falha ao buscar pedidos para fechamento:', client.clientName, error);
          failedClients.push(client.clientName || client._id);
        }
      }

      const valid = clientsData.filter((item) => item.orders.length > 0);
      if (!valid.length) {
        setFeedback({ tone: 'info', message: 'Nenhum pedido de retirada concluído encontrado para exportação.' });
        return;
      }
      await downloadClosureZip({
        startDate: appliedRange!.startDate,
        endDate: appliedRange!.endDate,
        clientsData: valid,
      });
      if (failedClients.length > 0) {
        setFeedback({
          tone: 'info',
          message: `ZIP gerado com sucesso. Alguns clientes falharam na coleta: ${failedClients.slice(0, 3).join(', ')}${failedClients.length > 3 ? '...' : ''}.`,
        });
      } else {
        setFeedback({ tone: 'success', message: 'Fechamentos exportados com sucesso.' });
      }
    } catch (error: any) {
      console.error(error);
      setFeedback({ tone: 'error', message: error?.message || 'Erro ao exportar fechamentos.' });
    } finally {
      setDownloadingAll(false);
    }
  };

  const openOrdersModal = (client: IClient) => {
    if (!hasAppliedRange) {
      setFeedback({ tone: 'info', message: 'Aplique o filtro de datas para abrir os pedidos.' });
      return;
    }
    setSelectedClient(client);
    setIsOrdersModalOpen(true);
  };

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
          <Subtitle>Retiradas concluídas dentro do período selecionado</Subtitle>
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
            placeholder="Buscar por nome, CNPJ/CPF, endereço, bairro, cidade, CEP..."
          />
        </SearchWrap>
        <PrimaryActionButton
          data-testid="closure-download-all"
          type="button"
          onClick={handleDownloadAll}
          disabled={!hasAppliedRange || filteredClients.length === 0 || downloadingAll}
        >
          {downloadingAll ? 'Baixando...' : 'Baixar Todos Fechamentos'}
        </PrimaryActionButton>
      </Toolbar>

      <div>
        <PrimaryActionButton data-testid="closure-apply-filter" type="button" onClick={fetchClosureClients} disabled={!canSearch || loading}>
          {loading ? 'Buscando...' : 'Aplicar Filtro'}
        </PrimaryActionButton>
      </div>

      {loading ? (
        <EmptyState>Carregando clientes para fechamento...</EmptyState>
      ) : filteredClients.length ? (
        <ClientsWrap>
          {filteredClients.map((client) => (
            <ClientRow key={client._id} data-testid={`closure-client-row-${client._id}`} type="button" onClick={() => openOrdersModal(client)}>
              <div>
                <ClientName>{client.clientName}</ClientName>
              </div>
              <ViewOrdersBadge>Ver pedidos</ViewOrdersBadge>
            </ClientRow>
          ))}
        </ClientsWrap>
      ) : (
        <EmptyState>
          {hasAppliedRange
            ? 'Nenhum cliente com retirada concluída encontrado no período selecionado.'
            : 'Selecione Data Inicial e Data Final para consultar os fechamentos.'}
        </EmptyState>
      )}

      {isOrdersModalOpen && selectedClient && (
        <ClientOrdersModal
          client={selectedClient}
          startDate={appliedRange?.startDate}
          endDate={appliedRange?.endDate}
          type="retirada"
          closureMode
          onClose={() => setIsOrdersModalOpen(false)}
        />
      )}
    </Container>
  );
};

export default FechamentoPage;
