import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';
import ClientOrdersModal from '../components/ClientOrdersModal';
import type { IClient } from '../interfaces';

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
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 260px;
  padding-top: 1.3rem;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
    padding-top: 0;
  }
`;

const DateField = styled.div`
  flex: 0 0 auto;
  min-width: 150px;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;

const TypeField = styled.div`
  flex: 0 0 auto;
  min-width: 160px;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;

const DateLabel = styled.label`
  display: block;
  margin-bottom: 0.3rem;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const DateInput = styled.input`
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

const FilterSelect = styled.select`
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

const SearchIcon = styled.span`
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  color: #9ca3af;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.82rem 0.9rem 0.82rem 2.45rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.92rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const AddButton = styled.button`
  flex: 0 0 auto;
  min-height: 43px;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.18);

  &:hover {
    background: #c9000b;
  }

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const ClearButton = styled.button`
  flex: 0 0 auto;
  min-height: 43px;
  padding: 0.75rem 1rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  background: #ffffff;
  color: #6b1f1f;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: #fff1f2;
    border-color: #e30613;
    color: #e30613;
  }

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 1.3rem;

  @media (max-width: 720px) {
    width: 100%;
    padding-top: 0;
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const LoadingState = styled.div`
  padding: 1.2rem;
  border: 1px dashed #fecaca;
  border-radius: 8px;
  background: #fffafa;
  color: #6b7280;
`;

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderType, setOrderType] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;
  const currentFilters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    type: orderType || undefined,
  };


  const fetchClients = async (filters?: { startDate?: string; endDate?: string; type?: string }) => {
    try {
      const query = new URLSearchParams();
      if (filters?.startDate && filters?.endDate) {
        query.append('startDate', filters.startDate);
        query.append('endDate', filters.endDate);
      }
      if (filters?.type) {
        query.append('type', filters.type);
      }

      const url = query.toString() ? `${apiUrl}/clients?${query.toString()}` : `${apiUrl}/clients`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error('Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchClients(currentFilters);
      return;
    }
    if (orderType) {
      void fetchClients(currentFilters);
      return;
    }
    void fetchClients(currentFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, orderType]);

  const handleAddClient = async (clientData: Omit<IClient, '_id'>) => {
    try {
      const response = await fetch(`${apiUrl}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        fetchClients(currentFilters);
        setShowForm(false);
      } else {
        console.error('Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
    }
  };

  const handleEditClient = async (clientData: IClient) => {
    if (!editingClient) return;

    try {
      const response = await fetch(`${apiUrl}/clients/${editingClient._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        fetchClients(currentFilters);
        setEditingClient(null);
        setShowForm(false);
      } else {
        console.error('Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const shouldDelete = window.confirm('Tem certeza que deseja excluir este cliente?');
    if (!shouldDelete) return;

    try {
      const response = await fetch(`${apiUrl}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchClients(currentFilters);
      } else {
        console.error('Erro ao excluir cliente');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const handleEditButtonClick = (client: IClient) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleViewOrdersClick = (client: IClient) => {
    setSelectedClient(client);
    setIsOrdersModalOpen(true);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setOrderType('');
    setSearch('');
  };

  const norm = (s: unknown) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const q = norm(search);
    return clients.filter(c => {
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
      return fields.some(f => norm(f).includes(q));
    });
  }, [clients, search]);

  if (loading) return <LoadingState>Carregando...</LoadingState>;

  return (
    <Container>
      <Header>
        <Title>Gerenciamento de Clientes</Title>
      </Header>

      {!showForm && (
        <Toolbar>
          <DateField>
            <DateLabel htmlFor="clients-start-date">Data Inicial</DateLabel>
            <DateInput
              id="clients-start-date"
              type="date"
              lang="pt-BR"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </DateField>

          <DateField>
            <DateLabel htmlFor="clients-end-date">Data Final</DateLabel>
            <DateInput
              id="clients-end-date"
              type="date"
              lang="pt-BR"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </DateField>

          <TypeField>
            <DateLabel htmlFor="clients-order-type">Tipo</DateLabel>
            <FilterSelect
              id="clients-order-type"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="entrega">Colocação</option>
              <option value="retirada">Retirada</option>
            </FilterSelect>
          </TypeField>

          <SearchWrap>
            <SearchIcon aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nome, CNPJ/CPF, endereço, bairro, cidade, CEP..."
            />
          </SearchWrap>

          <ToolbarActions>
            <ClearButton type="button" onClick={handleClearFilters}>
              Limpar Filtro
            </ClearButton>

            <AddButton onClick={() => setShowForm(true)}>
              + Adicionar Cliente
            </AddButton>
          </ToolbarActions>
        </Toolbar>
      )}

      {showForm ? (
        <ClientForm
          onSubmit={(clientData) => {
            if (editingClient) {
              void handleEditClient({ ...clientData, _id: editingClient._id });
            } else {
              void handleAddClient(clientData);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          initialData={editingClient || undefined}
        />
      ) : (
        <ClientList
          clients={filteredClients}
          onEdit={handleEditButtonClick}
          onDelete={handleDeleteClient}
          onViewOrders={handleViewOrdersClick}
        />
      )}

      {isOrdersModalOpen && selectedClient && (
        <ClientOrdersModal
          client={selectedClient}
          startDate={currentFilters.startDate}
          endDate={currentFilters.endDate}
          type={currentFilters.type as 'entrega' | 'retirada' | undefined}
          onClose={() => setIsOrdersModalOpen(false)}
        />
      )}
    </Container>
  );
};

export default ClientPage;
