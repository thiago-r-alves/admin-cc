import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { IOrder, ICacamba, OrderType } from '../interfaces';
import CacambaForm from '../components/CacambaForm';
import CacambaList from '../components/CacambaList';
import EditCacambaModal from './EditCacambaModal';
// socket.io-client will be dynamically imported to avoid parsing on initial load

// Estilos
const DriverContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 1rem;
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  background-color: #3b82f6;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 1.8rem;
    margin: 0;
    @media (min-width: 768px) {
      font-size: 2.5rem;
    }
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

// Defina o tipo para o styled-component OrderCard
const OrderCard = styled.div<{ status: string }>`
  background-color: white;
  border-left: 5px solid #3b82f6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  h3 {
    margin-top: 0;
    color: #333;
  }

  p {
    margin: 0.5rem 0;
    color: #666;
  }

`;

const CacambaButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: #2563eb;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CacambaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
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
  
  // Defina a apiUrl aqui, lendo do .env
  const apiUrl = import.meta.env.VITE_API_URL;
  const socketRef = React.useRef<any>(null);

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/';
      throw new Error('Token not found');
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      alert('Acesso negado ou sessão inválida. Faça login novamente.');
      localStorage.removeItem('token');
      window.location.href = '/';
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
      // Checa estado atual sem disparar prompt
      checkSubscriptionStatus();
    }
  }, [role]);

  // (Duplicated handleUpdateCacamba removed - original earlier in file is used)

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await authenticatedFetch(`${apiUrl}/driver/orders/${orderId}/complete`, {
        method: 'PATCH',
      });
      if (response.ok) {
        fetchDriverOrders();
      } else {
        console.error('Erro ao concluir pedido');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
    }
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

  // Handler para excluir caçamba
  const handleDeleteCacamba = async (cacambaId: string) => {
    if (!window.confirm('Deseja realmente excluir esta caçamba?')) return;
    await authenticatedFetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'DELETE',
    });
    fetchDriverOrders();
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

  if (loading) return <DriverContainer>Carregando pedidos...</DriverContainer>;

  return (
    <DriverContainer>
      <Header>
        <h1>Painel do Motorista</h1>
      </Header>
      <OrdersGrid>
        {orders
          .filter(order => order.status !== 'concluido') // Apenas pedidos não concluídos
          .map(order => {
            const canConclude = (order.cacambas?.length ?? 0) >= 1;

            return (
              <OrderCard key={order._id} status={order.status}>
                <h3>{order.clientName}</h3>
                <p><strong>Tipo:</strong> {order.type}</p>
                <p>
                  <strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood} - {order.city} - CEP {order.cep}
                </p>
                <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>

                {/* Botão Google Maps */}
                <CacambaButton
                  style={{ background: '#ea4335', marginBottom: '0.5rem', marginTop: '0.5rem' }}
                  onClick={() => openGoogleMapsRoute(order.address, order.addressNumber, order.neighborhood)}
                >
                  Ver rota no Google Maps
                </CacambaButton>

                {order.status !== 'concluido' && order.status !== 'cancelado' && (
                  <>
                    <CacambaSection>
                      <CacambaHeader>
                        <h4 style={{ width: '100%' }}>Caçambas</h4>
                        <CacambaButton onClick={() => handleAddCacamba(order._id, order.type)}>
                          + Adicionar Caçamba
                        </CacambaButton>
                      </CacambaHeader>
                      <CacambaList
                        cacambas={order.cacambas || []}
                        onImageClick={setModalImage}
                        onEdit={(cacamba) => handleOpenEditModal(cacamba, order.type)} // PASSA order.type
                        onDelete={handleDeleteCacamba}
                      />
                    </CacambaSection>
                    {/* Botão para concluir pedido - só aparece se regra for satisfeita */}
                    {canConclude && (
                      <CacambaButton
                        style={{ marginTop: '1rem', background: '#10b981' }}
                        onClick={() => handleCompleteOrder(order._id)}
                      >
                        Concluir Pedido
                      </CacambaButton>
                    )}
                  </>
                )}
              </OrderCard>
            );
          })
        }
      </OrdersGrid>

      {role === 'motorista' && (
        <div style={{ marginTop: '1.5rem' }}>
          {!isSubscribed && (
            <CacambaButton style={{ background: '#6366f1' }} onClick={() => registerServiceWorkerAndSubscribe(true)}>
              Ativar Notificações
            </CacambaButton>
          )}
          {isSubscribed && <span style={{ marginLeft: '0.5rem', color: '#16a34a' }}>Notificações ativas</span>}
          {pushError && <div style={{ marginTop: '0.5rem', color: 'red' }}>{pushError}</div>}
        </div>
      )}

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
    </DriverContainer>
  );
};

export default DriverPage;
