import React from 'react';
import type { ICacamba, IDriver, IOrder } from '../../interfaces';
import type { CreateOrderPreset } from '../../components/CreateOrderModal';
import CacambaMetaModal from '../../components/CacambaMetaModal';
import ActionConfirmModal from '../../components/ActionConfirmModal';
import ImageModal from '../../components/ImageModal';
import { apiUrl } from '../../services/api';
import type {
  AdminCacambaMetaModalState,
  AdminEditingCacambaState,
  ConfirmState,
} from './admin.types';

const CreateOrderModal = React.lazy(() => import('../../components/CreateOrderModal'));
const CreateDriverModal = React.lazy(() => import('../../components/CreateDriverModal'));
const ChangeOrderClientModal = React.lazy(() => import('../../components/ChangeOrderClientModal'));
const CorrectOrderModal = React.lazy(() => import('../../components/CorrectOrderModal'));
const EditCacambaModal = React.lazy(() => import('../../components/EditCacambaModal'));

type AdminModalsProps = {
  modalImage: string | null;
  onCloseImage: () => void;
  cacambaMetaModal: AdminCacambaMetaModalState;
  onCloseCacambaMeta: () => void;
  onSaveCacambaMeta: (cacambaId: string, updates: { contentType?: string; price?: number }) => Promise<void>;
  editingCacamba: AdminEditingCacambaState;
  onCloseEditingCacamba: () => void;
  onUpdateCacamba: (cacambaId: string, updates: Partial<ICacamba> & { image?: File | null }) => Promise<void>;
  isOrderModalOpen: boolean;
  orderPreset: CreateOrderPreset | null;
  onCloseCreateOrder: () => void;
  onOrderCreated: () => Promise<void>;
  drivers: IDriver[];
  isDriverModalOpen: boolean;
  editingDriver: IDriver | null;
  onCloseDriverModal: () => void;
  onDriverCreated: () => Promise<void>;
  changingClientOrder: IOrder | null;
  onCloseChangingClientOrder: () => void;
  onOrderClientChanged: (payload: { order: IOrder; migration?: Record<string, number> }) => Promise<void>;
  correctingOrder: IOrder | null;
  onCloseCorrectingOrder: () => void;
  onOrderCorrected: () => Promise<void>;
  confirmState: ConfirmState;
  confirmLoading: boolean;
  onCloseConfirm: () => void;
};

export const AdminModals = ({
  modalImage,
  onCloseImage,
  cacambaMetaModal,
  onCloseCacambaMeta,
  onSaveCacambaMeta,
  editingCacamba,
  onCloseEditingCacamba,
  onUpdateCacamba,
  isOrderModalOpen,
  orderPreset,
  onCloseCreateOrder,
  onOrderCreated,
  drivers,
  isDriverModalOpen,
  editingDriver,
  onCloseDriverModal,
  onDriverCreated,
  changingClientOrder,
  onCloseChangingClientOrder,
  onOrderClientChanged,
  correctingOrder,
  onCloseCorrectingOrder,
  onOrderCorrected,
  confirmState,
  confirmLoading,
  onCloseConfirm,
}: AdminModalsProps) => (
  <>
    {modalImage && <ImageModal url={modalImage} onClose={onCloseImage} />}
    {cacambaMetaModal && (
      <CacambaMetaModal
        mode={cacambaMetaModal.mode}
        cacamba={cacambaMetaModal.cacamba}
        onClose={onCloseCacambaMeta}
        onSave={(updates) => onSaveCacambaMeta(cacambaMetaModal.cacamba._id, updates)}
      />
    )}

    <React.Suspense fallback={null}>
      {editingCacamba && (
        <EditCacambaModal
          cacamba={editingCacamba.cacamba}
          orderType={editingCacamba.orderType}
          onClose={onCloseEditingCacamba}
          onUpdate={(updates) => onUpdateCacamba(editingCacamba.cacamba._id, updates)}
        />
      )}

      {isOrderModalOpen && (
        <CreateOrderModal
          onClose={onCloseCreateOrder}
          onOrderCreated={onOrderCreated}
          drivers={drivers}
          initialPreset={orderPreset}
        />
      )}

      {isDriverModalOpen && (
        <CreateDriverModal
          onClose={onCloseDriverModal}
          onDriverCreated={onDriverCreated}
          editingDriver={editingDriver}
        />
      )}

      {changingClientOrder && (
        <ChangeOrderClientModal
          apiUrl={apiUrl}
          order={changingClientOrder}
          onClose={onCloseChangingClientOrder}
          onChanged={onOrderClientChanged}
        />
      )}

      {correctingOrder && (
        <CorrectOrderModal
          apiUrl={apiUrl}
          order={correctingOrder}
          drivers={drivers}
          onClose={onCloseCorrectingOrder}
          onChanged={onOrderCorrected}
        />
      )}
    </React.Suspense>

    {confirmState && (
      <ActionConfirmModal
        open
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={confirmLoading}
        onClose={onCloseConfirm}
        onConfirm={confirmState.onConfirm}
      />
    )}
  </>
);
