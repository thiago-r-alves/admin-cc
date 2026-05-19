import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { IOrder, ICacamba, OrderType } from '../interfaces';
import CacambaForm from '../components/CacambaForm';
import CacambaList from '../components/CacambaList';
import EditCacambaModal from './EditCacambaModal';
import ActionConfirmModal from '../components/ActionConfirmModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
// socket.io-client will be dynamically imported to avoid parsing on initial load

const DriverContainer = styled.div`
  min-height: 100vh;
  background: #f5f6f8;
  color: #111827;
  font-family: Arial, sans-serif;
  padding: 1.5rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const DriverShell = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
`;

const DriverHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    padding: 1.1rem;
  }
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2.2vw, 2rem);
  font-weight: 900;
`;

const PageSubtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: stretch;
  }
`;

const HeaderButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' | 'quiet' }>`
  min-height: 40px;
  padding: 0.65rem 0.95rem;
  border: 1px solid ${({ $variant }) => {
    if ($variant === 'danger') return '#e30613';
    if ($variant === 'success') return '#e30613';
    return '#d8b4b4';
  }};
  border-radius: 4px;
  background: ${({ $variant }) => {
    if ($variant === 'danger') return '#e30613';
    if ($variant === 'success') return '#e30613';
    if ($variant === 'primary') return '#e30613';
    return '#ffffff';
  }};
  color: ${({ $variant }) => ($variant === 'danger' || $variant === 'success' || $variant === 'primary' ? '#ffffff' : '#6b1f1f')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: ${({ $variant }) => {
      if ($variant === 'success') return '#c9000b';
      if ($variant === 'quiet') return '#fff1f2';
      return '#c9000b';
    }};
    border-color: #e30613;
    color: ${({ $variant }) => ($variant === 'quiet' ? '#e30613' : '#ffffff')};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

const NotificationStatus = styled.span`
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 800;
`;

const NotificationError = styled.div`
  width: 100%;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 700;
`;

const OrdersSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrdersSectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 900;

  &::before {
    content: '';
    width: 4px;
    height: 26px;
    border-radius: 999px;
    background: #e30613;
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const EmptyState = styled.div`
  padding: 1.25rem;
  border: 1px dashed #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #6b7280;
  font-size: 0.95rem;
`;

const OrderCard = styled.article`
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.04);
`;

const OrderCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #f8fafc;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const OrderIdentifier = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  color: #e30613;
  font-size: 1.05rem;
  font-weight: 900;
`;

const OrderNumber = styled.span`
  white-space: nowrap;
`;

const OrderTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0.4rem 0.65rem;
  border-radius: 4px;
  background: #23324a;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const OrderCardBody = styled.div`
  padding: 1.25rem;

  @media (max-width: 560px) {
    padding: 1rem;
  }
`;

const ClientName = styled.h3`
  margin: 0 0 1rem;
  color: #111827;
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  font-weight: 900;
  line-height: 1.25;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.95rem;
  margin-bottom: 1rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBlock = styled.div<{ $span?: number }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};
  padding: 0.85rem;
  border: 1px solid #f1d4d4;
  border-radius: 4px;
  background: #fffafa;

  @media (max-width: 860px) {
    grid-column: span 1;
  }
`;

const InfoLabel = styled.div`
  margin-bottom: 0.35rem;
  color: #9ca3af;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const InfoValue = styled.div`
  color: #374151;
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-word;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0 0;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const CacambaButton = styled(HeaderButton)``;

const CacambaSection = styled.div`
  margin-top: 1.15rem;
  padding-top: 1.15rem;
  border-top: 1px solid #fee2e2;
`;

const CacambaHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const ImageModal = ({ url, onClose }: { url: string, onClose: () => void }) => (
  <div
    style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}
    onClick={onClose}
  >
    <img
      src={url}
      alt="Visualização"
      style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, background: '#fff' }}
      onClick={e => e.stopPropagation()}
    />
  </div>
);

// Componente principal da página do motorista
const typeLabels: Record<OrderType, string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};

const DriverPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCacambaForm, setShowCacambaForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [editingCacamba, setEditingCacamba] = useState<ICacamba | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // ADICIONE um estado para guardar o tipo do pedido em edição
  const [editingOrderType, setEditingOrderType] = useState<OrderType | undefined>(undefined);
  const [role] = useState<string | null>(() => localStorage.getItem('role'));
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  
  // Defina a apiUrl aqui, lendo do .env
  const apiUrl = import.meta.env.VITE_API_URL;
  const socketRef = React.useRef<any>(null);
  const clearSessionAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('token_expires_at');
    window.location.href = '/';
  };

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setFeedback({ tone: 'error', message: 'Sessão expirada. Por favor, faça login novamente.' });
      clearSessionAndRedirect();
      throw new Error('Token not found');
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      setFeedback({ tone: 'error', message: 'Acesso negado ou sessão inválida. Faça login novamente.' });
      clearSessionAndRedirect();
      throw new Error('Authentication failed');
    }
    return response;
  };

  const fetchDriverOrders = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${apiUrl}/driver/orders`); // Use a variável aqui
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchDriverOrders();

    (async () => {
      try {
        const mod = await import('socket.io-client');
        if (!mounted) return;
        socketRef.current = mod.io(apiUrl);
        socketRef.current.on('orders_updated', () => {
          fetchDriverOrders();
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
          socketRef.current.close && socketRef.current.close();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

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

    if (!resp.ok) {
      console.error('Falha ao atualizar caçamba');
      return;
    }

    const data = await resp.json();
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

  async function checkSubscriptionStatus() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (e) {
      console.warn('Erro ao verificar subscription', e);
    }
  }

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
    } catch (e: any) {
      console.error('Erro push:', e);
      setPushError(e?.message || 'Erro inesperado ao ativar push.');
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

  // Chamar após autenticação do motorista
  useEffect(() => {
    let mounted = true;
    fetchDriverOrders();

    (async () => {
      try {
        const mod = await import('socket.io-client');
        if (!mounted) return;
        const s = mod.io(apiUrl);
        s.on('orders_updated', () => {
          fetchDriverOrders();
        });
        // store on ref to cleanup later
        socketRef.current = s;
      } catch (e) {
        console.error('Falha ao carregar socket.io-client dinamicamente', e);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (socketRef.current) {
          socketRef.current.off('orders_updated');
          socketRef.current.close && socketRef.current.close();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (role === 'motorista') {
      checkSubscriptionStatus();
    }
  }, [role]);


  const handleCompleteOrder = async (orderId: string) => {
    setConfirmState({
      title: 'Concluir pedido',
      description: 'Deseja concluir este pedido agora?',
      variant: 'warning',
      confirmLabel: 'Concluir',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const response = await authenticatedFetch(`${apiUrl}/driver/orders/${orderId}/complete`, {
            method: 'PATCH',
          });
          if (response.ok) {
            setFeedback({ tone: 'success', message: 'Pedido concluído com sucesso.' });
            fetchDriverOrders();
            setConfirmState(null);
          } else {
            setFeedback({ tone: 'error', message: 'Erro ao concluir pedido.' });
          }
        } catch (error) {
          console.error('Erro de rede:', error);
          setFeedback({ tone: 'error', message: 'Erro de rede ao concluir pedido.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
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

  const openGoogleMapsRoute = (address: string, number: string, neighborhood: string) => {
    const destination = encodeURIComponent(`${address}, ${number} - ${neighborhood}`);
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
    setConfirmState({
      title: 'Excluir caçamba',
      description: 'Deseja realmente excluir esta caçamba?',
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

  const activeOrders = orders.filter(order => order.status !== 'concluido');

  if (loading) return <DriverContainer>Carregando pedidos...</DriverContainer>;

  return (
    <DriverContainer>
      <DriverShell>
        <ActionFeedbackBanner
          message={feedback?.message}
          tone={feedback?.tone}
          onClose={() => setFeedback(null)}
        />
        <DriverHeader>
          <HeaderText>
            <PageTitle>Painel do Motorista</PageTitle>
            <PageSubtitle>Acompanhe seus pedidos ativos e registre as caçambas em campo.</PageSubtitle>
          </HeaderText>
          <HeaderActions>
            {role === 'motorista' && (
              <>
                {!isSubscribed ? (
                  <HeaderButton type="button" $variant="quiet" onClick={() => registerServiceWorkerAndSubscribe(true)}>
                    Ativar Notificações
                  </HeaderButton>
                ) : (
                  <NotificationStatus>Notificações ativas</NotificationStatus>
                )}
                {pushError && <NotificationError>{pushError}</NotificationError>}
              </>
            )}
            <HeaderButton type="button" $variant="danger" onClick={handleLogout}>
              Sair
            </HeaderButton>
          </HeaderActions>
        </DriverHeader>
        <OrdersSection>
          <OrdersSectionTitle>Pedidos Ativos</OrdersSectionTitle>
      <OrdersGrid>
            {activeOrders.length === 0 && (
              <EmptyState>Nenhum pedido ativo para o motorista no momento.</EmptyState>
            )}

            {activeOrders.map(order => {
            const canConclude = (order.cacambas?.length ?? 0) >= 1;
            const canManage = order.status !== 'cancelado';

            return (
              <OrderCard key={order._id}>
                <OrderCardHeader>
                  <OrderIdentifier>
                    <OrderNumber>{order.orderNumber ? `#${order.orderNumber}` : 'Pedido'}</OrderNumber>
                  </OrderIdentifier>
                  <OrderTypeBadge>{typeLabels[order.type] ?? order.type}</OrderTypeBadge>
                </OrderCardHeader>

                <OrderCardBody>
                  <ClientName>{order.clientName}</ClientName>

                  <InfoGrid>
                    <InfoBlock $span={2}>
                      <InfoLabel>Endereço da obra</InfoLabel>
                      <InfoValue>
                        {order.address}, {order.addressNumber} - {order.neighborhood} - {order.city} - CEP {order.cep}
                      </InfoValue>
                    </InfoBlock>
                    <InfoBlock>
                      <InfoLabel>Contato</InfoLabel>
                      <InfoValue>{order.contactName} ({order.contactNumber})</InfoValue>
                    </InfoBlock>
                  </InfoGrid>

                  <ActionRow>
                    <CacambaButton
                      type="button"
                      $variant="danger"
                      onClick={() => openGoogleMapsRoute(order.address, order.addressNumber, order.neighborhood)}
                    >
                      Ver rota
                    </CacambaButton>
                    {canManage && canConclude && (
                      <CacambaButton
                        type="button"
                        $variant="success"
                        onClick={() => handleCompleteOrder(order._id)}
                      >
                        Concluir Pedido
                      </CacambaButton>
                    )}
                  </ActionRow>

                  {canManage && (
                    <CacambaSection>
                      <CacambaHeader>
                        <CacambaButton type="button" $variant="primary" onClick={() => handleAddCacamba(order._id, order.type)}>
                          + Adicionar Caçamba
                        </CacambaButton>
                      </CacambaHeader>
                      <CacambaList
                        cacambas={order.cacambas || []}
                        onImageClick={setModalImage}
                        onEdit={(cacamba) => handleOpenEditModal(cacamba, order.type)}
                        onDelete={handleDeleteCacamba}
                      />
                    </CacambaSection>
                  )}
                </OrderCardBody>
              </OrderCard>
            );
            })}
          </OrdersGrid>
        </OrdersSection>
      </DriverShell>

      {showCacambaForm && selectedOrderId && selectedOrderType && (
        <CacambaForm
          orderId={selectedOrderId}
          orderType={selectedOrderType}
          onCacambaAdded={handleCacambaAdded}
          onClose={handleCloseCacambaForm}
          beforeUploadFiles={beforeUploadForCreate} // usa o guard
        />
      )}

      {isEditModalOpen && editingCacamba && (
        <EditCacambaModal
          cacamba={editingCacamba}
          orderType={editingOrderType}
          onClose={() => { setIsEditModalOpen(false); setEditingOrderType(undefined); }}
          onUpdate={(updated) => {
            if (editingCacamba._id) {
              handleUpdateCacamba(editingCacamba._id, updated);
            }
          }}
          beforeUploadFiles={beforeUploadForEdit} // usa o guard
        />
      )}

      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}
      {confirmState && (
        <ActionConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          variant={confirmState.variant}
          loading={confirmLoading}
          onClose={() => {
            if (!confirmLoading) setConfirmState(null);
          }}
          onConfirm={confirmState.onConfirm}
        />
      )}
    </DriverContainer>
  );
};

export default DriverPage;
