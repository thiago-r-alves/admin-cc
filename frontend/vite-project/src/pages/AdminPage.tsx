import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ICacamba, IDriver, IOrder } from '../interfaces';
import CacambaList, { type CacambaStatusBadge } from '../components/CacambaList';
import ActionFeedbackBanner from '../components/ActionFeedbackBanner';
import LoadingScreen from '../components/LoadingScreen';
import type { CreateOrderPreset } from '../components/CreateOrderModal';
import {
  filterAcompanhamentoCacambas,
  getAcompanhamentoCacambas,
  getCompletedOrders,
  getDriverOrders,
  getPendingCountByDriver,
  getPendingOrders,
  getPendingWithdrawalGroups,
  sortPendingWithdrawalGroups,
  sortAcompanhamentoCacambas,
  type AcompanhamentoFilters,
  type AcompanhamentoSortMode,
  type PendingWithdrawalSortMode,
  type WithdrawalAddressGroup,
} from '../features/admin/admin.helpers';
import { useAdminData } from '../features/admin/useAdminData';
import { useAdminActions } from '../features/admin/useAdminActions';
import { ADMIN_PAGE_SIZE } from '../features/admin/admin.constants';
import {
  AdminContainer,
  GlobalStyle,
} from '../features/admin/admin.styles';
import type {
  AdminCacambaMetaModalState,
  AdminEditingCacambaState,
  AdminTab,
  ConfirmState,
  FeedbackState,
} from '../features/admin/admin.types';
import { clearStoredSession } from '../services/api';
// socket.io-client and PDF download will be dynamically imported to avoid parsing on initial load

