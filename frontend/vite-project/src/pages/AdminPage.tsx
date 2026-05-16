import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import type { ICacamba, IDriver, IOrder } from '../interfaces';
import CreateOrderModal from '../components/CreateOrderModal';
import CreateDriverModal from '../components/CreateDriverModal';
import CacambaList from '../components/CacambaList';
import ClientPage from './ClientPage';
// socket.io-client and PDF download will be dynamically imported to avoid parsing on initial load

// ==========================================================
// ESTILOS
// ==========================================================
const AdminContainer = styled.div`
  min-height: 100vh;
  background-color: #f6f7fb;
  font-family: Arial, sans-serif;
  color: #111827;
`;

const AdminShell = styled.div`
  min-height: 100vh;
  display: flex;
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 900;
  width: 272px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform 0.2s ease;

  @media (min-width: 769px) {
    position: sticky;
    top: 0;
    height: 100vh;
    flex: 0 0 272px;
    transform: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.35rem 1rem 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

const SidebarLogo = styled.img`
  display: block;
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 0.75rem;
`;

const SidebarItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background-color: ${({ $active }) => ($active ? '#e30613' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
  border: none;
  border-radius: 5px;
  padding: 0.75rem 0.85rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: left;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#c9000b' : '#f3f4f6')};
  }

  svg {
    flex: 0 0 18px;
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid #fee2e2;
  padding: 0.9rem 0.75rem 1rem;
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  padding: 1rem;

  @media (min-width: 769px) {
    padding: 2rem;
  }
`;

const MobileTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const MenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
`;

const Backdrop = styled.button<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 890;
  border: 0;
  background: rgba(17, 24, 39, 0.45);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.2s ease;

  @media (min-width: 769px) {
    display: none;
  }
`;

const ContentContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const OrdersPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const OrdersHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const OrdersTitleBlock = styled.div`
  h1 {
    margin: 0;
    color: #1f2937;
    font-size: clamp(1.45rem, 2vw, 2rem);
    line-height: 1.15;
  }

  p {
    margin: 0.4rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2563eb;
  }
  &:disabled {
    background-color: #9bd3ff;
    cursor: not-allowed;
  }
`;

const AddOrderButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background-color: #e30613;
  border-radius: 4px;
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.18);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
  white-space: nowrap;

  &:hover {
    background-color: #c9000b;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
`;

const OrderCard = styled.div<{ status: IOrder['status'] }>`
  background-color: #ffffff;
  border: 1px solid ${({ status }) => 
    status === 'pendente' ? '#fecaca' :
    status === 'em_andamento' ? '#bfdbfe' :
    status === 'concluido' ? '#bbf7d0' :
    '#fecaca'
  };
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
`;

const DriverFilterPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.95rem 1rem;
  background: #fffafa;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const FilterLabel = styled.span`
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
`;

const OrdersSectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: #374151;
  font-size: 1.25rem;

  &::before {
    content: '';
    display: block;
    width: 3px;
    height: 26px;
    border-radius: 999px;
    background: #e30613;
  }
`;

const OrderCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-bottom: 1px solid #fee2e2;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const OrderHeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const OrderNumber = styled.span`
  color: #e30613;
  font-weight: 900;
  font-size: 1rem;
`;

const OrderTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 4px;
  background: #374151;
  color: #ffffff;
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const StatusBadge = styled.span<{ status: IOrder['status'] }>`
  color: ${({ status }) =>
    status === 'concluido' ? '#15803d' :
    status === 'em_andamento' ? '#1d4ed8' :
    status === 'cancelado' ? '#b91c1c' :
    '#b91c1c'};
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const OrderCardBody = styled.div`
  padding: 1.25rem;
`;

const OrderClientName = styled.h3`
  margin: 0 0 1.15rem;
  color: #1f2937;
  font-size: 1.15rem;
  line-height: 1.3;
  text-transform: uppercase;
`;

const OrderAddressBlock = styled.div`
  margin-bottom: 1rem;
`;

const InfoLabel = styled.span`
  display: block;
  color: #9ca3af;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const InfoValue = styled.span`
  display: block;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.45;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const InfoTile = styled.div`
  min-width: 0;
`;

const OrderDetailsDivider = styled.div`
  height: 1px;
  background: #fee2e2;
  margin: 1.25rem 0;
`;

const OrderFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.2rem;
`;

const FooterField = styled.div`
  min-width: min(100%, 220px);
`;

const OrderActions = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-left: auto;

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;

const EmptyState = styled.div`
  border: 1px dashed #fecaca;
  border-radius: 8px;
  padding: 1.2rem;
  color: #6b7280;
  background: #fffafa;
`;

const DriverList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
`;

const DriverItem = styled.li`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-weight: bold;
    color: #333;
  }

  div {
    display: flex;
    gap: 0.5rem;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #3b82f6; // Azul
  font-size: 1rem;
  &:hover {
    color: #2563eb;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 1rem;
`;

const OrderImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.9rem;
  }
