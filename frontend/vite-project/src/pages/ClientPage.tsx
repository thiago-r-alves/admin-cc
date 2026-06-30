import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';
import ActionConfirmModal from '../components/ActionConfirmModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import LoadingScreen from '../components/LoadingScreen';
import ClientOrdersModal from '../components/ClientOrdersModal';
import type { IClient } from '../interfaces';
import { ClientToolbar } from '../features/clients/ClientToolbar';
import { normClientSearch } from '../features/clients/client.helpers';

import {
  Container,
  Header,
  Title,
} from '../features/clients/client.styles';

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);
  const [ordersClient, setOrdersClient] = useState<IClient | null>(null);
  const [openingOrdersClientId, setOpeningOrdersClientId] = useState<string | null>(null);
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
    void fetchClients();
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
    setConfirmDeleteClientId(id);
  };

  const handleConfirmDeleteClient = async () => {
    if (!confirmDeleteClientId) return;
    setConfirmLoading(true);
    try {
      const response = await fetch(`${apiUrl}/clients/${confirmDeleteClientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setFeedback({ tone: 'success', message: 'Cliente excluído com sucesso.' });
        fetchClients();
        setConfirmDeleteClientId(null);
      } else {
        const data = await response.json().catch(() => ({} as { message?: string }));
        setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir cliente.' });
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setFeedback({ tone: 'error', message: 'Erro ao excluir cliente.' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleEditButtonClick = (client: IClient) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleViewOrders = (client: IClient) => {
    setOpeningOrdersClientId(client._id);
    setOrdersClient(client);
  };

  const handleCloseOrders = () => {
    setOrdersClient(null);
    setOpeningOrdersClientId(null);
  };

  const handleOrdersInitialContentReady = useCallback(() => {
    setOpeningOrdersClientId(null);
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const q = normClientSearch(search);
    return clients.filter((c) => {
      const fields = [
        c.clientName,
        c.cnpjCpf,
        c.email,
        c.rgInscricaoEstadual,
        c.address,
        c.addressNumber,
        c.neighborhood,
        c.city,
        c.cep,
        c.contactName,
        c.contactNumber,
      ];
      return fields.some((f) => normClientSearch(f).includes(q));
    });
  }, [clients, search]);

  if (loading) return <LoadingScreen fullHeight={false} />;

  return (
    <Container>
      <ActionFeedbackBanner
        message={feedback?.message}
        tone={feedback?.tone}
        onClose={() => setFeedback(null)}
      />
      <Header>
        <Title>Gerenciamento de Clientes</Title>
      </Header>

      {!showForm && (
        <ClientToolbar
          search={search}
          onSearchChange={setSearch}
          onAddClient={() => setShowForm(true)}
        />
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
          onViewOrders={handleViewOrders}
          loadingOrdersClientId={openingOrdersClientId}
        />
      )}
      {ordersClient && (
        <ClientOrdersModal
          client={ordersClient}
          onClose={handleCloseOrders}
          closureMode={false}
          onInitialContentReady={handleOrdersInitialContentReady}
        />
      )}
      <ActionConfirmModal
        open={Boolean(confirmDeleteClientId)}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente?"
        variant="danger"
        confirmLabel="Excluir"
        loading={confirmLoading}
        onClose={() => {
          if (!confirmLoading) setConfirmDeleteClientId(null);
        }}
        onConfirm={handleConfirmDeleteClient}
      />
    </Container>
  );
};

export default ClientPage;
