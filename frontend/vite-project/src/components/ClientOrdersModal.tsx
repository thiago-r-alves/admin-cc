import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { cn } from '../utils/cn';
import { twComponent } from '../utils/twComponent';
import { normalizeBrazilianWhatsAppNumber, normalizeEmailAddress } from '../utils/whatsapp';

const ModalOverlay = twComponent('div', 'fixed inset-0 z-[1100] flex items-center justify-center bg-gray-900/70 p-4 max-md:p-0');

const ModalContent = twComponent(
  'div',
  'flex max-h-[min(92dvh,860px)] w-[min(1120px,94vw)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:rounded-none',
);

const ModalBody = twComponent('div', 'flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc]');

const Stepper = twComponent('div', 'flex flex-wrap items-center gap-2');

const StepItem = twComponent<'div', { $active: boolean; $done: boolean }>(
  'div',
  '',
  ({ $active, $done }) =>
    cn(
      'inline-flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-full border px-3 py-[0.45rem] max-[640px]:flex-[1_1_100%]',
      $active && 'border-brand bg-brand-soft text-brand',
      !$active && $done && 'border-green-300 bg-green-50 text-green-800',
      !$active && !$done && 'border-gray-200 bg-white text-gray-500',
    ),
);

const StepLabel = twComponent('div', 'text-[0.68rem] font-black uppercase tracking-[0.05em]');

const StepTitle = twComponent('div', 'truncate text-[0.82rem] font-black');

const SecondaryButton = twComponent(
  'button',
  'min-h-[38px] cursor-pointer rounded-lg border border-gray-300 bg-white px-[0.9rem] py-[0.55rem] text-[0.78rem] font-black text-gray-700 hover:border-[#e30613] hover:bg-rose-50 hover:text-[#e30613]',
);

const StageBody = twComponent('div', 'flex min-h-0 flex-1 flex-col overflow-hidden');

const ClosureWorkspace = twComponent(
  'div',
  'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-4 p-4 max-[980px]:grid-cols-1 max-[980px]:overflow-y-auto max-[640px]:p-3',
);

const ClosureMain = twComponent(
  'section',
  'flex min-h-0 flex-col overflow-hidden rounded-ui-lg border border-gray-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] max-[980px]:min-h-[420px]',
);

const ClosureMainHeader = twComponent('div', 'flex-none border-b border-gray-100 px-4 py-3');

const ClosureAside = twComponent(
  'aside',
  'flex min-h-0 flex-col gap-3 overflow-y-auto rounded-ui-lg border border-gray-200 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] max-[980px]:overflow-visible',
);

const PaymentPanel = twComponent('div', 'grid gap-3 border-t border-gray-100 pt-3');

const PanelTitle = twComponent('h3', 'm-0 text-[0.78rem] font-black uppercase tracking-[0.05em] text-gray-500');

const GroupsLayout = twComponent(
  'div',
  'grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-3 px-5 pb-5 pt-4 max-[900px]:grid-cols-1',
);

const GroupList = twComponent('div', 'min-h-0 overflow-auto rounded-lg border border-gray-200');

const GroupItem = twComponent<'button', { $active: boolean }>(
  'button',
  '',
  ({ $active }) =>
    cn(
      'w-full cursor-pointer border-0 border-b border-red-100 px-3 py-[0.7rem] text-left',
      $active ? 'bg-brand-soft' : 'bg-white',
    ),
);

const GroupDetail = twComponent(
  'div',
  'flex min-h-0 flex-col gap-[0.8rem] overflow-y-auto rounded-lg border border-gray-200 bg-white p-[0.9rem]',
);

const MetaRow = twComponent('div', 'flex flex-wrap items-center justify-between gap-4');

const ValueHighlight = twComponent(
  'div',
  'rounded-lg border border-brand-border bg-brand-soft px-[0.9rem] py-[0.8rem] font-black text-brand',
);