`;

const CompletedCacambas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CompletedCacambasTitle = styled.h4`
  margin: 0;
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
`;

const CompletedCacambasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CompletedCacambaCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 76px;
  padding: 0.85rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #f9fafb;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const CompletedCacambaInfo = styled.div`
  min-width: 0;
`;

const CompletedCacambaHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.25rem;
`;

const CompletedCacambaNumber = styled.span`
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
`;

const CompletedTypeBadge = styled.span<{ tipo: ICacamba['tipo'] }>`
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  background: ${({ tipo }) => tipo === 'entrega' ? '#dcfce7' : '#fee2e2'};
  color: ${({ tipo }) => tipo === 'entrega' ? '#166534' : '#b91c1c'};
  font-size: 0.62rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const CompletedMeta = styled.p`
  margin: 0.1rem 0;
  color: #374151;
  font-size: 0.76rem;
  line-height: 1.35;

  strong {
    color: #111827;
  }
`;

const CompletedThumbButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
`;

const CompletedThumb = styled.img`
  display: block;
  width: 72px;
  height: 54px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
`;

const SectionContainer = styled.div`
  margin-bottom: 2rem;
`;

const DeleteOrderButton = styled(Button)`
  padding: 0.75rem 1rem;
  background-color: #ef4444;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;

  @media (max-width: 768px) {
    flex: 1 1 140px;
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 0.75rem 0.8rem;
  border-radius: 4px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #374151;
  font-weight: 700;
`;

const ActionButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2563eb;
  }

  @media (max-width: 768px) {
    flex: 1 1 140px;
  }
`;

const DriverTabsBar = styled.div`
  display:flex;
  gap:.5rem;
  flex-wrap:wrap;
`;
const DriverTabButton = styled.button<{active:boolean}>`
  background:${p=>p.active ? '#e30613' : '#e5e7eb'};
  color:${p=>p.active ? '#fff' : '#374151'};
  border:none;
  padding:.6rem .9rem;
  font-size:.8rem;
  font-weight:900;
  border-radius:999px;
  cursor:pointer;
  transition:.18s;
  &:hover{
    background:${p=>p.active ? '#c9000b' : '#d1d5db'};
  }
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .75rem 0;
  flex-wrap: wrap;

  > span {
    flex: 1 1 auto;
    min-width: 220px;
  }

  .controls {
    flex: 0 1 auto;
    display: flex;
    gap: .5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    justify-content: center;
    text-align: center;

    > span {
      order: 2;
      width: 100%;
      font-size: .9rem;
      color: #6b7280;
    }

    .controls {
      order: 1;
      width: 100%;
      justify-content: center;
    }
  }
