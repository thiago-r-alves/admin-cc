import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IOrder, ICacamba, OrderType } from '../interfaces';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import LoadingScreen from '../components/LoadingScreen';
import { apiUrl, authFetch, clearStoredSession } from '../services/api';
import { DriverHeaderPanel } from '../features/driver/DriverHeaderPanel';
import { DriverModals } from '../features/driver/DriverModals';
import { DriverOrdersSection } from '../features/driver/DriverOrdersSection';
import { DeliveryProofModal, type DeliveryProofSubmitPayload } from '../features/driver/DeliveryProofModal';
import type { DriverConfirmState, DriverFeedbackState } from '../features/driver/driver.types';
// socket.io-client will be dynamically imported to avoid parsing on initial load

type OrdersSocket = {
  on(event: 'orders_updated', listener: () => void): void;
  off(event: 'orders_updated'): void;
  close(): void;
};

import {
  DriverContainer,
  DriverShell,
} from '../features/driver/driver.styles';

const DriverPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCacambaForm, setShowCacambaForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [editingCacamba, setEditingCacamba] = useState<ICacamba | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrderType, setEditingOrderType] = useState<OrderType | undefined>(undefined);
  const [role] = useState<string | null>(() => localStorage.getItem('role'));
  const [driverName] = useState<string>(() => localStorage.getItem('username') || '');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DriverFeedbackState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<DriverConfirmState>(null);
  const [deliveryProofOrder, setDeliveryProofOrder] = useState<IOrder | null>(null);
  
  const socketRef = React.useRef<OrdersSocket | null>(null);
  const clearSessionAndRedirect = useCallback(() => {
    clearStoredSession();
    navigate('/', { replace: true });
  }, [navigate]);

  const authenticatedFetch = useCallback(
    (url: string, options?: RequestInit) =>
      authFetch(url, {
        ...options,
        unauthorizedStatuses: [401, 403],
        onUnauthorized: () => {
          setFeedback({ tone: 'error', message: 'Acesso negado ou sessão inválida. Faça login novamente.' });
          clearSessionAndRedirect();
        },
      }),
    [clearSessionAndRedirect],
  );

  const fetchDriverOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await authenticatedFetch(`${apiUrl}/driver/orders`); // Use a variável aqui
      if (!response.ok) throw new Error('Não foi possível carregar seus pedidos.');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setLoadError('Não foi possível carregar seus pedidos. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    let mounted = true;
    void fetchDriverOrders();

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (!mounted) return;
        socketRef.current = io(apiUrl);
        socketRef.current.on('orders_updated', () => {
          void fetchDriverOrders();
        });
      } catch (e) {
        console.error('Falha ao carregar socket.io-client dinamicamente', e);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (socketRef.current) {
          socketRef.current.off('orders_updated');
          socketRef.current.close();
          socketRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, [fetchDriverOrders]);

  const handleUpdateCacamba = async (cacambaId: string, updated: Partial<ICacamba> & { image?: File | null }) => {
    const fd = new FormData();
    Object.entries(updated).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== 'image') fd.append(k, String(v));
    });
    if (updated.image) fd.append('image', updated.image);

    const resp = await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'PATCH',
      body: fd
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.message || 'Falha ao atualizar caçamba.');
    }

    const updatedCacamba: ICacamba = data.cacamba || data;

    // MERGE preservando campos existentes (inclusive local)
    setOrders(prev =>
      prev.map(o => ({
        ...o,
        cacambas: o.cacambas?.map(c =>
          c._id === cacambaId ? { ...c, ...updatedCacamba } : c
        )
      }))
    );
  };

  // (Primeiro bloco duplicado de handlers removido)

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (e) {
      console.warn('Erro ao verificar subscription', e);
    }
  }, []);

  const registerServiceWorkerAndSubscribe = async (manual = false) => {
    setPushError(null);
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushError('Navegador não suporta notificações push.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        // Alguns browsers exigem gesto do usuário (manual === true)
        if (!manual) {
          console.log('Aguardando clique do usuário para solicitar permissão.');
          return;
        }
        currentPermission = await Notification.requestPermission();
      }
      if (currentPermission !== 'granted') {
        setPushError('Permissão não concedida para notificações.');
        return;
      }
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        console.log('Já existe subscription push.');
        setIsSubscribed(true);
        return;
      }
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setPushError('VITE_VAPID_PUBLIC_KEY ausente no frontend.');
        return;
      }
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      const token = localStorage.getItem('token');
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ subscription })
      });
      if (!resp.ok) {
        setPushError('Falha ao registrar subscription no servidor.');
      } else {
        setIsSubscribed(true);
      }
    } catch (e: unknown) {
      console.error('Erro push:', e);
      setPushError(e instanceof Error ? e.message : 'Erro inesperado ao ativar push.');
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
    return output;
  }

  useEffect(() => {
    if (role === 'motorista') {
      void checkSubscriptionStatus();
    }
  }, [checkSubscriptionStatus, role]);


  const handleCompleteOrder = async (orderId: string) => {
    const order = orders.find((item) => item._id === orderId);
    if (order) setDeliveryProofOrder(order);
  };

  const handleDeliveryProofSubmit = async (proof: DeliveryProofSubmitPayload) => {
    if (!deliveryProofOrder) return;
    const response = await authenticatedFetch(`${apiUrl}/driver/orders/${deliveryProofOrder._id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Erro ao concluir pedido.');
    setFeedback({ tone: 'success', message: 'Pedido concluído com comprovante digital.' });
    setDeliveryProofOrder(null);
    await fetchDriverOrders();
  };

  const handleAddCacamba = (orderId: string, orderType: OrderType) => {
    setSelectedOrderId(orderId);
    setSelectedOrderType(orderType);
    setShowCacambaForm(true);
  };

  const handleCacambaAdded = (cacamba: ICacamba) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === cacamba.orderId
          ? { ...order, cacambas: [ ...(order.cacambas ?? []), cacamba ] } // <- evita undefined
          : order
      )
    );
    setShowCacambaForm(false);
    setSelectedOrderId(null);
  };

  const handleCloseCacambaForm = () => {
    setShowCacambaForm(false);
    setSelectedOrderId(null);
  };

  const openGoogleMapsRoute = (address: string, number: string, neighborhood: string, city?: string, cep?: string) => {
    const destination = encodeURIComponent([`${address}, ${number}`, neighborhood, city, cep].filter(Boolean).join(' - '));
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const handleLogout = () => {
    setConfirmState({
      title: 'Sair do sistema',
      description: 'Deseja encerrar a sessão atual?',
      variant: 'warning',
      confirmLabel: 'Sair',
      onConfirm: async () => clearSessionAndRedirect(),
    });
  };

  // Handler para excluir caçamba
  const handleDeleteCacamba = async (cacambaId: string) => {
    const cacamba = orders.flatMap((order) => order.cacambas || []).find((item) => item._id === cacambaId);
    setConfirmState({
      title: `Excluir caçamba${cacamba?.numero ? ` #${cacamba.numero}` : ''}`,
      description: 'Essa ação removerá o registro e a foto desta caçamba. Deseja continuar?',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const response = await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setFeedback({ tone: 'success', message: 'Caçamba excluída com sucesso.' });
            fetchDriverOrders();
            setConfirmState(null);
          } else {
            setFeedback({ tone: 'error', message: 'Erro ao excluir caçamba.' });
          }
        } catch (error) {
          console.error(error);
          setFeedback({ tone: 'error', message: 'Erro ao excluir caçamba.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleOpenEditModal = (cacamba: ICacamba, orderType: OrderType) => {
    setEditingCacamba(cacamba);
    setEditingOrderType(orderType);
    setIsEditModalOpen(true);
  };

  // Hashes de imagens já usadas por pedido (orderId -> Set<hash>)
  const [orderImageHashes, setOrderImageHashes] = useState<Record<string, Set<string>>>({});

  // Gera SHA-256 do arquivo
  const hashFile = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', ab);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Retorna arquivos permitidos e mensagem de erro se houver duplicados
  const guardDuplicateImages = async (
    orderId: string,
    files: File[]
  ): Promise<{ allowed: File[]; error?: string }> => {
    const used = orderImageHashes[orderId] ?? new Set<string>();
    const allowed: File[] = [];
    let blocked = 0;

    for (const f of files) {
      const h = await hashFile(f);
      if (used.has(h)) {
        blocked++;
        continue;
      }
      allowed.push(f);
      used.add(h);
    }

    if (!orderImageHashes[orderId] || blocked > 0 || allowed.length > 0) {
      setOrderImageHashes(prev => ({ ...prev, [orderId]: used }));
    }

    const error = blocked > 0
      ? `Essa imagem já foi utilizada neste pedido.${blocked > 1 ? ` (${blocked} arquivos bloqueados)` : ''}`
      : undefined;

    return { allowed, error };
  };

  // Hooks para o formulário de criar e de editar
  const beforeUploadForCreate = async (files: File[]) => {
    if (!selectedOrderId) return { allowed: files };
    return guardDuplicateImages(selectedOrderId, files);
  };

  const beforeUploadForEdit = async (files: File[]) => {
    const orderId = editingCacamba?.orderId || selectedOrderId;
    if (!orderId) return { allowed: files };
    return guardDuplicateImages(orderId, files);
  };

  const activeOrders = orders.filter(order => order.status !== 'concluido' && order.status !== 'cancelado');

  if (loading) {
    return (
      <LoadingScreen
        title="Sistema carregando..."
        subtitle="Estamos carregando os pedidos para você."
      />
    );
  }

  return (
    <DriverContainer>
      <DriverShell>
        <ActionFeedbackBanner
          message={feedback?.message}
          tone={feedback?.tone}
          onClose={() => setFeedback(null)}
        />
        <DriverHeaderPanel
          role={role}
          driverName={driverName}
          isSubscribed={isSubscribed}
          pushError={pushError}
          activeOrderCount={activeOrders.length}
          onSubscribe={() => registerServiceWorkerAndSubscribe(true)}
          onLogout={handleLogout}
        />
        {loadError && (
          <div role="alert" className="mb-4 rounded-ui-lg border border-red-300 bg-red-50 p-4 text-base font-bold text-red-900">
            <p className="m-0 mb-3">{loadError}</p>
            <button type="button" onClick={() => void fetchDriverOrders()} className="min-h-11 rounded-ui-md border border-red-700 bg-white px-4 font-black text-red-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus-strong">
              Tentar novamente
            </button>
          </div>
        )}
        <DriverOrdersSection
          orders={activeOrders}
          onOpenRoute={openGoogleMapsRoute}
          onCompleteOrder={handleCompleteOrder}
          onAddCacamba={handleAddCacamba}
          onOpenImage={setModalImage}
          onEditCacamba={handleOpenEditModal}
          onDeleteCacamba={handleDeleteCacamba}
        />
      </DriverShell>

      <DriverModals
        showCacambaForm={showCacambaForm}
        selectedOrderId={selectedOrderId}
        selectedOrderType={selectedOrderType}
        onCacambaAdded={handleCacambaAdded}
        onCloseCacambaForm={handleCloseCacambaForm}
        beforeUploadForCreate={beforeUploadForCreate}
        isEditModalOpen={isEditModalOpen}
        editingCacamba={editingCacamba}
        editingOrderType={editingOrderType}
        onCloseEditModal={() => { setIsEditModalOpen(false); setEditingOrderType(undefined); }}
        onUpdateCacamba={async (updated) => {
          if (editingCacamba?._id) {
            await handleUpdateCacamba(editingCacamba._id, updated);
          }
        }}
        beforeUploadForEdit={beforeUploadForEdit}
        modalImage={modalImage}
        onCloseImage={() => setModalImage(null)}
        confirmState={confirmState}
        confirmLoading={confirmLoading}
        onCloseConfirm={() => {
          if (!confirmLoading) setConfirmState(null);
        }}
      />
      {deliveryProofOrder && (
        <DeliveryProofModal
          order={deliveryProofOrder}
          onClose={() => setDeliveryProofOrder(null)}
          onSubmit={handleDeliveryProofSubmit}
        />
      )}
    </DriverContainer>
  );
};

export default DriverPage;