const InvoiceRow = twComponent('div', 'flex flex-wrap gap-[0.6rem] max-sm:flex-col');

const InvoiceInput = twComponent(
  'input',
  'min-h-10 flex-1 rounded-md border border-red-200 px-[0.65rem] py-[0.55rem]',
);

const SaveInvoiceButton = twComponent(
  'button',
  'min-h-10 cursor-pointer rounded-md border border-[#e30613] bg-[#e30613] px-[0.8rem] font-extrabold text-white',
);

const HighlightButton = twComponent(
  'button',
  'min-h-10 cursor-pointer rounded-lg border border-[#e30613] bg-[#e30613] px-[0.9rem] py-[0.55rem] text-[0.78rem] font-black text-white hover:border-red-700 hover:bg-red-700',
);

const ActionButtonsRow = twComponent('div', 'flex flex-wrap gap-[0.6rem]');

const PaymentMethodRow = twComponent('div', 'grid grid-cols-2 gap-2');

const PaymentMethodButton = twComponent<'button', { $active: boolean }>(
  'button',
  '',
  ({ $active }) =>
    cn(
      'min-h-[42px] cursor-pointer rounded-lg border font-black',
      $active ? 'border-brand bg-brand-soft text-brand' : 'border-gray-200 bg-white text-gray-600',
    ),
);

const HistoryControls = twComponent('div', 'flex flex-col gap-3 px-5 pt-4');

const HistoryTypeTabs = twComponent('div', 'grid grid-cols-3 gap-2 max-sm:grid-cols-1');

const HistoryTypeButton = twComponent<'button', { $active: boolean }>(
  'button',
  '',
  ({ $active }) =>
    cn(
      'min-h-10 cursor-pointer rounded-md border text-[0.78rem] font-black uppercase',
      $active ? 'border-brand bg-brand-soft text-brand' : 'border-gray-200 bg-white text-gray-700',
    ),
);

const HistoryFilterGrid = twComponent(
  'div',
  'grid grid-cols-[repeat(5,minmax(130px,1fr))_auto] items-end gap-[0.65rem] max-[980px]:grid-cols-2 max-sm:grid-cols-1',
);

const HistoryField = twComponent(
  'label',
  'flex min-w-0 flex-col gap-[0.3rem] text-[0.72rem] font-black uppercase text-gray-600',
);

const HistoryInput = twComponent(
  'input',
  'box-border min-h-[38px] w-full rounded-md border border-gray-200 bg-white px-[0.65rem] py-2 text-[0.85rem] text-gray-900 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand-focus',
);

const HistorySelect = twComponent(
  'select',
  'box-border min-h-[38px] w-full rounded-md border border-gray-200 bg-white px-[0.65rem] py-2 text-[0.85rem] text-gray-900 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand-focus',
);

const ClearFiltersButton = twComponent(
  'button',
  'min-h-[38px] cursor-pointer whitespace-nowrap rounded-md border border-gray-300 bg-white px-[0.9rem] py-[0.55rem] text-[0.78rem] font-black text-gray-700 hover:border-[#e30613] hover:bg-rose-50 hover:text-[#e30613] max-[980px]:w-full',
);

const PixCode = twComponent(
  'textarea',
  'box-border min-h-[110px] w-full resize-y rounded-lg border border-red-200 bg-[#fffafa] p-3 text-[0.78rem] text-gray-700 [overflow-wrap:anywhere]',
);

const EmptyState = twComponent(
  'div',
  'rounded-md border border-dashed border-gray-300 bg-white p-4 text-[0.92rem] text-gray-500',
);