`;
const PageButton = styled.button`
  padding: .5rem .7rem;
  min-width: 44px; /* alvo de toque acessível */
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  font-size: .95rem;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;

  &:hover { background: #f9fafb; border-color: #d1d5db; }
  &:disabled { opacity: .5; cursor: not-allowed; }
`;

const Section = styled.section`
  margin-top: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  margin: .75rem 0 1rem;

  h3 { margin: 0; }
  span { color: #6b7280; font-size: .9rem; }
`;

// Remover margem padrão do body
const GlobalStyle = createGlobalStyle`
  body { margin: 0; background: #f6f7fb; }
`;

type AdminTab = 'pedidos' | 'clientes' | 'motoristas';
type SidebarIconName = AdminTab | 'sair' | 'menu';

const SidebarIcon = ({ name }: { name: SidebarIconName }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'pedidos') {
    return (
      <svg {...common}>
        <path d="M9 5h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
        <path d="M5 4h14v16H5z" />
      </svg>
    );
  }

  if (name === 'clientes') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === 'motoristas') {
    return (
      <svg {...common}>
        <path d="M3 13h2l2-5h10l2 5h2" />
        <path d="M5 13v5h14v-5" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="16.5" cy="18" r="1.5" />
      </svg>
    );
  }

  if (name === 'menu') {
    return (
      <svg {...common}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
};

const sidebarItems: Array<{ key: AdminTab; label: string }> = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'motoristas', label: 'Motoristas' },
];

const statusLabels: Record<IOrder['status'], string> = {
  pendente: 'Aguardando',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const typeLabels: Record<IOrder['type'], string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};

const formatOrderAddress = (order: IOrder) => {
  const street = [order.address, order.addressNumber].filter(Boolean).join(', ');
  const parts = [
    street,
    order.neighborhood,
    order.city,
    order.cep ? `CEP ${order.cep}` : '',
  ].filter(Boolean);

  return parts.join(' - ') || '-';
};

const formatCacambaLocal = (local?: string) => {
  if (!local) return '-';
  if (local === 'via_publica') return 'Via pública';
  if (local === 'canteiro_obra') return 'Canteiro de obra';
  return local;
};

const formatCacambaDate = (createdAt?: string) => {
  if (!createdAt) return 'Data não disponível';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';

  return date.toLocaleString('pt-BR');
};

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pedidos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(''); // NOVO
  const [completedPage, setCompletedPage] = useState(1);
  const PAGE_SIZE = 5;

  // Pedidos do motorista selecionado (aceita motorista como id ou objeto populado)
  const driverOrders = useMemo(
    () => orders.filter(o => (o.motorista?._id ?? (o as any).motorista) === selectedDriverId),
    [orders, selectedDriverId]
  );

  const pendingOrders = useMemo(
    () => driverOrders.filter(o => o.status !== 'concluido'),
    [driverOrders]
  );

  // Ordena concluídos do motorista selecionado (mais recente -> mais antigo)
  const completedOrders = useMemo(() => {
    const completed = (driverOrders ?? []).filter(o => o.status === 'concluido');
    return [...completed].sort((a, b) => {
      const aTime = new Date((a as any).updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date((b as any).updatedAt ?? b.createdAt ?? 0).getTime();
      if (aTime !== bTime) return bTime - aTime;

      const an = typeof a.orderNumber === 'number' ? a.orderNumber : -Infinity;
      const bn = typeof b.orderNumber === 'number' ? b.orderNumber : -Infinity;
      return bn - an;
    });
  }, [driverOrders]);

  const totalCompletedPages = Math.max(1, Math.ceil(completedOrders.length / PAGE_SIZE));

  // Garante página válida quando o conjunto filtrado muda
  useEffect(() => {
    if (completedPage > totalCompletedPages) setCompletedPage(totalCompletedPages);
  }, [completedOrders.length, totalCompletedPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCompleted = useMemo(() => {
    const start = (completedPage - 1) * PAGE_SIZE;
    return completedOrders.slice(start, start + PAGE_SIZE);
  }, [completedOrders, completedPage, PAGE_SIZE]);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Função auxiliar para fazer requisições autenticadas
  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/';
      throw new Error('Token not found');
    }
    const headers = {
      'Content-Type': 'application/json',
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

  // Carregar pedidos e motoristas
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersResponse = await authenticatedFetch(`${apiUrl}/orders`);
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);

      const driversResponse = await authenticatedFetch(`${apiUrl}/drivers`);
      const driversData = await driversResponse.json();
      setDrivers(driversData);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao carregar os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  const socketRef = React.useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    fetchData();

    // dynamically import socket.io-client and connect
    (async () => {
      try {
        const mod = await import('socket.io-client');
        if (!mounted) return;
        socketRef.current = mod.io(apiUrl);
        socketRef.current.on('orders_updated', () => {
          fetchData();
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
        // ignore cleanup errors
      }
    };
  }, []);

  // Funções de Gerenciamento de Pedidos
  const handleUpdateOrder = async (orderId: string, updates: Partial<IOrder>) => {
    try {
      const response = await authenticatedFetch(`${apiUrl}/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Pedido atualizado!');
        fetchData();
      } else {
        alert(data.message || 'Erro ao atualizar pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar pedido.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      const response = await authenticatedFetch(`${apiUrl}/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Pedido excluído com sucesso!');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao excluir pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir pedido.');
    }
  };

  // Funções de Gerenciamento de Motoristas
  const handleEditDriver = (driver: IDriver) => {
    setEditingDriver(driver);
    setIsDriverModalOpen(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este motorista? Todos os pedidos associados precisarão ser reatribuídos.')) return;
    try {
      const response = await authenticatedFetch(`${apiUrl}/drivers/${driverId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Motorista excluído com sucesso!');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao excluir motorista.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir motorista.');
    }
  };

  // Após carregar drivers: definir driver inicial
  useEffect(() => {
    if (drivers.length && !selectedDriverId) {
      setSelectedDriverId(drivers[0]._id);
    }
  }, [drivers, selectedDriverId]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('token_expires_at');
    window.location.href = '/';
  };

  const renderCompletedCacambas = (cacambas: ICacamba[]) => (
    <CompletedCacambas>
      <CompletedCacambasTitle>Caçambas Registradas:</CompletedCacambasTitle>
      <CompletedCacambasList>
        {cacambas.map((cacamba) => {
          const imageUrl = cacamba.imageUrl
            ? cacamba.imageUrl.startsWith('http')
              ? cacamba.imageUrl
              : `${apiUrl}${cacamba.imageUrl}`
            : '';

          return (
            <CompletedCacambaCard key={cacamba._id}>
              <CompletedCacambaInfo>
                <CompletedCacambaHeader>
                  <CompletedCacambaNumber>#{cacamba.numero}</CompletedCacambaNumber>
                  <CompletedTypeBadge tipo={cacamba.tipo}>
                    {typeLabels[cacamba.tipo]}
                  </CompletedTypeBadge>
                </CompletedCacambaHeader>
                <CompletedMeta>Registrada em: {formatCacambaDate(cacamba.createdAt)}</CompletedMeta>
                <CompletedMeta>
                  <strong>Local:</strong> {formatCacambaLocal(cacamba.local)}
                </CompletedMeta>
                <CompletedMeta>
                  <strong>Ordem de serviço:</strong> {cacamba.horaServicoDigitos || '-'}
                </CompletedMeta>
              </CompletedCacambaInfo>

              {imageUrl && (
                <CompletedThumbButton
                  type="button"
                  onClick={() => setModalImage(imageUrl)}
                  aria-label={`Abrir foto da caçamba ${cacamba.numero}`}
                >
                  <CompletedThumb src={imageUrl} alt={`Foto da caçamba ${cacamba.numero}`} />
                </CompletedThumbButton>
              )}
            </CompletedCacambaCard>
          );
        })}
      </CompletedCacambasList>
    </CompletedCacambas>
  );

  const renderOrderCard = (order: IOrder) => {
    const canReassign = order.status !== 'concluido';
    const contactText = [order.contactName, order.contactNumber ? `(${order.contactNumber})` : '']
      .filter(Boolean)
      .join(' ') || '-';

    return (
      <OrderCard key={order._id} status={order.status}>
        <OrderCardHeader>
          <OrderHeaderMeta>
            <OrderNumber>#{order.orderNumber ?? '-'}</OrderNumber>
            <OrderTypeBadge>{typeLabels[order.type] ?? order.type}</OrderTypeBadge>
          </OrderHeaderMeta>
          <StatusBadge status={order.status}>{statusLabels[order.status]}</StatusBadge>
        </OrderCardHeader>

        <OrderCardBody>
          <OrderClientName>{order.clientName}</OrderClientName>

          <OrderAddressBlock>
            <div>
              <InfoLabel>Endereço da obra</InfoLabel>
              <InfoValue>{formatOrderAddress(order)}</InfoValue>
            </div>
          </OrderAddressBlock>

          <InfoGrid>
            <InfoTile>
              <div>
                <InfoLabel>Contato</InfoLabel>
                <InfoValue>{contactText}</InfoValue>
              </div>
            </InfoTile>
            <InfoTile>
              <div>
                <InfoLabel>CNPJ/CPF</InfoLabel>
                <InfoValue>{order.cnpjCpf || '-'}</InfoValue>
              </div>
            </InfoTile>
            <InfoTile>
              <div>
                <InfoLabel>Placa veículo</InfoLabel>
                <InfoValue style={{ textTransform: 'uppercase', color: '#e30613', fontWeight: 800 }}>
                  {order.placa || '-'}
                </InfoValue>
              </div>
            </InfoTile>
          </InfoGrid>

          {((order.cacambas?.length ?? 0) > 0) && (
            <CacambaSection>
              {order.status === 'concluido' ? (
                renderCompletedCacambas(order.cacambas || [])
              ) : (
                <>
                  <h4>Caçambas Registradas</h4>
                  <CacambaList
                    cacambas={order.cacambas || []}
                    onImageClick={setModalImage}
                  />
                </>
              )}
            </CacambaSection>
          )}

          {((order.imageUrls?.length ?? 0) > 0) && (
            <CacambaSection>
              <h4>Imagens Anexadas</h4>
              <ImageContainer>
                {(order.imageUrls ?? []).map((url, i) => (
                  <OrderImage
                    key={i}
                    src={`${apiUrl}${url}`}
                    alt={`Imagem ${i + 1}`}
                    onClick={() => setModalImage(`${apiUrl}${url}`)}
                  />
                ))}
              </ImageContainer>
            </CacambaSection>
          )}

          <OrderDetailsDivider />

          <OrderFooter>
            {canReassign && (
              <FooterField>
                <InfoLabel>Reatribuir motorista</InfoLabel>
                <SelectInput
                  required
                  value={order.motorista?._id || selectedDriverId}
                  onChange={(e) => handleUpdateOrder(order._id, { motorista: e.target.value as any })}
                >
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.username}</option>
                  ))}
                </SelectInput>
              </FooterField>
            )}

            <OrderActions>
              <DeleteOrderButton onClick={() => handleDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
              {order.status === 'concluido' && (
                <ActionButton
                  type="button"
                  onClick={async () => {
                    const { downloadOrderPdf } = await import('../utils/orderPdf');
                    downloadOrderPdf(order);
                  }}
                  style={{ background:'#2563eb' }}
                >
                  Baixar Pedido
                </ActionButton>
              )}
            </OrderActions>
          </OrderFooter>
        </OrderCardBody>
      </OrderCard>
    );
  };

  if (loading) return <AdminContainer>Carregando...</AdminContainer>;
  if (error) return <AdminContainer>Erro: {error}</AdminContainer>;

  return (
    <>
      <GlobalStyle />
      <AdminContainer>
        {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}

        <AdminShell>
          <Sidebar $open={isSidebarOpen}>
            <SidebarHeader>
              <SidebarLogo src="/logo-central-cacambas.webp" alt="Central Caçambas" />
            </SidebarHeader>

            <SidebarNav>
              {sidebarItems.map(item => (
                <SidebarItem
                  key={item.key}
                  type="button"
                  $active={activeTab === item.key}
                  onClick={() => handleSelectTab(item.key)}
                >
                  <SidebarIcon name={item.key} />
                  {item.label}
                </SidebarItem>
              ))}
            </SidebarNav>

            <SidebarFooter>
              <SidebarItem type="button" onClick={handleLogout}>
                <SidebarIcon name="sair" />
                Sair
              </SidebarItem>
            </SidebarFooter>
          </Sidebar>

          <MainContent>
            <MobileTopBar>
              <MenuButton
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Abrir menu"
              >
                <SidebarIcon name="menu" />
              </MenuButton>
              <h2>Painel de Administração de Caçambas</h2>
            </MobileTopBar>
          <Backdrop
            type="button"
            $open={isSidebarOpen}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          />

            <ContentContainer>
          {activeTab === 'clientes' && (
            <ClientPage />
          )}

          {activeTab === 'pedidos' && (
            <OrdersPage>
              <OrdersHeader>
                <OrdersTitleBlock>
                  <h1>Monitor de Pedidos</h1>
                  <p>Acompanhamento em tempo real da operação de campo.</p>
                </OrdersTitleBlock>
                <AddOrderButton type="button" onClick={() => setIsOrderModalOpen(true)}>
                  + Adicionar Pedido
                </AddOrderButton>
              </OrdersHeader>

              <DriverFilterPanel>
                <FilterLabel>Filtrar por motorista:</FilterLabel>
                <DriverTabsBar>
                  {drivers.map(d => (
                    <DriverTabButton
                      key={d._id}
                      active={d._id === selectedDriverId}
                      onClick={() => setSelectedDriverId(d._id)}
                    >
                      {d.username}
                    </DriverTabButton>
                  ))}
                </DriverTabsBar>
              </DriverFilterPanel>

              {!drivers.length && (
                <EmptyState>Nenhum motorista cadastrado.</EmptyState>
              )}

              {drivers.length > 0 && (
                <>
                  <SectionContainer>
                    <OrdersSectionTitle>Pedidos Pendentes</OrdersSectionTitle>
                    {pendingOrders.length ? (
                      <OrdersGrid>
                        {pendingOrders.map(renderOrderCard)}
                      </OrdersGrid>
                    ) : (
                      <EmptyState>Nenhum pedido pendente para o motorista selecionado.</EmptyState>
                    )}
                  </SectionContainer>

                  <Section>
                    <SectionHeader>
                      <OrdersSectionTitle>Concluídos</OrdersSectionTitle>
                      <span>Total: {completedOrders.length}</span>
                    </SectionHeader>

                    {visibleCompleted.length ? (
                      <OrdersGrid>
                        {visibleCompleted.map(renderOrderCard)}
                      </OrdersGrid>
                    ) : (
                      <EmptyState>Nenhum pedido concluído para o motorista selecionado.</EmptyState>
                    )}

                    {completedOrders.length > PAGE_SIZE && (
                      <PaginationBar>
                        <span>
                          Mostrando {visibleCompleted.length} de {completedOrders.length} pedidos concluídos
                        </span>
                        <div className="controls">
                          <PageButton
                            onClick={() => setCompletedPage(1)}
                            disabled={completedPage === 1}
                            aria-label="Primeira página"
                          >
                            «
                          </PageButton>
                          <PageButton
                            onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                            disabled={completedPage === 1}
                          >
                            Anterior
                          </PageButton>
                          <span>Página {completedPage} de {totalCompletedPages}</span>
                          <PageButton
                            onClick={() => setCompletedPage(p => Math.min(totalCompletedPages, p + 1))}
                            disabled={completedPage === totalCompletedPages}
                          >
                            Próxima
                          </PageButton>
                          <PageButton
                            onClick={() => setCompletedPage(totalCompletedPages)}
                            disabled={completedPage === totalCompletedPages}
                            aria-label="Última página"
                          >
                            »
                          </PageButton>
                        </div>
                      </PaginationBar>
                    )}
                  </Section>
                </>
              )}
            </OrdersPage>
          )}

          {activeTab === 'motoristas' && (
            <div>
              <ActionButtons>
                <Button onClick={() => { setEditingDriver(null); setIsDriverModalOpen(true); }}>+ Adicionar Motorista</Button>
              </ActionButtons>
              <h2>Gerenciar Motoristas</h2>
              <DriverList>
                {drivers.map(driver => (
                  <DriverItem key={driver._id}>
                    <span>{driver.username}</span>
                    <div>
                      <IconButton onClick={() => handleEditDriver(driver)}>✏️</IconButton>
                      <IconButton  onClick={() => handleDeleteDriver(driver._id)}>🗑️</IconButton>
                    </div>
                  </DriverItem>
                ))}
              </DriverList>
            </div>
          )}
            </ContentContainer>
          </MainContent>
        </AdminShell>

        {/* Modais */}
        {isOrderModalOpen && (
          <CreateOrderModal
            onClose={() => setIsOrderModalOpen(false)}
            onOrderCreated={fetchData}
            drivers={drivers}
          />
        )}

        {isDriverModalOpen && (
          <CreateDriverModal
            onClose={() => { setIsDriverModalOpen(false); setEditingDriver(null); }}
            onDriverCreated={fetchData}
            editingDriver={editingDriver}
          />
        )}
      </AdminContainer>
    </>
  );
};

// Modal simples para imagem
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

export default AdminPage;