const ClientPage = React.lazy(() => import('./ClientPage'));
const FechamentoPage = React.lazy(() => import('./FechamentoPage'));
const FaturamentoPage = React.lazy(() => import('./FaturamentoPage'));
import { AdminShell } from '../features/admin/AdminShell';
import { AdminModals } from '../features/admin/AdminModals';
import { DriversTab } from '../features/admin/drivers/DriversTab';
import { OrdersTab } from '../features/admin/orders/OrdersTab';
import { AcompanhamentoTab } from '../features/admin/acompanhamento/AcompanhamentoTab';
import { PendingWithdrawalsTab } from '../features/admin/withdrawals/PendingWithdrawalsTab';
import { AdminOrderCard } from '../features/admin/orders/AdminOrderCard';

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('pedidos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Estados para os modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderPreset, setOrderPreset] = useState<CreateOrderPreset | null>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
  const [changingClientOrder, setChangingClientOrder] = useState<IOrder | null>(null);
  const [correctingOrder, setCorrectingOrder] = useState<IOrder | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [cacambaMetaModal, setCacambaMetaModal] = useState<AdminCacambaMetaModalState>(null);
  const [editingCacamba, setEditingCacamba] = useState<AdminEditingCacambaState>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [completedPage, setCompletedPage] = useState(1);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [acompanhamentoFilters, setAcompanhamentoFilters] = useState<AcompanhamentoFilters>({
    numero: '',
    cacambaCount: '',
    clientName: '',
    cnpjCpf: '',
    contact: '',
    phone: '',
    serviceOrder: '',
    serviceOrderDigital: '',
    address: '',
    neighborhood: '',
    city: '',
    cep: '',
  });
  const [acompanhamentoSortMode, setAcompanhamentoSortMode] = useState<AcompanhamentoSortMode>('default');
  const [pendingWithdrawalSortMode, setPendingWithdrawalSortMode] =
    useState<PendingWithdrawalSortMode>('overdueAsc');
  const clearSessionAndRedirect = useCallback(() => {
    clearStoredSession();
    navigate('/', { replace: true });
  }, [navigate]);
  const handleAuthError = useCallback(() => {
    setFeedback({ tone: 'error', message: 'Acesso negado ou sessão inválida. Faça login novamente.' });
    clearSessionAndRedirect();
  }, [clearSessionAndRedirect]);
  const { orders, setOrders, drivers, loading, error, authenticatedFetch, fetchData } = useAdminData({
    onAuthError: handleAuthError,
  });

  const {
    handleDeleteOrder,
    handleDeleteAcompanhamentoCacamba,
    handleUpdateCacambaMeta,
    handleUpdateCacambaFull,
    handleDeleteDriver,
    handleLogout,
  } = useAdminActions({
    authenticatedFetch,
    fetchData,
    setOrders,
    setFeedback,
    setConfirmState,
    setConfirmLoading,
    clearSessionAndRedirect,
  });

  const acompanhamentoCacambas = useMemo(() => getAcompanhamentoCacambas(orders), [orders]);
  const acompanhamentoCacambasFiltradas = useMemo(
    () => filterAcompanhamentoCacambas(acompanhamentoCacambas, acompanhamentoFilters),
    [acompanhamentoCacambas, acompanhamentoFilters],
  );
  const acompanhamentoCacambasOrdenadas = useMemo(
    () => sortAcompanhamentoCacambas(acompanhamentoCacambasFiltradas, acompanhamentoSortMode),
    [acompanhamentoCacambasFiltradas, acompanhamentoSortMode],
  );
  const pendingWithdrawalGroups = useMemo(() => getPendingWithdrawalGroups(orders), [orders]);
  const sortedPendingWithdrawalGroups = useMemo(
    () => sortPendingWithdrawalGroups(pendingWithdrawalGroups, pendingWithdrawalSortMode),
    [pendingWithdrawalGroups, pendingWithdrawalSortMode],
  );
  const pendingWithdrawalCacambaCount = useMemo(
    () => pendingWithdrawalGroups.reduce((total, group) => total + group.totalCacambas, 0),
    [pendingWithdrawalGroups],
  );

  // Pedidos do motorista selecionado (aceita motorista como id ou objeto populado)
  const driverOrders = useMemo(
    () => getDriverOrders(orders, selectedDriverId),
    [orders, selectedDriverId]
  );

  const pendingOrders = useMemo(() => getPendingOrders(driverOrders), [driverOrders]);
  const pendingCountByDriver = useMemo(
    () => getPendingCountByDriver(drivers, orders),
    [drivers, orders],
  );

  // Ordena concluídos do motorista selecionado (mais recente -> mais antigo)
  const completedOrders = useMemo(() => getCompletedOrders(driverOrders), [driverOrders]);

  const totalCompletedPages = Math.max(1, Math.ceil(completedOrders.length / ADMIN_PAGE_SIZE));

  // Garante página válida quando o conjunto filtrado muda
  useEffect(() => {
    if (completedPage > totalCompletedPages) setCompletedPage(totalCompletedPages);
  }, [completedPage, totalCompletedPages]);

  const visibleCompleted = useMemo(() => {
    const start = (completedPage - 1) * ADMIN_PAGE_SIZE;
    return completedOrders.slice(start, start + ADMIN_PAGE_SIZE);
  }, [completedOrders, completedPage]);

  const handleOrderClientChanged = async (payload: { order: IOrder; migration?: Record<string, number> }) => {
    const migratedCacambas = Number(payload.migration?.migratedCacambas || 0);
    const createdClosureGroups = Number(payload.migration?.createdClosureGroups || 0);
    setFeedback({
      tone: 'success',
      message:
        migratedCacambas > 0 || createdClosureGroups > 0
          ? `Cliente corrigido com sucesso. ${migratedCacambas} caçamba(s) e ${createdClosureGroups} grupo(s) de fechamento foram transferidos.`
          : 'Cliente corrigido com sucesso.',
    });
    setChangingClientOrder(null);
    await fetchData();
  };

  const handleOrderCorrected = async () => {
    setFeedback({ tone: 'success', message: 'Pedido corrigido com sucesso.' });
    setCorrectingOrder(null);
    await fetchData();
  };

  // Funções de Gerenciamento de Motoristas
  const handleEditDriver = (driver: IDriver) => {
    setEditingDriver(driver);
    setIsDriverModalOpen(true);
  };

  // Após carregar drivers: definir driver inicial
  useEffect(() => {
    if (!drivers.length) {
      if (selectedDriverId) setSelectedDriverId('');
      return;
    }

    if (!selectedDriverId || !drivers.some((driver) => driver._id === selectedDriverId)) {
      setSelectedDriverId(drivers[0]._id);
    }
  }, [drivers, selectedDriverId]);

  const handleSelectTab = (tab: AdminTab) => {
    setFeedback(null);
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleOpenCreateOrder = () => {
    setOrderPreset(null);
    setIsOrderModalOpen(true);
  };

  const handleCloseCreateOrder = () => {
    setIsOrderModalOpen(false);
    setOrderPreset(null);
  };

  const handleOpenWithdrawalOrder = (addressGroup: WithdrawalAddressGroup) => {
    const order = addressGroup.order;
    if (!order.clientId) {
      setFeedback({ tone: 'error', message: 'Não foi possível identificar o cliente da entrega.' });
      return;
    }
    if (addressGroup.availableCacambaIds.length === 0) {
      setFeedback({
        tone: 'error',
        message: 'Todas as caçambas deste endereço já têm pedido de retirada criado.',
      });
      return;
    }

    setOrderPreset({
      mode: 'withdrawal',
      clientId: order.clientId,
      clientName: order.clientName,
      cnpjCpf: order.cnpjCpf,
      contactName: order.contactName,
      contactNumber: order.contactNumber,
      neighborhood: order.neighborhood,
      address: order.address,
      addressNumber: order.addressNumber,
      city: order.city,
      cep: order.cep,
      plannedWithdrawalCacambaIds: addressGroup.availableCacambaIds,
      cacambaNumbers: addressGroup.items
        .filter((item) => !item.plannedWithdrawal)
        .map((item) => item.numero),
    });
    setIsOrderModalOpen(true);
  };

  const renderCompletedCacambas = (
    order: IOrder,
    cacambas: ICacamba[],
    statusBadges?: Record<string, CacambaStatusBadge | CacambaStatusBadge[]>,
    options?: { showTypeBadge?: boolean },
  ) => (
    <CacambaList
      cacambas={cacambas}
      onImageClick={setModalImage}
      showTitle={false}
      showTypeBadge={options?.showTypeBadge}
      onEdit={(cacamba) => setEditingCacamba({ cacamba, orderType: order.type })}
      editLabel="Editar caçamba"
      adminMetaActions={order.type === 'retirada'}
      canEditPrice={order.type === 'retirada' && order.status === 'concluido'}
      onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
      showDeliveryDateForRetirada
      statusBadges={statusBadges}
      responsibility={{ motorista: order.motorista, placa: order.placa }}
    />
  );

  const renderOrderCard = (order: IOrder) => (
    <AdminOrderCard
      key={order._id}
      order={order}
      onOpenImage={setModalImage}
      onEditCacamba={setEditingCacamba}
      onEditCacambaPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
      onCorrectOrder={setCorrectingOrder}
      onChangeClient={setChangingClientOrder}
      onDeleteOrder={handleDeleteOrder}
    />
  );

  if (loading) return <LoadingScreen />;
  if (error) return <AdminContainer>Erro: {error}</AdminContainer>;

  return (
    <>
      <GlobalStyle />
      <AdminContainer>
        <AdminShell
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          pendingWithdrawalCacambaCount={pendingWithdrawalCacambaCount}
          onSelectTab={handleSelectTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        >
          <ActionFeedbackBanner
            message={feedback?.message}
            tone={feedback?.tone}
            onClose={() => setFeedback(null)}
          />
          <React.Suspense fallback={null}>
            {activeTab === 'clientes' && (
              <ClientPage />
            )}

            {activeTab === 'fechamento' && (
              <FechamentoPage />
            )}

            {activeTab === 'faturamento' && (
              <FaturamentoPage />
            )}
          </React.Suspense>

          {activeTab === 'retiradas' && (
            <PendingWithdrawalsTab
              groups={sortedPendingWithdrawalGroups}
              sortMode={pendingWithdrawalSortMode}
              onSortModeChange={setPendingWithdrawalSortMode}
              onOpenWithdrawalOrder={handleOpenWithdrawalOrder}
              renderCompletedCacambas={renderCompletedCacambas}
            />
          )}

          {activeTab === 'acompanhamentos' && (
            <AcompanhamentoTab
              items={acompanhamentoCacambasOrdenadas}
              filters={acompanhamentoFilters}
              sortMode={acompanhamentoSortMode}
              onFiltersChange={setAcompanhamentoFilters}
              onSortModeChange={setAcompanhamentoSortMode}
              onEditCacamba={setEditingCacamba}
              onDeleteCacamba={handleDeleteAcompanhamentoCacamba}
              onOpenImage={setModalImage}
            />
          )}

          {activeTab === 'pedidos' && (
            <OrdersTab
              drivers={drivers}
              selectedDriverId={selectedDriverId}
              pendingCountByDriver={pendingCountByDriver}
              pendingOrders={pendingOrders}
              completedOrders={completedOrders}
              visibleCompleted={visibleCompleted}
              completedPage={completedPage}
              totalCompletedPages={totalCompletedPages}
              onOpenCreateOrder={handleOpenCreateOrder}
              onSelectDriver={setSelectedDriverId}
              onSetCompletedPage={setCompletedPage}
              renderOrderCard={renderOrderCard}
            />
          )}

          {activeTab === 'motoristas' && (
            <DriversTab
              drivers={drivers}
              onAddDriver={() => { setEditingDriver(null); setIsDriverModalOpen(true); }}
              onEditDriver={handleEditDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          )}
        </AdminShell>

        <AdminModals
          modalImage={modalImage}
          onCloseImage={() => setModalImage(null)}
          cacambaMetaModal={cacambaMetaModal}
          onCloseCacambaMeta={() => setCacambaMetaModal(null)}
          onSaveCacambaMeta={handleUpdateCacambaMeta}
          editingCacamba={editingCacamba}
          onCloseEditingCacamba={() => setEditingCacamba(null)}
          onUpdateCacamba={handleUpdateCacambaFull}
          isOrderModalOpen={isOrderModalOpen}
          orderPreset={orderPreset}
          onCloseCreateOrder={handleCloseCreateOrder}
          onOrderCreated={fetchData}
          drivers={drivers}
          isDriverModalOpen={isDriverModalOpen}
          editingDriver={editingDriver}
          onCloseDriverModal={() => { setIsDriverModalOpen(false); setEditingDriver(null); }}
          onDriverCreated={fetchData}
          changingClientOrder={changingClientOrder}
          onCloseChangingClientOrder={() => setChangingClientOrder(null)}
          onOrderClientChanged={handleOrderClientChanged}
          correctingOrder={correctingOrder}
          onCloseCorrectingOrder={() => setCorrectingOrder(null)}
          onOrderCorrected={handleOrderCorrected}
          confirmState={confirmState}
          confirmLoading={confirmLoading}
          onCloseConfirm={() => {
            if (!confirmLoading) setConfirmState(null);
          }}
        />
      </AdminContainer>
    </>
  );
};

export default AdminPage;
