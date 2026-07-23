import React, { useCallback, useEffect, useState } from 'react';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';
import ActionConfirmModal from '../components/ActionConfirmModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import LoadingScreen from '../components/LoadingScreen';
import type { IClient, IPaginatedResponse } from '../interfaces';
import Pagination from '../components/ui/Pagination';
import { getCachedQuery, invalidateFrontendQueryCache, runCachedQuery } from '../services/queryCache';
import { ClientToolbar } from '../features/clients/ClientToolbar';

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
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1 });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchClients = useCallback(async (signal?: AbortSignal) => {
    const query = new URLSearchParams({ paginated: 'true', page: String(page), pageSize: '25' });
    if (debouncedSearch.trim()) query.set('q', debouncedSearch.trim());
    const url = `${apiUrl}/clients?${query.toString()}`;
    const cacheKey = `clients:${url}`;
    const cached = getCachedQuery<IPaginatedResponse<IClient>>(cacheKey);
    if (cached) {
      setClients(cached.items);
      setPagination({ totalItems: cached.totalItems, totalPages: cached.totalPages });
    } else {
      setLoading(true);
    }
    try {
      const data = await runCachedQuery(cacheKey, async () => {
        const response = await fetch(url, { signal, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!response.ok) throw new Error('Erro ao carregar clientes');
        const body = await response.json();
        return Array.isArray(body)
          ? { items: body, page: 1, pageSize: body.length, totalItems: body.length, totalPages: 1 }
          : body as IPaginatedResponse<IClient>;
      });
      if (signal?.aborted) return;
      setClients(data.items);
      setPagination({ totalItems: data.totalItems, totalPages: data.totalPages });
      setHasLoadedInitially(true);
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof DOMException && error.name === 'AbortError') {
        void fetchClients(signal);
        return;
      }
      console.error('Erro ao buscar clientes:', error);
      setHasLoadedInitially(true);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [apiUrl, debouncedSearch, page]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchClients(controller.signal);
    return () => controller.abort();
  }, [fetchClients]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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
        const created = await response.json() as IClient;
        if (page === 1) {
          setClients((current) => [...current, created]
            .sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'))
            .slice(0, 25));
        }
        setPagination((current) => ({ ...current, totalItems: current.totalItems + 1 }));
        invalidateFrontendQueryCache('clients:');
        setPage(1);
        void fetchClients();
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
        const updated = await response.json() as IClient;
        setClients((current) => current.map((client) => client._id === updated._id ? updated : client));
        invalidateFrontendQueryCache('clients:');
        void fetchClients();
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
        setClients((current) => current.filter((client) => client._id !== confirmDeleteClientId));
        invalidateFrontendQueryCache('clients:');
        void fetchClients();
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

  if (!hasLoadedInitially) return <LoadingScreen fullHeight={false} />;

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
          clients={clients}
          onEdit={handleEditButtonClick}
          onDelete={handleDeleteClient}
        />
      )}
      {!showForm && (
        <Pagination page={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} onPageChange={setPage} disabled={loading} />
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
