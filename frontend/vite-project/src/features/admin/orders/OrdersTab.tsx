import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { IDriver, IOrder } from '../../../interfaces';
import { ADMIN_PAGE_SIZE } from '../admin.constants';
import {
  AddOrderButton,
  DriverFilterPanel,
  DriverTabsBar,
  DriverTabButton,
  EmptyState,
  FilterLabel,
  OrdersGrid,
  OrdersHeader,
  OrdersPage,
  OrdersPanelBadge,
  OrdersPanelHeader,
  OrdersSectionTitle,
  OrdersStatusPanel,
  PageButton,
  PaginationBar,
  StatusPanelsStack,
} from '../admin.styles';

type OrdersTabProps = {
  drivers: IDriver[];
  selectedDriverId: string;
  pendingCountByDriver: Record<string, number>;
  pendingOrders: IOrder[];
  completedOrders: IOrder[];
  visibleCompleted: IOrder[];
  completedPage: number;
  totalCompletedPages: number;
  onOpenCreateOrder: () => void;
  onSelectDriver: (driverId: string) => void;
  onSetCompletedPage: Dispatch<SetStateAction<number>>;
  renderOrderCard: (order: IOrder) => ReactNode;
};

export const OrdersTab = ({
  drivers,
  selectedDriverId,
  pendingCountByDriver,
  pendingOrders,
  completedOrders,
  visibleCompleted,
  completedPage,
  totalCompletedPages,
  onOpenCreateOrder,
  onSelectDriver,
  onSetCompletedPage,
  renderOrderCard,
}: OrdersTabProps) => (
  <OrdersPage>
    <OrdersHeader>
      <AddOrderButton type="button" onClick={onOpenCreateOrder}>
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
        {drivers.map((driver) => (
          <DriverTabButton
            key={driver._id}
            active={driver._id === selectedDriverId}
            onClick={() => onSelectDriver(driver._id)}
          >
            <span className="initial">{driver.username.charAt(0).toUpperCase()}</span>
            <span className="meta">
              <span className="name">{driver.username}</span>
              <span className="count">{pendingCountByDriver[driver._id] ?? 0} pendentes</span>
            </span>
          </DriverTabButton>
        ))}
      </DriverTabsBar>
    </DriverFilterPanel>

    {!drivers.length && <EmptyState>Nenhum motorista cadastrado.</EmptyState>}

    {drivers.length > 0 && (
      <StatusPanelsStack>
        <OrdersStatusPanel $variant="pending">
          <OrdersPanelHeader $variant="pending">
            <div className="title-copy">
              <OrdersSectionTitle>Pedidos Pendentes</OrdersSectionTitle>
            </div>
            <OrdersPanelBadge $variant="pending">Total: {pendingOrders.length}</OrdersPanelBadge>
          </OrdersPanelHeader>
          {pendingOrders.length ? (
            <OrdersGrid>{pendingOrders.map(renderOrderCard)}</OrdersGrid>
          ) : (
            <EmptyState>Nenhum pedido pendente para o motorista selecionado.</EmptyState>
          )}
        </OrdersStatusPanel>

        <OrdersStatusPanel $variant="completed">
          <OrdersPanelHeader $variant="completed">
            <div className="title-copy">
              <OrdersSectionTitle>Concluídos</OrdersSectionTitle>
            </div>
            <OrdersPanelBadge $variant="completed">Total: {completedOrders.length}</OrdersPanelBadge>
          </OrdersPanelHeader>

          {visibleCompleted.length ? (
            <OrdersGrid>{visibleCompleted.map(renderOrderCard)}</OrdersGrid>
          ) : (
            <EmptyState>Nenhum pedido concluído para o motorista selecionado.</EmptyState>
          )}

          {completedOrders.length > ADMIN_PAGE_SIZE && (
            <PaginationBar>
              <span>
                Mostrando {visibleCompleted.length} de {completedOrders.length} pedidos concluídos
              </span>
              <div className="controls">
                <PageButton
                  onClick={() => onSetCompletedPage(1)}
                  disabled={completedPage === 1}
                  aria-label="Primeira página"
                >
                  «
                </PageButton>
                <PageButton
                  onClick={() => onSetCompletedPage((page) => Math.max(1, page - 1))}
                  disabled={completedPage === 1}
                >
                  Anterior
                </PageButton>
                <span>Página {completedPage} de {totalCompletedPages}</span>
                <PageButton
                  onClick={() => onSetCompletedPage((page) => Math.min(totalCompletedPages, page + 1))}
                  disabled={completedPage === totalCompletedPages}
                >
                  Próxima
                </PageButton>
                <PageButton
                  onClick={() => onSetCompletedPage(totalCompletedPages)}
                  disabled={completedPage === totalCompletedPages}
                  aria-label="Última página"
                >
                  »
                </PageButton>
              </div>
            </PaginationBar>
          )}
        </OrdersStatusPanel>
      </StatusPanelsStack>
    )}
  </OrdersPage>
);
