import type { ICacamba, OrderType } from '../../interfaces';
import CacambaForm from '../../components/CacambaForm';
import EditCacambaModal from '../../components/EditCacambaModal';
import ActionConfirmModal from '../../components/ActionConfirmModal';
import ImageModal from '../../components/ImageModal';
import type { DriverConfirmState } from './driver.types';

type UploadGuard = (files: File[]) => Promise<{ allowed: File[]; error?: string }>;

type DriverModalsProps = {
  showCacambaForm: boolean;
  selectedOrderId: string | null;
  selectedOrderType: OrderType | null;
  onCacambaAdded: (cacamba: ICacamba) => void;
  onCloseCacambaForm: () => void;
  beforeUploadForCreate: UploadGuard;
  isEditModalOpen: boolean;
  editingCacamba: ICacamba | null;
  editingOrderType: OrderType | undefined;
  onCloseEditModal: () => void;
  onUpdateCacamba: (updates: Partial<ICacamba> & { image?: File | null }) => Promise<void>;
  beforeUploadForEdit: UploadGuard;
  modalImage: string | null;
  onCloseImage: () => void;
  confirmState: DriverConfirmState;
  confirmLoading: boolean;
  onCloseConfirm: () => void;
};

export const DriverModals = ({
  showCacambaForm,
  selectedOrderId,
  selectedOrderType,
  onCacambaAdded,
  onCloseCacambaForm,
  beforeUploadForCreate,
  isEditModalOpen,
  editingCacamba,
  editingOrderType,
  onCloseEditModal,
  onUpdateCacamba,
  beforeUploadForEdit,
  modalImage,
  onCloseImage,
  confirmState,
  confirmLoading,
  onCloseConfirm,
}: DriverModalsProps) => (
  <>
    {showCacambaForm && selectedOrderId && selectedOrderType && (
      <CacambaForm
        orderId={selectedOrderId}
        orderType={selectedOrderType}
        onCacambaAdded={onCacambaAdded}
        onClose={onCloseCacambaForm}
        beforeUploadFiles={beforeUploadForCreate}
      />
    )}

    {isEditModalOpen && editingCacamba && (
      <EditCacambaModal
        cacamba={editingCacamba}
        orderType={editingOrderType}
        onClose={onCloseEditModal}
        onUpdate={onUpdateCacamba}
        beforeUploadFiles={beforeUploadForEdit}
      />
    )}

    {modalImage && <ImageModal url={modalImage} onClose={onCloseImage} />}
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
