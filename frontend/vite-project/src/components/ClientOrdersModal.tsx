import React from 'react';
import styled from 'styled-components';
import ImageModal from './ImageModal';
import CacambaMetaModal from './CacambaMetaModal';
import ClientOrdersFooter from './clientOrdersModal/ClientOrdersFooter';
import ClientOrdersList from './clientOrdersModal/ClientOrdersList';
import ClientOrdersModalHeader from './clientOrdersModal/ClientOrdersModalHeader';
import ClientOrdersSummary from './clientOrdersModal/ClientOrdersSummary';
import { useClientOrdersModal } from './clientOrdersModal/useClientOrdersModal';
import type { ClientOrdersModalProps } from './clientOrdersModal/types';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.68);
`;

const ModalContent = styled.div`
  width: min(980px, 94vw);
  max-height: min(90dvh, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
`;

const ModalBody = styled.div`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
`;

const ClientOrdersModal: React.FC<ClientOrdersModalProps> = ({
  client,
  onClose,
  startDate,
  endDate,
  type,
  closureMode = false,
  paymentStatus = 'all',
  onPaymentCompleted,
}) => {
  const {
    orders,
    modalImage,
    setModalImage,
    selectedCacambaIds,
    isSubmittingPayment,
    cacambaMetaModal,
    setCacambaMetaModal,
    clientTotal,
    fetchOrders,
    toggleSelectCacamba,
    handleUpdateCacambaMeta,
    handleDownload,
  } = useClientOrdersModal({
    client,
    startDate,
    endDate,
    type,
    closureMode,
    paymentStatus,
    onPaymentCompleted,
  });

  return (
    <ModalOverlay onClick={onClose}>
      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}

      <ModalContent data-testid="client-orders-modal" onClick={(event) => event.stopPropagation()}>
        <ClientOrdersModalHeader clientName={client.clientName} onClose={onClose} />

        <ModalBody>
          <ClientOrdersSummary
            clientTotal={clientTotal}
            totalOrders={orders.length}
            totalCacambas={orders.reduce((sum, order) => sum + (order.cacambas?.length || 0), 0)}
            closureMode={closureMode}
            selectedCount={selectedCacambaIds.length}
          />

          <ClientOrdersList
            orders={orders}
            closureMode={closureMode}
            selectedCacambaIds={selectedCacambaIds}
            onToggleSelect={toggleSelectCacamba}
            onImageClick={setModalImage}
            onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
            onEditContentType={(cacamba) => setCacambaMetaModal({ mode: 'contentType', cacamba })}
          />
        </ModalBody>

        <ClientOrdersFooter
          onDownload={handleDownload}
          disabled={
            orders.length === 0 || isSubmittingPayment || (closureMode && selectedCacambaIds.length === 0)
          }
          isSubmittingPayment={isSubmittingPayment}
          closureMode={closureMode}
        />
      </ModalContent>

      {cacambaMetaModal && (
        <CacambaMetaModal
          mode={cacambaMetaModal.mode}
          cacamba={cacambaMetaModal.cacamba}
          onClose={() => setCacambaMetaModal(null)}
          onSave={async (updates) => {
            await handleUpdateCacambaMeta(cacambaMetaModal.cacamba._id, updates);
            await fetchOrders();
          }}
        />
      )}
    </ModalOverlay>
  );
};

export default ClientOrdersModal;
