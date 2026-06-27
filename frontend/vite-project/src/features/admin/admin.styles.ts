import styled, { createGlobalStyle } from 'styled-components';
import type { IOrder } from '../../interfaces';
import { SelectInput } from '../../components/ui';
import type { CacambaAgeTone } from './admin.helpers';

export const AdminContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
  background-color: #f6f7fb;
  font-family: Arial, sans-serif;
  color: #111827;
`;

export const AdminShell = styled.div`
  min-height: 100vh;
  display: flex;
  min-width: 0;
  max-width: 100%;
`;

export const Sidebar = styled.aside<{ $open: boolean }>`
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

export const SidebarHeader = styled.div`
  padding: 1.35rem 1rem 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

export const SidebarLogo = styled.img`
  display: block;
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
`;

export const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 0.75rem;
`;

export const SidebarItem = styled.button<{ $active?: boolean }>`
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

export const SidebarItemLabel = styled.span`
  min-width: 0;
  flex: 1 1 auto;
`;

export const SidebarCountBadge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#ffffff' : '#e30613')};
  color: ${({ $active }) => ($active ? '#e30613' : '#ffffff')};
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1;
`;

export const SidebarFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid #fee2e2;
  padding: 0.9rem 0.75rem 1rem;
`;

export const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  padding: 1rem;

  @media (min-width: 769px) {
    padding: 2rem;
  }
`;