const InlineFeedback = twComponent<'div', { $tone: 'success' | 'error' }>(
  'div',
  '',
  ({ $tone }) =>
    cn(
      'mx-5 rounded-lg border px-[0.9rem] py-3 text-[0.88rem] font-extrabold',
      $tone === 'success'
        ? 'border-green-300 bg-green-50 text-green-800'
        : 'border-red-300 bg-red-50 text-red-800',
    ),
);

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
  onInitialContentReady,
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
    isInitialOrdersLoading,
    hasLoadedInitialClosureGroups,
    cacambaMetaModal,
    setCacambaMetaModal,
    clientTotal,
    selectedTotal,
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

  const requiresInitialClosureGroups =
    isGeneratedNotesView ||
    (closureMode && ['paid', 'invoice_pending', 'pix_pending'].includes(paymentStatus));
  const isInitialContentLoading =
    Boolean(isInitialOrdersLoading) ||
    (requiresInitialClosureGroups && hasLoadedInitialClosureGroups === false);

  useEffect(() => {
    if (!isInitialContentLoading) {
      onInitialContentReady?.();
    }
  }, [isInitialContentLoading, onInitialContentReady]);

  if (isInitialContentLoading) return null;

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
            style={{ background: 'rgb(227, 6, 19)', color: 'rgb(255, 255, 255)' }}
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

  const isClosureSelectionView =
    closureMode && !isGeneratedNotesView && !isMetadataPendingView && step === 'select';
  const isClosureActionDisabled =
    orders.length === 0 || isSubmittingPayment || selectedCacambaIds.length === 0;
  const closureActionLabel =
    selectedCacambaIds.length > 0 ? 'Gerar fechamento' : 'Selecione caçambas';

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

          {isClosureSelectionView ? (
            <ClosureWorkspace>
              <ClosureMain>
                <ClosureMainHeader>
                  <Stepper data-testid="closure-stepper">
                    {stepItems.map((item, index) => (
                      <StepItem key={item.key} $active={step === item.key} $done={index < stepIndex}>
                        <StepLabel>{item.label}</StepLabel>
                        <StepTitle>{item.title}</StepTitle>
                      </StepItem>
                    ))}
                  </Stepper>
                </ClosureMainHeader>

                {invoiceFeedback && (
                  <InlineFeedback $tone={invoiceFeedback.tone} className="mx-4 mt-3">
                    {invoiceFeedback.message}
                  </InlineFeedback>
                )}

                <ClientOrdersList
                  orders={orders}
                  closureMode
                  selectedCacambaIds={selectedCacambaIds}
                  onToggleSelect={toggleSelectCacamba}
                  onImageClick={setModalImage}
                  onEditPrice={(cacamba) => setCacambaMetaModal({ mode: 'price', cacamba })}
                  onEditContentType={(cacamba) =>
                    setCacambaMetaModal({ mode: 'contentType', cacamba })
                  }
                  compact
                />
              </ClosureMain>

              <ClosureAside>
                <PanelTitle>Resumo</PanelTitle>
                <ClientOrdersSummary
                  clientTotal={selectedTotal}
                  totalOrders={orders.length}
                  totalCacambas={orders.reduce((sum, order) => sum + (order.cacambas?.length || 0), 0)}
                  closureMode
                  selectedCount={selectedCacambaIds.length}
                  totalLabel="Total do fechamento"
                  stacked
                />

                <PaymentPanel>
                  <PanelTitle>Pagamento</PanelTitle>
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
                    disabled={isClosureActionDisabled}
                    isSubmittingPayment={isSubmittingPayment}
                    closureMode
                    actionLabel={closureActionLabel}
                    className="pt-1"
                  />
                </PaymentPanel>
              </ClosureAside>
            </ClosureWorkspace>
          ) : (
            <>
              {closureMode && !isGeneratedNotesView && !isMetadataPendingView && (
                <Stepper className="mx-5 mt-4" data-testid="closure-stepper">
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
                  className="mx-5 mt-4"
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
                  totalLabel={closureMode ? 'Total do fechamento' : undefined}
                />
              )}

              {invoiceFeedback && (
                <InlineFeedback $tone={invoiceFeedback.tone} className="mt-4">
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
