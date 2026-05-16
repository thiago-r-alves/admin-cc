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
  align-items: center;
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

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
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
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchClients = async () => {
    try {
      const response = await fetch(`${apiUrl}/clients`, {
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
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        fetchClients();
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
        fetchClients();
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
        fetchClients();
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

          <AddButton onClick={() => setShowForm(true)}>
            + Adicionar Cliente
          </AddButton>
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
          onClose={() => setIsOrdersModalOpen(false)}
        />
      )}
    </Container>
  );
};

export default ClientPage;