export const MobileTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;

  h2 {
    min-width: 0;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
    color: #111827;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

export const MobilePendingIndicator = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  min-height: 32px;
  padding: 0.35rem 0.65rem;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MenuButton = styled.button`
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

export const Backdrop = styled.button<{ $open: boolean }>`
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

export const ContentContainer = styled.div`
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const OrdersPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const OrdersHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const Button = styled.button`
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

export const AddOrderButton = styled(Button)`
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

export const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
`;

export const OrderCard = styled.div<{ status: IOrder['status'] }>`
  background-color: #ffffff;
  border: 1px solid ${({ status }) => 
    status === 'pendente' ? '#bbf7d0' :
    status === 'em_andamento' ? '#bfdbfe' :
    status === 'concluido' ? '#fecaca' :
    '#fecaca'
  };
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
`;

export const DriverFilterPanel = styled.div`
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

export const FilterLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const AcompanhamentoToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
  padding: 0.2rem 0;
  margin-bottom: 1rem;
`;

export const AcompanhamentoFiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const AcompanhamentoFilterField = styled.div`
  display: grid;
  gap: 0.28rem;
`;

export const AcompanhamentoFilterLabel = styled.label`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
`;

export const AcompanhamentoFilterInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.72rem 0.8rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

export const AcompanhamentoSortSelect = styled(SelectInput)`
  border-color: #fecaca;
`;

export const SummaryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  min-width: 86px;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #fca5a5;
  background: #ffffff;
  color: #991b1b;
  font-size: 0.95rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  white-space: nowrap;

  @media (max-width: 640px) {
    min-width: 80px;
    font-size: 0.88rem;
  }
`;

export const OrdersSectionTitle = styled.h2`
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

export const OrderCardHeader = styled.div`
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

export const OrderHeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export const OrderNumber = styled.span`
  color: #e30613;
  font-weight: 900;
  font-size: 1rem;
`;

export const OrderTypeBadge = styled.span<{ $type: IOrder['type'] }>`
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

export const OrderHeaderBadges = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

export const CacambaAgeBadge = styled.span<{ $tone: CacambaAgeTone }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 4px;
  background: ${({ $tone }) =>
    $tone === 'high'
      ? '#fee2e2'
      : $tone === 'medium'
        ? '#fef3c7'
        : $tone === 'low'
          ? '#dcfce7'
          : '#f3f4f6'};
  color: ${({ $tone }) =>
    $tone === 'high'
      ? '#b91c1c'
      : $tone === 'medium'
        ? '#92400e'
        : $tone === 'low'
          ? '#166534'
          : '#6b7280'};
  border: 1px solid ${({ $tone }) =>
    $tone === 'high'
      ? '#fecaca'
      : $tone === 'medium'
        ? '#fde68a'
        : $tone === 'low'
          ? '#bbf7d0'
          : '#e5e7eb'};
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
`;

export const OrderCardBody = styled.div`
  padding: 1.25rem;
`;

export const OrderClientName = styled.h3`
  margin: 0 0 1.15rem;
  color: #1f2937;
  font-size: 1.15rem;
  line-height: 1.3;
  text-transform: uppercase;
`;

export const OrderAddressBlock = styled.div`
  margin-bottom: 1rem;
`;

export const InfoLabel = styled.span`
  display: block;
  color: #9ca3af;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
`;

export const InfoValue = styled.span`
  display: block;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.45;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoTile = styled.div`
  min-width: 0;
`;

export const OrderDetailsDivider = styled.div`
  height: 1px;
  background: #fee2e2;
  margin: 1.25rem 0;
`;

export const OrderFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.2rem;
`;

export const OrderActions = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-left: auto;

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;

export const AcompanhamentoActions = styled(OrderActions)`
  margin-top: 1rem;
  margin-left: 0;
`;

export const AcompanhamentoImage = styled.img`
  width: 66px;
  height: 66px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
`;

export const WithdrawalGroupsStack = styled.div`
  display: grid;
  gap: 1rem;
`;

export const WithdrawalClientSection = styled.section`
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
`;

export const WithdrawalClientHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #fffafa;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const WithdrawalClientHeaderText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const WithdrawalClientHeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: stretch;
  }
`;

export const WithdrawalClientTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.3;
  text-transform: uppercase;
`;

export const WithdrawalAddressGroupBlock = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: 0;
  }
`;

export const WithdrawalAddressHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: stretch;
  gap: 1rem;
  margin-bottom: 0.9rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const WithdrawalAddressInfo = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
`;

export const WithdrawalInfoGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const WithdrawalOrderStatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

export const WithdrawalOrderStatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  padding: 0.38rem 0.65rem;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: anywhere;
  text-transform: uppercase;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
`;

export const EmptyState = styled.div`
  border: 1px dashed #fecaca;
  border-radius: 8px;
  padding: 1.2rem;
  color: #6b7280;
  background: #fffafa;
`;

export const DriversPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const DriversHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const DriversTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

export const AddDriverButton = styled.button`
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

export const DriverList = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

export const DriverItem = styled.div`
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

export const DriverInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

export const DriverAvatar = styled.div`
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

export const DriverName = styled.span`
  display: block;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const DriverRole = styled.span`
  display: block;
  margin-top: 0.15rem;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 700;
`;

export const DriverActions = styled.div`
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

export const DriverActionButton = styled.button<{ $variant?: 'danger' }>`
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

export const ImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 1rem;
`;

export const OrderImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

export const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.9rem;
  }
`;

export const SectionContainer = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;

  > ${OrdersSectionTitle} {
    margin-bottom: 1rem;
  }
`;

export const StatusPanelsStack = styled.div`
  display: grid;
  gap: 1.5rem;
`;

export const OrdersStatusPanel = styled.section<{ $variant: 'pending' | 'completed' }>`
  border-radius: 12px;
  border: 1px solid ${({ $variant }) => ($variant === 'pending' ? '#86efac' : '#fca5a5')};
  border-top-width: 4px;
  border-top-color: ${({ $variant }) => ($variant === 'pending' ? '#16a34a' : '#e30613')};
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
  padding: 1rem 1rem 1.1rem;

  @media (max-width: 640px) {
    padding: 0.85rem 0.85rem 1rem;
  }
`;

export const OrdersPanelHeader = styled.div<{ $variant: 'pending' | 'completed' }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid ${({ $variant }) => ($variant === 'pending' ? '#bbf7d0' : '#fecaca')};
  margin-bottom: 1rem;

  .title-copy {
    min-width: 0;
    display: grid;
    gap: 0.3rem;
  }

  .subtitle {
    color: #6b7280;
    font-size: 0.85rem;
    font-weight: 700;
  }
`;

export const OrdersPanelBadge = styled.span<{ $variant: 'pending' | 'completed' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  min-width: 82px;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${({ $variant }) => ($variant === 'pending' ? '#166534' : '#991b1b')};
  border: 1px solid ${({ $variant }) => ($variant === 'pending' ? '#86efac' : '#fda4af')};
  background: ${({ $variant }) => ($variant === 'pending' ? '#dcfce7' : '#ffe4e6')};
`;

export const DeleteOrderButton = styled(Button)`
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

export const ActionButton = styled.button`
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

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover:disabled {
    background-color: #ffffff;
    border-color: #d1d5db;
    color: #374151;
  }

  @media (max-width: 768px) {
    flex: 1 1 140px;
  }
`;

export const DownloadOrderButton = styled(ActionButton)`
  background-color: #ffffff;
`;

export const WithdrawalCreateButton = styled(ActionButton)`
  flex: 0 0 auto;
  background: #e30613;
  border-color: #e30613;
  color: #ffffff;

  &:hover {
    background: #c9000b;
    border-color: #c9000b;
    color: #ffffff;
  }

  &:disabled,
  &:hover:disabled {
    background: #ffffff;
    border-color: #d1d5db;
    color: #6b7280;
  }

  @media (max-width: 720px) {
    width: 100%;
  }
`;

export const DriverTabsBar = styled.div`
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
export const DriverTabButton = styled.button<{active:boolean}>`
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

export const PaginationBar = styled.div`
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
export const PageButton = styled.button`
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

// Remover margem padrão do body
export const GlobalStyle = createGlobalStyle`
  body { margin: 0; background: #f6f7fb; }
`;

