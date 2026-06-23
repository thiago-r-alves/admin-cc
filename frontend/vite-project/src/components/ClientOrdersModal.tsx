import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import ImageModal from './ImageModal';
import CacambaMetaModal from './CacambaMetaModal';
import ActionConfirmModal from './ActionConfirmModal';
import ClientOrdersFooter from './clientOrdersModal/ClientOrdersFooter';
import ClientOrdersList from './clientOrdersModal/ClientOrdersList';
import ClientOrdersModalHeader from './clientOrdersModal/ClientOrdersModalHeader';
import ClientOrdersSummary from './clientOrdersModal/ClientOrdersSummary';
import { useClientOrdersModal } from './clientOrdersModal/useClientOrdersModal';
import type {
  ClientOrdersHistoryFilters,
  ClientOrdersHistoryLocal,
  ClientOrdersHistoryStatus,
  ClientOrdersHistoryType,
  ClientOrdersModalProps,
} from './clientOrdersModal/types';
import CacambaList from './CacambaList';
import ToastPopup from './ToastPopup';
import type { ICacamba, IClosureGroup } from '../interfaces';
import { normalizeBrazilianWhatsAppNumber, normalizeEmailAddress } from '../utils/whatsapp';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.68);

  @media (max-width: 768px) {
    padding: 0;
  }
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

  @media (max-width: 768px) {
    width: 100vw;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: 0;
  }
`;

const ModalBody = styled.div`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
`;

const Stepper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 1rem 1.25rem 0;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StepItem = styled.div<{ $active: boolean; $done: boolean }>`
  border: 1px solid
    ${({ $active, $done }) => ($active ? '#e30613' : $done ? '#86efac' : '#fecaca')};
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  background: ${({ $active, $done }) => ($active ? '#fff1f2' : $done ? '#f0fdf4' : '#fffafa')};
  color: ${({ $active, $done }) => ($active ? '#991b1b' : $done ? '#166534' : '#6b7280')};
`;

const StepLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const StepTitle = styled.div`
  margin-top: 0.2rem;
  font-size: 0.95rem;
  font-weight: 900;
`;

const SecondaryButton = styled.button`
  min-height: 38px;
  padding: 0.55rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;

  &:hover {
    border-color: #e30613;
    color: #e30613;
    background: #fff1f2;
  }
`;

const StageBody = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
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

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const GroupList = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 8px;
  overflow: auto;
  min-height: 0;
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
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-height: 0;
  overflow-y: auto;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ValueHighlight = styled.div`
  padding: 0.8rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fffafa;
  color: #991b1b;
  font-weight: 900;
`;

const InvoiceRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
  }
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

const HighlightButton = styled.button`
  min-height: 40px;
  border: 1px solid #e30613;
  border-radius: 8px;
  background: #e30613;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 0.55rem 0.9rem;
  cursor: pointer;

  &:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const PaymentMethodRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0 1.25rem 1rem;
`;

const PaymentMethodButton = styled.button<{ $active: boolean }>`
  min-height: 42px;
  border: 1px solid ${({ $active }) => ($active ? '#e30613' : '#fecaca')};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#fff1f2' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#991b1b' : '#4b5563')};
  font-weight: 900;
  cursor: pointer;
`;

const HistoryControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 0;
`;

const HistoryTypeTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const HistoryTypeButton = styled.button<{ $active: boolean }>`
  min-height: 40px;
  border: 1px solid ${({ $active }) => ($active ? '#e30613' : '#fecaca')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#fff1f2' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#991b1b' : '#374151')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const HistoryFilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(130px, 1fr)) auto;
  gap: 0.65rem;
  align-items: end;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const HistoryField = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.3rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const HistoryInput = styled.input`
  min-height: 38px;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  color: #111827;
  background: #ffffff;
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const HistorySelect = styled.select`
  min-height: 38px;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  color: #111827;
  background: #ffffff;
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const ClearFiltersButton = styled(SecondaryButton)`
  min-height: 38px;
  border-radius: 6px;
  white-space: nowrap;

  @media (max-width: 980px) {
    width: 100%;
  }
`;

const PixCode = styled.textarea`
  width: 100%;
  min-height: 110px;
  box-sizing: border-box;
  resize: vertical;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem;
  color: #374151;
  background: #fffafa;
  font-size: 0.78rem;
  overflow-wrap: anywhere;
`;

const EmptyState = styled.div`
  padding: 1rem;
  border: 1px dashed #fecaca;
  border-radius: 6px;
  background: #fffafa;
  color: #6b7280;
  font-size: 0.92rem;
