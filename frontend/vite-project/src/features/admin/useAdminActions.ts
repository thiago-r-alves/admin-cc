import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ICacamba, IOrder } from '../../interfaces';
import { apiUrl } from '../../services/api';
import type { ConfirmState, FeedbackState } from './admin.types';

type UseAdminActionsArgs = {
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  fetchData: (options?: { background?: boolean }) => Promise<void>;
  setOrders: Dispatch<SetStateAction<IOrder[]>>;
  setFeedback: Dispatch<SetStateAction<FeedbackState>>;
  setConfirmState: Dispatch<SetStateAction<ConfirmState>>;
  setConfirmLoading: Dispatch<SetStateAction<boolean>>;
  clearSessionAndRedirect: () => void;
};

export const useAdminActions = ({
  authenticatedFetch,
  fetchData,
  setOrders,
  setFeedback,
  setConfirmState,
  setConfirmLoading,
  clearSessionAndRedirect,
}: UseAdminActionsArgs) => {
  const openConfirm = useCallback((payload: NonNullable<ConfirmState>) => {
    setConfirmState(payload);
    setConfirmLoading(false);
  }, [setConfirmLoading, setConfirmState]);

  const handleDeleteOrder = useCallback((orderId: string) => {
    openConfirm({
      title: 'Excluir pedido',
      description: 'Tem certeza que deseja excluir este pedido?',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const response = await authenticatedFetch(`${apiUrl}/orders/${orderId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setFeedback({ tone: 'success', message: 'Pedido excluído com sucesso.' });
            await fetchData();
            setConfirmState(null);
          } else {
            const data = await response.json();
            setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir pedido.' });
          }
        } catch (error) {
          console.error(error);
          setFeedback({ tone: 'error', message: 'Erro ao excluir pedido.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  }, [authenticatedFetch, fetchData, openConfirm, setConfirmLoading, setConfirmState, setFeedback]);

  const handleDeleteAcompanhamentoCacamba = useCallback((
    cacambaId: string,
    numero: string,
    onDeleted?: () => Promise<void> | void,
    options?: { skipRefresh?: boolean },
  ) => {
    openConfirm({
      title: 'Excluir caçamba do acompanhamento',
      description: `Tem certeza que deseja excluir definitivamente a caçamba #${numero}?`,
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const response = await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setFeedback({ tone: 'success', message: `Caçamba #${numero} excluída com sucesso.` });
            if (!options?.skipRefresh) {
              await fetchData();
            }
            await onDeleted?.();
            setConfirmState(null);
          } else {
            const data = await response.json();
            setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir caçamba.' });
          }
        } catch (error) {
          console.error(error);
          setFeedback({ tone: 'error', message: 'Erro ao excluir caçamba.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  }, [authenticatedFetch, fetchData, openConfirm, setConfirmLoading, setConfirmState, setFeedback]);

  const handleUpdateCacambaMeta = useCallback(async (
    cacambaId: string,
    updates: { contentType?: string; price?: number },
  ) => {
    const response = await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar dados da caçamba.');
    }

    const updated = data?.cacamba as ICacamba | undefined;
    if (!updated?._id) {
      throw new Error('Resposta inválida ao atualizar caçamba.');
    }

    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        cacambas: (order.cacambas || []).map((cacamba) =>
          cacamba._id === updated._id ? { ...cacamba, ...updated } : cacamba,
        ),
      })),
    );
  }, [authenticatedFetch, setOrders]);

  const handleUpdateCacambaFull = useCallback(async (
    cacambaId: string,
    updates: Partial<ICacamba> & { image?: File | null },
  ) => {
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image') {
        formData.append(key, String(value));
      }
    });
    if (updates.image) formData.append('image', updates.image);

    const response = await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'PATCH',
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao corrigir caçamba.');
    }

    const updated = data?.cacamba as ICacamba | undefined;
    if (!updated?._id) {
      throw new Error('Resposta inválida ao corrigir caçamba.');
    }

    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        cacambas: (order.cacambas || []).map((cacamba) =>
          cacamba._id === updated._id ? { ...cacamba, ...updated } : cacamba,
        ),
      })),
    );
    setFeedback({ tone: 'success', message: `Caçamba #${updated.numero} editada com sucesso.` });
    await fetchData({ background: true });
  }, [authenticatedFetch, fetchData, setFeedback, setOrders]);

  const handleDeleteDriver = useCallback((driverId: string) => {
    openConfirm({
      title: 'Excluir motorista',
      description:
        'Tem certeza que deseja excluir este motorista? Todos os pedidos associados precisarão ser reatribuídos.',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const response = await authenticatedFetch(`${apiUrl}/drivers/${driverId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setFeedback({ tone: 'success', message: 'Motorista excluído com sucesso.' });
            await fetchData();
            setConfirmState(null);
          } else {
            const data = await response.json();
            setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir motorista.' });
          }
        } catch (error) {
          console.error(error);
          setFeedback({ tone: 'error', message: 'Erro ao excluir motorista.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  }, [authenticatedFetch, fetchData, openConfirm, setConfirmLoading, setConfirmState, setFeedback]);

  const handleLogout = useCallback(() => {
    openConfirm({
      title: 'Sair do sistema',
      description: 'Deseja encerrar a sessão atual?',
      variant: 'warning',
      confirmLabel: 'Sair',
      onConfirm: async () => {
        clearSessionAndRedirect();
      },
    });
  }, [clearSessionAndRedirect, openConfirm]);

  return {
    handleDeleteOrder,
    handleDeleteAcompanhamentoCacamba,
    handleUpdateCacambaMeta,
    handleUpdateCacambaFull,
    handleDeleteDriver,
    handleLogout,
  };
};
