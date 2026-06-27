import type { ReactNode } from 'react';
import { SidebarIcon } from './AdminIcons';
import { sidebarItems } from './admin.constants';
import type { AdminTab } from './admin.types';
import {
  AdminShell as AdminShellFrame,
  Backdrop,
  ContentContainer,
  MainContent,
  MenuButton,
  MobilePendingIndicator,
  MobileTopBar,
  Sidebar,
  SidebarCountBadge,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarItemLabel,
  SidebarLogo,
  SidebarNav,
} from './admin.styles';

type AdminShellProps = {
  activeTab: AdminTab;
  isSidebarOpen: boolean;
  pendingWithdrawalCacambaCount: number;
  onSelectTab: (tab: AdminTab) => void;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onLogout: () => void;
  children: ReactNode;
};

export const AdminShell = ({
  activeTab,
  isSidebarOpen,
  pendingWithdrawalCacambaCount,
  onSelectTab,
  onOpenSidebar,
  onCloseSidebar,
  onLogout,
  children,
}: AdminShellProps) => (
  <AdminShellFrame>
    <Sidebar $open={isSidebarOpen}>
      <SidebarHeader>
        <SidebarLogo src="/logo-central-cacambas.webp" alt="Central Caçambas" />
      </SidebarHeader>

      <SidebarNav>
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.key}
            type="button"
            $active={activeTab === item.key}
            onClick={() => onSelectTab(item.key)}
          >
            <SidebarIcon name={item.key} />
            <SidebarItemLabel>{item.label}</SidebarItemLabel>
            {item.key === 'retiradas' && pendingWithdrawalCacambaCount > 0 && (
              <SidebarCountBadge
                $active={activeTab === item.key}
                data-testid="pending-withdrawals-sidebar-badge"
              >
                {pendingWithdrawalCacambaCount}
              </SidebarCountBadge>
            )}
          </SidebarItem>
        ))}
      </SidebarNav>

      <SidebarFooter>
        <SidebarItem type="button" onClick={onLogout}>
          <SidebarIcon name="sair" />
          Sair
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>

    <MainContent>
      <MobileTopBar>
        <MenuButton type="button" onClick={onOpenSidebar} aria-label="Abrir menu">
          <SidebarIcon name="menu" />
        </MenuButton>
        <h2>Painel de Administração de Caçambas</h2>
        {pendingWithdrawalCacambaCount > 0 && (
          <MobilePendingIndicator
            type="button"
            onClick={() => onSelectTab('retiradas')}
            data-testid="pending-withdrawals-mobile-badge"
          >
            {pendingWithdrawalCacambaCount} retiradas pendentes
          </MobilePendingIndicator>
        )}
      </MobileTopBar>
      <Backdrop type="button" $open={isSidebarOpen} onClick={onCloseSidebar} aria-label="Fechar menu" />

      <ContentContainer>{children}</ContentContainer>
    </MainContent>
  </AdminShellFrame>
);