`;

const InlineFeedback = styled.div<{ $tone: 'success' | 'error' }>`
  margin: 0 1.25rem;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  border: 1px solid ${({ $tone }) => ($tone === 'success' ? '#86efac' : '#fca5a5')};
  background: ${({ $tone }) => ($tone === 'success' ? '#f0fdf4' : '#fef2f2')};
  color: ${({ $tone }) => ($tone === 'success' ? '#166534' : '#991b1b')};
  font-size: 0.88rem;
  font-weight: 800;
`;

type ClosureStep = 'select' | 'invoice' | 'paid';

const formatGroupReferenceDate = (
  status: 'nota_fiscal_pendente' | 'pix_pendente' | 'paga',
  createdAt?: string,
  updatedAt?: string,
) => {
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
  return total - index;
};

const getGroupTotal = (group: IClosureGroup | null) =>
  (group?.cacambaIds || []).reduce((sum, cacamba) => {
    const price = Number(cacamba.price);
    return Number.isFinite(price) ? sum + price : sum;
  }, 0);

const historyTypeOptions: Array<{ value: ClientOrdersHistoryType; label: string }> = [
  { value: 'all', label: 'Todos os pedidos' },
  { value: 'retirada', label: 'Retiradas' },
  { value: 'entrega', label: 'Entregas' },
];

const ClientOrdersModal: React.FC<ClientOrdersModalProps> = ({
  client,
  onClose,
  startDate,
  endDate,
  type,
  initialType,
  closureMode = false,
  viewMode = 'create_closure',
  paymentStatus = 'all',
  onClosureStateChanged,
}) => {
  const [step, setStep] = useState<ClosureStep>('select');
  const [showHistory, setShowHistory] = useState(false);
  const [historyType, setHistoryType] = useState<ClientOrdersHistoryType>(
    () => initialType ?? type ?? 'all',
  );
  const [historyStartDate, setHistoryStartDate] = useState(startDate || '');
  const [historyEndDate, setHistoryEndDate] = useState(endDate || '');
  const [historyStatus, setHistoryStatus] = useState<ClientOrdersHistoryStatus>('all');
  const [historyLocal, setHistoryLocal] = useState<ClientOrdersHistoryLocal>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [invoiceFeedback, setInvoiceFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [toastFeedback, setToastFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [pendingReturn, setPendingReturn] = useState<{
    group: IClosureGroup;
    cacamba: ICacamba;
  } | null>(null);
  const [isReturningCacamba, setIsReturningCacamba] = useState(false);
  const shouldCloseOnMouseUpRef = useRef(false);
  const isHistoryMode = !closureMode;
  const historyFilters = useMemo<ClientOrdersHistoryFilters>(
    () => ({
      type: historyType,
      startDate: historyStartDate || undefined,
      endDate: historyEndDate || undefined,
      status: historyStatus,
      local: historyLocal,
      q: historySearch,
    }),
    [historyEndDate, historyLocal, historySearch, historyStartDate, historyStatus, historyType],
  );
  const hasHistoryFilters =
    historyType !== 'all' ||
    Boolean(historyStartDate) ||
    Boolean(historyEndDate) ||
    historyStatus !== 'all' ||
    historyLocal !== 'all' ||
    Boolean(historySearch.trim());

  const {
    orders,
    currentClosureGroup,
    closureGroups,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    invoiceNumber,
    setInvoiceNumber,
    paymentMethod,
    setPaymentMethod,
    isEditingInvoice,
    setIsEditingInvoice,
    modalImage,
    setModalImage,
    selectedCacambaIds,
    isSubmittingPayment,
    isLoadingHistory,
    cacambaMetaModal,
    setCacambaMetaModal,
    clientTotal,
    fetchExistingClosureGroups,
    toggleSelectCacamba,
    handleUpdateCacambaMeta,
    handleDownload,
    downloadExistingClosureGroup,
    shareClosureGroupOnWhatsApp,
    shareClosureGroupByEmail,
    saveInvoiceForGroup,
    markPixGroupPaid,
    returnCacambaToPending,
  } = useClientOrdersModal({
    client,
    startDate,
    endDate,
    type,
    historyFilters: isHistoryMode ? historyFilters : undefined,
    closureMode,
    viewMode,
    paymentStatus,
    onClosureStateChanged,
  });

  const isGeneratedNotesView = viewMode === 'generated_notes';
  const isMetadataPendingView = closureMode && paymentStatus === 'metadata_pending';
  const fetchExistingClosureGroupsRef = useRef(fetchExistingClosureGroups);

  useEffect(() => {
    fetchExistingClosureGroupsRef.current = fetchExistingClosureGroups;
  }, [fetchExistingClosureGroups]);

  const displayedGroup = useMemo(() => {
    if (showHistory && selectedGroup) return selectedGroup;
    return currentClosureGroup || selectedGroup || null;
  }, [currentClosureGroup, selectedGroup, showHistory]);

  const stepItems = [
    { key: 'select' as const, label: 'Etapa 1', title: 'Selecionar caçambas' },
    { key: 'invoice' as const, label: 'Etapa 2', title: 'Grupo gerado' },
    { key: 'paid' as const, label: 'Etapa 3', title: 'Pagamento concluído' },
  ];

  const stepIndex = stepItems.findIndex((item) => item.key === step);

  useEffect(() => {
    if (!closureMode) return;

    if (isGeneratedNotesView) {
      setStep('paid');
      setShowHistory(true);
      setIsEditingInvoice(false);
      void fetchExistingClosureGroupsRef.current('all');
      return;
    }

    if (paymentStatus === 'paid') {
      setStep('paid');
      setShowHistory(true);
      setIsEditingInvoice(false);
      void fetchExistingClosureGroupsRef.current('paga');
      return;
    }

    if (paymentStatus === 'invoice_pending') {
      setStep('invoice');
      setShowHistory(true);
      setIsEditingInvoice(false);
      void fetchExistingClosureGroupsRef.current('nota_fiscal_pendente');
      return;
    }

    if (paymentStatus === 'pix_pending') {
      setStep('invoice');
      setShowHistory(true);
      setIsEditingInvoice(false);
      void fetchExistingClosureGroupsRef.current('pix_pendente');
      return;
    }

    setStep('select');
    setShowHistory(false);
    setIsEditingInvoice(false);
  }, [closureMode, isGeneratedNotesView, paymentStatus, setIsEditingInvoice]);

  const handleGenerateClosure = async () => {
    try {
      setInvoiceFeedback(null);
      const createdGroup = await handleDownload();
      if (createdGroup) {
        setShowHistory(false);
        setStep('invoice');
        setInvoiceNumber('');
        setIsEditingInvoice(false);
      }
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Não foi possível gerar o fechamento.',
      });
    }
  };

  const handleClearHistoryFilters = () => {
    setHistoryType('all');
    setHistoryStartDate('');
    setHistoryEndDate('');
    setHistoryStatus('all');
    setHistoryLocal('all');
    setHistorySearch('');
  };

  const handleSaveInvoice = async () => {
    if (!displayedGroup?._id) return;

    const wasPaid = displayedGroup.status === 'paga';
    try {
      await saveInvoiceForGroup(displayedGroup._id, invoiceNumber);
      if (!wasPaid) {
        await fetchExistingClosureGroups('all');
      }
      setInvoiceNumber('');
      setShowHistory(true);
      setStep('paid');
      setInvoiceFeedback(null);
      if (wasPaid) {
        setToastFeedback({
          tone: 'success',
          message: 'Nota fiscal atualizada com sucesso.',
        });
      }
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Não foi possível salvar a nota fiscal.',
      });
    }
  };

  const handleConfirmReturnToPending = async () => {
    if (!pendingReturn) return;

    try {
      setIsReturningCacamba(true);
      setInvoiceFeedback(null);
      await returnCacambaToPending(pendingReturn.group._id, pendingReturn.cacamba._id);
      setToastFeedback({
        tone: 'success',
        message: `Caçamba #${pendingReturn.cacamba.numero} voltou para pendente.`,
      });
      setPendingReturn(null);
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Não foi possível voltar a caçamba para pendente.',
      });
    } finally {
      setIsReturningCacamba(false);
    }
  };

  const handleMarkPixPaid = async (group: IClosureGroup) => {
    try {
      setInvoiceFeedback(null);
      await markPixGroupPaid(group._id);
      setStep('paid');
      setToastFeedback({ tone: 'success', message: 'Pagamento Pix confirmado com sucesso.' });
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível confirmar o Pix.',
      });
    }
  };

  const handleShareOnWhatsApp = async (group: IClosureGroup) => {
    try {
      setInvoiceFeedback(null);
      await shareClosureGroupOnWhatsApp(group);
      setToastFeedback({
        tone: 'success',
        message: 'PDF baixado. Anexe-o no chat e envie a mensagem preparada.',
      });
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível abrir o WhatsApp.',
      });
    }
  };

  const handleShareByEmail = async (group: IClosureGroup) => {
    try {
      setInvoiceFeedback(null);
      await shareClosureGroupByEmail(group);
      setToastFeedback({
        tone: 'success',
        message: 'PDF baixado. Anexe-o no email aberto e envie a mensagem preparada.',
      });
    } catch (error) {
      setInvoiceFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível abrir o email.',
      });
    }
  };

  const renderGroupDetails = (group: IClosureGroup | null) => {
    if (!group) {
      return (
        <EmptyState>
          {isLoadingHistory
            ? 'Carregando grupos anteriores...'
            : 'Nenhum grupo de fechamento disponível para este cliente.'}
        </EmptyState>
      );
    }

    const canShareOnWhatsApp = Boolean(normalizeBrazilianWhatsAppNumber(client.contactNumber));
    const canShareByEmail = Boolean(normalizeEmailAddress(client.email));

    return (
      <>
        <div>
          <strong>{group.paymentMethod === 'pix' ? 'Detalhes do Pix' : 'Detalhes da nota fiscal'}</strong>
        </div>
        <MetaRow>
          <div>Grupo #{getGroupDisplayNumber(group, 0, closureGroups.length || 1)}</div>
          <div>{formatGroupReferenceDate(group.status, group.createdAt, group.updatedAt)}</div>
        </MetaRow>
        <div>Pagamento: {group.paymentMethod === 'pix' ? 'Pix' : 'NF'}</div>
        {group.paymentMethod !== 'pix' && <div>NF atual: {group.invoiceNumber || '-'}</div>}
        <ValueHighlight>
          {group.paymentMethod === 'pix' ? 'Valor total do Pix' : 'Valor total da nota'}:{' '}
          {formatCurrency(group.totalAmount ?? getGroupTotal(group))}
        </ValueHighlight>
        {group.paymentMethod === 'pix' && group.pixCopyPaste && (
          <>
            <PixCode readOnly value={group.pixCopyPaste} aria-label="Pix copia e cola" />
            <ActionButtonsRow>
              <SecondaryButton
                type="button"
                data-testid="closure-group-copy-pix"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(group.pixCopyPaste || '');
                    setInvoiceFeedback(null);
                    setToastFeedback({ tone: 'success', message: 'Código Pix copiado.' });
                  } catch {
                    setInvoiceFeedback({
                      tone: 'error',
                      message: 'Não foi possível copiar o código Pix.',
                    });
                  }
                }}
              >
                Copiar Pix
              </SecondaryButton>
              {group.status === 'pix_pendente' && (
                <HighlightButton
                  type="button"
                  data-testid="closure-group-mark-pix-paid"
                  onClick={() => handleMarkPixPaid(group)}
                >
                  Marcar Pix como pago
                </HighlightButton>
              )}
            </ActionButtonsRow>
          </>
        )}
        <ActionButtonsRow>
          <HighlightButton
            type="button"
            data-testid="closure-group-download"
            onClick={() => downloadExistingClosureGroup(group)}
          >
            Baixar nota
          </HighlightButton>
          {canShareOnWhatsApp && (
            <SecondaryButton
              type="button"
              data-testid="closure-group-share-whatsapp"
              onClick={() => handleShareOnWhatsApp(group)}
            >
              Enviar por WhatsApp
            </SecondaryButton>
          )}
          {canShareByEmail && (
            <SecondaryButton
              type="button"
              data-testid="closure-group-share-email"
              onClick={() => handleShareByEmail(group)}
            >
              Enviar por email
            </SecondaryButton>
          )}
          {group.invoiceNumber && !isEditingInvoice && (
            <SecondaryButton
              type="button"
              data-testid="closure-group-edit-invoice"
              onClick={() => {
                setInvoiceNumber(group.invoiceNumber || '');
                setIsEditingInvoice(true);
              }}
            >
              Editar NF
            </SecondaryButton>
          )}
        </ActionButtonsRow>
        {group.paymentMethod !== 'pix' && (group.status === 'nota_fiscal_pendente' || isEditingInvoice) && (
          <InvoiceRow>
            <InvoiceInput
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              placeholder="Número da nota fiscal"
              data-testid="closure-group-invoice-input"
            />
            <SaveInvoiceButton
              type="button"
              data-testid="closure-group-save-invoice"
              onClick={handleSaveInvoice}
            >
              {isEditingInvoice ? 'Salvar alteração' : 'Salvar NF'}
            </SaveInvoiceButton>
            {isEditingInvoice && (
              <SecondaryButton
                type="button"
                onClick={() => {
                  setInvoiceNumber(group.invoiceNumber || '');
                  setIsEditingInvoice(false);
                }}
              >
                Cancelar
              </SecondaryButton>
            )}
          </InvoiceRow>
        )}
        <CacambaList
          cacambas={group.cacambaIds || []}
          onImageClick={setModalImage}
          showTitle={false}
          onReturnToPending={(cacamba) => setPendingReturn({ group, cacamba })}
          showDeliveryDateForRetirada
        />
      </>
    );
  };

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    shouldCloseOnMouseUpRef.current = event.target === event.currentTarget;
  };

  const handleOverlayMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (shouldCloseOnMouseUpRef.current && event.target === event.currentTarget) {
      onClose();
    }
    shouldCloseOnMouseUpRef.current = false;
  };

  return (
    <ModalOverlay onMouseDown={handleOverlayMouseDown} onMouseUp={handleOverlayMouseUp}>
      <ToastPopup
        message={toastFeedback?.message}
        tone={toastFeedback?.tone}
        onClose={() => setToastFeedback(null)}
      />
      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}

      <ModalContent
        data-testid="client-orders-modal"
        onMouseDown={() => {
          shouldCloseOnMouseUpRef.current = false;
        }}
        onMouseUp={(event) => event.stopPropagation()}
      >
        <ClientOrdersModalHeader clientName={client.clientName} onClose={onClose} />

        <ModalBody>
          {isHistoryMode && (
            <HistoryControls>
              <HistoryTypeTabs aria-label="Tipo de pedido">
                {historyTypeOptions.map((option) => (
                  <HistoryTypeButton
                    key={option.value}
                    type="button"
                    $active={historyType === option.value}
                    onClick={() => setHistoryType(option.value)}
                  >
                    {option.label}
                  </HistoryTypeButton>
                ))}
              </HistoryTypeTabs>

              <HistoryFilterGrid>
                <HistoryField>
                  Início
                  <HistoryInput
                    type="date"
                    value={historyStartDate}
                    onChange={(event) => setHistoryStartDate(event.target.value)}
                  />
                </HistoryField>
                <HistoryField>
                  Fim
                  <HistoryInput
                    type="date"
                    value={historyEndDate}
                    onChange={(event) => setHistoryEndDate(event.target.value)}
                  />
                </HistoryField>
                <HistoryField>
                  Status
                  <HistorySelect
                    value={historyStatus}
                    onChange={(event) =>
                      setHistoryStatus(event.target.value as ClientOrdersHistoryStatus)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                  </HistorySelect>
                </HistoryField>
                <HistoryField>
                  Local
                  <HistorySelect
                    value={historyLocal}
                    onChange={(event) =>
                      setHistoryLocal(event.target.value as ClientOrdersHistoryLocal)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="via_publica">Via pública</option>
                    <option value="canteiro_obra">Canteiro de obra</option>
                  </HistorySelect>
                </HistoryField>
                <HistoryField>
                  Busca
                  <HistoryInput
                    type="search"
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Pedido ou caçamba"
                  />
                </HistoryField>
                <ClearFiltersButton
                  type="button"
                  onClick={handleClearHistoryFilters}
                  disabled={!hasHistoryFilters}
                >
                  Limpar filtros
                </ClearFiltersButton>
              </HistoryFilterGrid>
            </HistoryControls>
          )}

          {closureMode && !isGeneratedNotesView && !isMetadataPendingView && (
            <Stepper data-testid="closure-stepper">
              {stepItems.map((item, index) => (
                <StepItem key={item.key} $active={step === item.key} $done={index < stepIndex}>
                  <StepLabel>{item.label}</StepLabel>
                  <StepTitle>{item.title}</StepTitle>
                </StepItem>
              ))}
            </Stepper>
          )}

          {!isMetadataPendingView && (
            <ClientOrdersSummary
              clientTotal={
                isGeneratedNotesView
                  ? clientTotal
                  : step === 'select'
                    ? clientTotal
                    : getGroupTotal(displayedGroup)
              }
              totalOrders={
                isGeneratedNotesView
                  ? closureGroups.length
                  : step === 'select'
                    ? orders.length
                    : displayedGroup
                      ? 1
                      : 0
              }
              totalCacambas={
                isGeneratedNotesView
                  ? closureGroups.reduce((sum, group) => sum + (group.cacambaIds?.length || 0), 0)
                  : step === 'select'
                  ? orders.reduce((sum, order) => sum + (order.cacambas?.length || 0), 0)
                  : displayedGroup?.cacambaIds?.length || 0
              }
              closureMode={closureMode && !isGeneratedNotesView}
              selectedCount={
                isGeneratedNotesView
                  ? displayedGroup?.cacambaIds?.length || 0
                  : step === 'select'
                  ? selectedCacambaIds.length
                  : displayedGroup?.cacambaIds?.length || 0
              }
              compactOnlyTotal={isGeneratedNotesView || step !== 'select'}
            />
          )}

          {invoiceFeedback && (
            <InlineFeedback $tone={invoiceFeedback.tone}>
              {invoiceFeedback.message}
            </InlineFeedback>
          )}

          <StageBody>
            {isHistoryMode ? (
              <ClientOrdersList
                orders={orders}
                closureMode={false}
                selectedCacambaIds={[]}
                onToggleSelect={() => undefined}
                onImageClick={setModalImage}
                onEditPrice={() => undefined}
                onEditContentType={() => undefined}
              />
            ) : closureMode && !isGeneratedNotesView && step === 'select' ? (
              <ClientOrdersList
                orders={orders}
                closureMode
                emptyMessage={
                  isMetadataPendingView
                    ? 'Nenhuma caçamba com informações pendentes encontrada para este cliente.'
                    : undefined
                }
                selectedCacambaIds={selectedCacambaIds}
                onToggleSelect={toggleSelectCacamba}
                onImageClick={setModalImage}
                onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
                onEditContentType={(cacamba) =>
                  setCacambaMetaModal({ mode: 'contentType', cacamba })
                }
              />
            ) : step === 'paid' || showHistory ? (
              <GroupsLayout>
                <GroupList data-testid="closure-groups-list">
                  {closureGroups.map((group, index) => (
                    <GroupItem
                      key={group._id}
                      type="button"
                      $active={selectedGroupId === group._id}
                      onClick={() => {
                        setSelectedGroupId(group._id);
                        setIsEditingInvoice(false);
                        setInvoiceNumber(group.invoiceNumber || '');
                      }}
                      data-testid={`closure-group-item-${group._id}`}
                    >
                      <div>
                        <strong>
                          Grupo #{getGroupDisplayNumber(group, index, closureGroups.length)}
                        </strong>
                      </div>
                      <div>NF: {group.invoiceNumber || '-'}</div>
                      <div>{group.paymentMethod === 'pix' ? 'Pix' : 'NF'}</div>
                    </GroupItem>
                  ))}
                </GroupList>
                <GroupDetail>{renderGroupDetails(displayedGroup)}</GroupDetail>
              </GroupsLayout>
            ) : (
              <GroupsLayout style={{ gridTemplateColumns: '1fr' }}>
                <GroupDetail>{renderGroupDetails(displayedGroup)}</GroupDetail>
              </GroupsLayout>
            )}
          </StageBody>

          {closureMode && !isGeneratedNotesView && step === 'select' && !isMetadataPendingView && (
            <>
              <PaymentMethodRow aria-label="Forma de pagamento">
                <PaymentMethodButton
                  type="button"
                  $active={paymentMethod === 'invoice'}
                  onClick={() => setPaymentMethod('invoice')}
                >
                  Nota fiscal
                </PaymentMethodButton>
                <PaymentMethodButton
                  type="button"
                  $active={paymentMethod === 'pix'}
                  onClick={() => setPaymentMethod('pix')}
                >
                  Pix
                </PaymentMethodButton>
              </PaymentMethodRow>
              <ClientOrdersFooter
                onDownload={handleGenerateClosure}
                disabled={
                  orders.length === 0 || isSubmittingPayment || selectedCacambaIds.length === 0
                }
                isSubmittingPayment={isSubmittingPayment}
                closureMode
                actionLabel="Gerar fechamento"
              />
            </>
          )}
        </ModalBody>

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

        <ActionConfirmModal
          open={Boolean(pendingReturn)}
          title="Voltar caçamba para pendente"
          description={
            pendingReturn
              ? `A caçamba #${pendingReturn.cacamba.numero} será removida deste grupo e voltará para pendente.`
              : ''
          }
          confirmLabel="Voltar para pendente"
          variant="warning"
          loading={isReturningCacamba}
          onConfirm={handleConfirmReturnToPending}
          onClose={() => {
            if (!isReturningCacamba) setPendingReturn(null);
          }}
        />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ClientOrdersModal;
