import React, { useState } from 'react';
import styled from 'styled-components';
import ImageModal from './ImageModal';
import CacambaMetaModal from './CacambaMetaModal';
import ClientOrdersFooter from './clientOrdersModal/ClientOrdersFooter';
import ClientOrdersList from './clientOrdersModal/ClientOrdersList';
import ClientOrdersModalHeader from './clientOrdersModal/ClientOrdersModalHeader';
import ClientOrdersSummary from './clientOrdersModal/ClientOrdersSummary';
import { useClientOrdersModal } from './clientOrdersModal/useClientOrdersModal';
import type { ClientOrdersModalProps } from './clientOrdersModal/types';
import CacambaList from './CacambaList';

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

const GroupsLayout = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
`;

const GroupList = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 8px;
  overflow: auto;
`;

const GroupItem = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid #fee2e2;
  background: ${({ $active }) => ($active ? '#fff1f2' : '#fff')};
  padding: 0.7rem 0.75rem;
  cursor: pointer;
`;

const GroupDetail = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 8px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 0;
  overflow-y: auto;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const InvoiceRow = styled.div`
  display: flex;
  gap: 0.6rem;
`;

const InvoiceInput = styled.input`
  min-height: 40px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.55rem 0.65rem;
  flex: 1;
`;

const SaveInvoiceButton = styled.button`
  min-height: 40px;
  border: 1px solid #e30613;
  border-radius: 6px;
  background: #e30613;
  color: #fff;
  font-weight: 800;
  padding: 0 0.8rem;
  cursor: pointer;
`;

const ResultOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.55);
`;

const ResultModal = styled.div`
  width: min(440px, 94vw);
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
`;

const ResultHeader = styled.div<{ $tone: 'success' | 'error' }>`
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #fee2e2;
  border-left: 4px solid ${({ $tone }) => ($tone === 'success' ? '#16a34a' : '#dc2626')};
  font-weight: 800;
`;

const ResultBody = styled.div`
  padding: 1rem;
  color: #334155;
`;

const ResultFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.8rem 1rem 1rem;
`;

const ResultOkButton = styled.button`
  min-height: 38px;
  min-width: 92px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const formatGroupReferenceDate = (status: 'nota_fiscal_pendente' | 'paga', createdAt?: string, updatedAt?: string) => {
  const sourceDate = (status === 'paga' ? updatedAt : createdAt) || createdAt;
  if (!sourceDate) return '-';
  const parsed = new Date(sourceDate);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const getGroupDisplayNumber = (
  group: { clientSequenceNumber?: number },
  index: number,
  total: number,
) => {
  if (typeof group.clientSequenceNumber === 'number' && Number.isFinite(group.clientSequenceNumber)) {
    return group.clientSequenceNumber;
  }
  // Fallback visual para grupos antigos ainda não migrados.
  return total - index;
};

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
  const [invoiceFeedback, setInvoiceFeedback] = useState<{
    tone: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const {
    orders,
    modalImage,
    setModalImage,
    selectedCacambaIds,
    closureGroups,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    invoiceNumber,
    setInvoiceNumber,
    isSubmittingPayment,
    cacambaMetaModal,
    setCacambaMetaModal,
    clientTotal,
    fetchOrders,
    toggleSelectCacamba,
    handleUpdateCacambaMeta,
    handleDownload,
    saveInvoiceForGroup,
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
            compactOnlyTotal={closureMode && (paymentStatus === 'paid' || paymentStatus === 'invoice_pending')}
          />

          {closureMode && (paymentStatus === 'paid' || paymentStatus === 'invoice_pending') ? (
            <GroupsLayout>
              <GroupList data-testid="closure-groups-list">
                {closureGroups.map((group, index) => (
                  <GroupItem
                    key={group._id}
                    type="button"
                    $active={selectedGroupId === group._id}
                    onClick={() => setSelectedGroupId(group._id)}
                    data-testid={`closure-group-item-${group._id}`}
                  >
                    <div><strong>Grupo #{getGroupDisplayNumber(group, index, closureGroups.length)}</strong></div>
                    <div>NF: {group.invoiceNumber || '-'}</div>
                  </GroupItem>
                ))}
              </GroupList>
              <GroupDetail>
                {selectedGroup ? (
                  <>
                    <div><strong>Detalhes da nota fiscal</strong></div>
                    <MetaRow>
                      <div>NF atual: {selectedGroup.invoiceNumber || '-'}</div>
                      <div>{formatGroupReferenceDate(selectedGroup.status, selectedGroup.createdAt, selectedGroup.updatedAt)}</div>
                    </MetaRow>
                    <div>
                      Valor total da nota:{' '}
                      <strong>
                        {formatCurrency(
                          (selectedGroup.cacambaIds || []).reduce((sum, cacamba) => {
                            const price = Number(cacamba.price);
                            return Number.isFinite(price) ? sum + price : sum;
                          }, 0),
                        )}
                      </strong>
                    </div>
                    {selectedGroup.status === 'nota_fiscal_pendente' && (
                      <InvoiceRow>
                        <InvoiceInput
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          placeholder="Número da nota fiscal"
                          data-testid="closure-group-invoice-input"
                        />
                        <SaveInvoiceButton
                          type="button"
                          data-testid="closure-group-save-invoice"
                          onClick={async () => {
                            try {
                              await saveInvoiceForGroup(selectedGroup._id, invoiceNumber);
                              setInvoiceNumber('');
                              setInvoiceFeedback({
                                tone: 'success',
                                title: 'NF salva com sucesso',
                                message: 'A nota fiscal foi vinculada e o grupo foi marcado como pago.',
                              });
                            } catch (error) {
                              setInvoiceFeedback({
                                tone: 'error',
                                title: 'Erro ao salvar NF',
                                message:
                                  error instanceof Error ? error.message : 'Nao foi possivel salvar a nota fiscal.',
                              });
                            }
                          }}
                        >
                          Salvar NF
                        </SaveInvoiceButton>
                      </InvoiceRow>
                    )}
                    <CacambaList
                      cacambas={selectedGroup.cacambaIds || []}
                      onImageClick={setModalImage}
                      showTitle={false}
                    />
                  </>
                ) : (
                  <div>Nenhum grupo disponível no período.</div>
                )}
              </GroupDetail>
            </GroupsLayout>
          ) : (
            <ClientOrdersList
              orders={orders}
              closureMode={closureMode}
              selectedCacambaIds={selectedCacambaIds}
              onToggleSelect={toggleSelectCacamba}
              onImageClick={setModalImage}
              onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
              onEditContentType={(cacamba) => setCacambaMetaModal({ mode: 'contentType', cacamba })}
            />
          )}
        </ModalBody>

        {paymentStatus !== 'paid' && paymentStatus !== 'invoice_pending' && (
          <ClientOrdersFooter
            onDownload={handleDownload}
            disabled={
              orders.length === 0 || isSubmittingPayment || (closureMode && selectedCacambaIds.length === 0)
            }
            isSubmittingPayment={isSubmittingPayment}
            closureMode={closureMode}
          />
        )}
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

      {invoiceFeedback && (
        <ResultOverlay onClick={() => setInvoiceFeedback(null)}>
          <ResultModal onClick={(event) => event.stopPropagation()} data-testid="invoice-feedback-modal">
            <ResultHeader $tone={invoiceFeedback.tone}>{invoiceFeedback.title}</ResultHeader>
            <ResultBody>{invoiceFeedback.message}</ResultBody>
            <ResultFooter>
              <ResultOkButton type="button" onClick={() => setInvoiceFeedback(null)}>
                OK
              </ResultOkButton>
            </ResultFooter>
          </ResultModal>
        </ResultOverlay>
      )}
    </ModalOverlay>
  );
};

export default ClientOrdersModal;
