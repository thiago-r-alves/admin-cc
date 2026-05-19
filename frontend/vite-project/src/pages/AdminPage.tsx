import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import type { ICacamba, IDriver, IOrder } from '../interfaces';
import CreateOrderModal from '../components/CreateOrderModal';
import CreateDriverModal from '../components/CreateDriverModal';
import CacambaList from '../components/CacambaList';
import CacambaMetaModal from '../components/CacambaMetaModal';
import ActionConfirmModal from '../components/ActionConfirmModal';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import ClientPage from './ClientPage';
import FechamentoPage from './FechamentoPage';
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

const Button = styled.button`
  background-color: #e30613;
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #c9000b;
  }
  &:disabled {
    background-color: #f39aa0;
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
  display: grid;
  gap: 0.8rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.95rem 1rem;
  background: #fffafa;

  @media (max-width: 640px) {
    padding: 0.85rem;
  }
`;

const FilterLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

const OrderTypeBadge = styled.span<{ $type: IOrder['type'] }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 4px;
  background: ${({ $type }) => ($type === 'retirada' ? '#fee2e2' : '#dcfce7')};
  color: ${({ $type }) => ($type === 'retirada' ? '#b91c1c' : '#166534')};
  border: 1px solid ${({ $type }) => ($type === 'retirada' ? '#fecaca' : '#bbf7d0')};
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
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

const DriversPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DriversHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const DriversTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

const AddDriverButton = styled.button`
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

const DriverList = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

const DriverItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const DriverInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

const DriverAvatar = styled.div`
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #fff1f2;
  color: #e30613;
`;

const DriverName = styled.span`
  display: block;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const DriverRole = styled.span`
  display: block;
  margin-top: 0.15rem;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 700;
`;

const DriverActions = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;

  @media (max-width: 640px) {
    justify-content: stretch;
    flex-wrap: wrap;
  }
`;

const DriverActionButton = styled.button<{ $variant?: 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 38px;
  padding: 0.6rem 0.85rem;
  border: 1px solid ${({ $variant }) => ($variant === 'danger' ? 'transparent' : '#d8b4b4')};
  border-radius: 4px;
  background: ${({ $variant }) => ($variant === 'danger' ? '#dc2626' : '#ffffff')};
  color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#374151')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: ${({ $variant }) => ($variant === 'danger' ? '#b91c1c' : '#fff1f2')};
    border-color: ${({ $variant }) => ($variant === 'danger' ? 'transparent' : '#e30613')};
    color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#e30613')};
  }

  @media (max-width: 640px) {
    flex: 1 1 120px;
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

const SectionContainer = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;

  > ${OrdersSectionTitle} {
    margin-bottom: 1rem;
  }
`;

const DeleteOrderButton = styled(Button)`
  padding: 0.75rem 1rem;
  background-color: #e30613;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;

  &:hover {
    background-color: #c9000b;
  }

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
  background-color: #ffffff;
  color: #374151;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #fff1f2;
    border-color: #e30613;
    color: #e30613;
  }

  @media (max-width: 768px) {
    flex: 1 1 140px;
  }
`;

const DownloadOrderButton = styled(ActionButton)`
  background-color: #ffffff;
`;

const DriverTabsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 0.8rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const DriverTabButton = styled.button<{active:boolean}>`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0.85rem;
  border: 1px solid ${({ active }) => (active ? '#e30613' : '#f1c8c8')};
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  transition: .18s;
  text-align: left;

  .initial {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: ${({ active }) => (active ? '#e30613' : '#e5e7eb')};
    color: ${({ active }) => (active ? '#ffffff' : '#4b5563')};
    font-size: 1.15rem;
    font-weight: 900;
  }

  .meta {
    min-width: 0;
    display: grid;
    gap: 0.2rem;
  }

  .name {
    font-size: 1.02rem;
    font-weight: 900;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count {
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 800;
    color: ${({ active }) => (active ? '#c9000b' : '#6b7280')};
  }

  &:hover{
    border-color: #e30613;
    transform: translateY(-1px);
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

type AdminTab = 'pedidos' | 'clientes' | 'fechamento' | 'motoristas';
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

  if (name === 'fechamento') {
    return (
      <svg {...common}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 14h8" />
        <path d="M8 18h5" />
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

const DriverPersonIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const DriverEditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const DriverTrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const sidebarItems: Array<{ key: AdminTab; label: string }> = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'fechamento', label: 'Fechamento' },
  { key: 'motoristas', label: 'Motoristas' },
];

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
  const [cacambaMetaModal, setCacambaMetaModal] = useState<{
    mode: 'contentType' | 'price';
    cacamba: ICacamba;
  } | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(''); // NOVO
  const [completedPage, setCompletedPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const PAGE_SIZE = 5;
  const clearSessionAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('token_expires_at');
    window.location.href = '/';
  };

  const openConfirm = (payload: NonNullable<typeof confirmState>) => {
    setConfirmState(payload);
    setConfirmLoading(false);
  };

  // Pedidos do motorista selecionado (aceita motorista como id ou objeto populado)
  const driverOrders = useMemo(
    () => orders.filter(o => (o.motorista?._id ?? (o as any).motorista) === selectedDriverId),
    [orders, selectedDriverId]
  );

  const pendingOrders = useMemo(() => {
    const pending = driverOrders.filter(o => o.status !== 'concluido');
    return [...pending].sort((a, b) => {
      const aTime = new Date((a as any).createdAt ?? 0).getTime();
      const bTime = new Date((b as any).createdAt ?? 0).getTime();
      if (aTime !== bTime) return bTime - aTime;

      const an = typeof a.orderNumber === 'number' ? a.orderNumber : -Infinity;
      const bn = typeof b.orderNumber === 'number' ? b.orderNumber : -Infinity;
      return bn - an;
    });
  }, [driverOrders]);
  const pendingCountByDriver = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const driver of drivers) counts[driver._id] = 0;
    for (const order of orders) {
      if (order.status === 'concluido') continue;
      const driverId = order.motorista?._id ?? (order as any).motorista;
      if (typeof driverId === 'string' && counts[driverId] !== undefined) {
        counts[driverId] += 1;
      }
    }
    return counts;
  }, [drivers, orders]);

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
      setFeedback({ tone: 'error', message: 'Sessão expirada. Por favor, faça login novamente.' });
      clearSessionAndRedirect();
      throw new Error('Token not found');
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      setFeedback({ tone: 'error', message: 'Acesso negado ou sessão inválida. Faça login novamente.' });
      clearSessionAndRedirect();
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
        setFeedback({ tone: 'success', message: 'Pedido atualizado.' });
        fetchData();
      } else {
        setFeedback({ tone: 'error', message: data.message || 'Erro ao atualizar pedido.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ tone: 'error', message: 'Erro ao atualizar pedido.' });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
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
            fetchData();
            setConfirmState(null);
          } else {
            const data = await response.json();
            setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir pedido.' });
          }
        } catch (err) {
          console.error(err);
          setFeedback({ tone: 'error', message: 'Erro ao excluir pedido.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleUpdateCacambaMeta = async (
    cacambaId: string,
    updates: { contentType?: string; price?: number }
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
        cacambas: (order.cacambas || []).map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
      }))
    );
  };

  // Funções de Gerenciamento de Motoristas
  const handleEditDriver = (driver: IDriver) => {
    setEditingDriver(driver);
    setIsDriverModalOpen(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
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
            fetchData();
            setConfirmState(null);
          } else {
            const data = await response.json();
            setFeedback({ tone: 'error', message: data.message || 'Erro ao excluir motorista.' });
          }
        } catch (err) {
          console.error(err);
          setFeedback({ tone: 'error', message: 'Erro ao excluir motorista.' });
        } finally {
          setConfirmLoading(false);
        }
      },
    });
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
    openConfirm({
      title: 'Sair do sistema',
      description: 'Deseja encerrar a sessão atual?',
      variant: 'warning',
      confirmLabel: 'Sair',
      onConfirm: async () => {
        clearSessionAndRedirect();
      },
    });
  };

  const renderCompletedCacambas = (order: IOrder, cacambas: ICacamba[]) => (
    <CacambaList
      cacambas={cacambas}
      onImageClick={setModalImage}
      showTitle={false}
      adminMetaActions={order.type === 'retirada'}
      canEditPrice={order.type === 'retirada' && order.status === 'concluido'}
      onEditContentType={(cacamba) => setCacambaMetaModal({ mode: 'contentType', cacamba })}
      onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
    />
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
          </OrderHeaderMeta>
          <OrderTypeBadge $type={order.type}>{typeLabels[order.type] ?? order.type}</OrderTypeBadge>
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
                renderCompletedCacambas(order, order.cacambas || [])
              ) : (
                <CacambaList
                  cacambas={order.cacambas || []}
                  onImageClick={setModalImage}
                  adminMetaActions={order.type === 'retirada'}
                  canEditPrice={false}
                  onEditContentType={(cacamba) => setCacambaMetaModal({ mode: 'contentType', cacamba })}
                />
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
                <DownloadOrderButton
                  type="button"
                  onClick={async () => {
                    const { downloadOrderPdf } = await import('../utils/orderPdf');
                    downloadOrderPdf(order);
                  }}
                >
                  Baixar Pedido
                </DownloadOrderButton>
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
        {cacambaMetaModal && (
          <CacambaMetaModal
            mode={cacambaMetaModal.mode}
            cacamba={cacambaMetaModal.cacamba}
            onClose={() => setCacambaMetaModal(null)}
            onSave={async (updates) => {
              await handleUpdateCacambaMeta(cacambaMetaModal.cacamba._id, updates);
            }}
          />
        )}

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
          <ActionFeedbackBanner
            message={feedback?.message}
            tone={feedback?.tone}
            onClose={() => setFeedback(null)}
          />
          {activeTab === 'clientes' && (
            <ClientPage />
          )}

          {activeTab === 'fechamento' && (
            <FechamentoPage />
          )}

          {activeTab === 'pedidos' && (
            <OrdersPage>
              <OrdersHeader>
                <AddOrderButton type="button" onClick={() => setIsOrderModalOpen(true)}>
                  + Adicionar Pedido
                </AddOrderButton>
              </OrdersHeader>

              <DriverFilterPanel>
                <FilterLabel>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Seleção de motorista
                </FilterLabel>
                <DriverTabsBar>
                  {drivers.map(d => (
                    <DriverTabButton
                      key={d._id}
                      active={d._id === selectedDriverId}
                      onClick={() => setSelectedDriverId(d._id)}
                    >
                      <span className="initial">{d.username.charAt(0).toUpperCase()}</span>
                      <span className="meta">
                        <span className="name">{d.username}</span>
                        <span className="count">{pendingCountByDriver[d._id] ?? 0} pendentes</span>
                      </span>
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
            <DriversPage>
              <DriversHeader>
                <DriversTitle>Gerenciar Motoristas</DriversTitle>
                <AddDriverButton type="button" onClick={() => { setEditingDriver(null); setIsDriverModalOpen(true); }}>
                  + Adicionar Motorista
                </AddDriverButton>
              </DriversHeader>

              <DriverList>
                {drivers.length ? (
                  drivers.map(driver => (
                    <DriverItem key={driver._id}>
                      <DriverInfo>
                        <DriverAvatar>
                          <DriverPersonIcon />
                        </DriverAvatar>
                        <div>
                          <DriverName>{driver.username}</DriverName>
                          <DriverRole>Motorista</DriverRole>
                        </div>
                      </DriverInfo>

                      <DriverActions>
                        <DriverActionButton type="button" onClick={() => handleEditDriver(driver)}>
                          <DriverEditIcon />
                          Editar
                        </DriverActionButton>
                        <DriverActionButton type="button" $variant="danger" onClick={() => handleDeleteDriver(driver._id)}>
                          <DriverTrashIcon />
                          Excluir
                        </DriverActionButton>
                      </DriverActions>
                    </DriverItem>
                  ))
                ) : (
                  <EmptyState>Nenhum motorista cadastrado.</EmptyState>
                )}
              </DriverList>
            </DriversPage>
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
