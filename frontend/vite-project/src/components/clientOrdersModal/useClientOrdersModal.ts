import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ICacamba, IClosureGroup, IOrder } from '../../interfaces';
import { buildClientOrdersPdf, downloadClientOrdersPdf } from '../../utils/clientOrdersPdf';
import { downloadClosureReceiptPdf } from '../../utils/receiptPdf';
import {
  buildClosureShareMessage,
  buildEmailUrl,
  buildWhatsAppUrl,
  normalizeEmailAddress,
  normalizeBrazilianWhatsAppNumber,
} from '../../utils/whatsapp';
import {
  buildSelectedOrders,
  getClosureOrderTotal,
  getWithdrawalOrderTotal,
  hasPendingClosureMetadata,
} from './helpers';
import type {
  CacambaMetaState,
  CacambaMetaUpdates,
  ClientOrdersHistoryFilters,
  ClientOrdersModalProps,
} from './types';

type UseClientOrdersModalArgs = Pick<
  ClientOrdersModalProps,
  | 'client'
  | 'startDate'
  | 'endDate'
  | 'type'
  | 'closureMode'
  | 'viewMode'
  | 'paymentStatus'
  | 'onClosureStateChanged'
> & {
  historyFilters?: ClientOrdersHistoryFilters;
};

const apiUrl = import.meta.env.VITE_API_URL;

const getGroupTotal = (group: IClosureGroup) =>
  group.totalAmount ??
  (group.cacambaIds || []).reduce((sum, cacamba) => {
    const price = Number(cacamba.price);
    return Number.isFinite(price) ? sum + price : sum;
  }, 0);

export const useClientOrdersModal = ({
  client,
  startDate,
  endDate,
  type,
  closureMode = false,
  viewMode = 'create_closure',
  paymentStatus = 'all',
  historyFilters,
  onClosureStateChanged,
}: UseClientOrdersModalArgs) => {
  const [eligibleOrders, setEligibleOrders] = useState<IOrder[]>([]);
  const [existingClosureGroups, setExistingClosureGroups] = useState<IClosureGroup[]>([]);
  const [currentClosureGroup, setCurrentClosureGroup] = useState<IClosureGroup | null>(null);
  const currentClosureGroupRef = useRef<IClosureGroup | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [pixInfo, setPixInfo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'invoice' | 'pix'>('invoice');
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedCacambaIds, setSelectedCacambaIds] = useState<string[]>([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isInitialOrdersLoading, setIsInitialOrdersLoading] = useState(true);
  const [hasLoadedInitialClosureGroups, setHasLoadedInitialClosureGroups] = useState(false);
  const [cacambaMetaModal, setCacambaMetaModal] = useState<CacambaMetaState | null>(null);
  const isMetadataPendingMode = closureMode && paymentStatus === 'metadata_pending';

  useEffect(() => {
    currentClosureGroupRef.current = currentClosureGroup;
  }, [currentClosureGroup]);

  const filterOrdersForMetadataPending = useCallback((orders: IOrder[]) =>
    orders
      .map((order) => ({
        ...order,
        cacambas: (order.cacambas || []).filter((cacamba) => hasPendingClosureMetadata(cacamba)),
      }))
      .filter((order) => (order.cacambas?.length || 0) > 0), []);

  const fetchEligibleOrders = useCallback(async () => {
    try {
      if (viewMode === 'generated_notes') {
        setEligibleOrders([]);
        setSelectedCacambaIds([]);
        return;
      }

      const query = new URLSearchParams();
      if (closureMode) {
        if (startDate) {
          query.append('startDate', startDate);
        }
        if (endDate) {
          query.append('endDate', endDate);
        }
        query.append('closure', 'true');
        query.append('paymentStatus', isMetadataPendingMode ? 'metadata_pending' : 'pending');
      } else if (historyFilters) {
        if (historyFilters.startDate && historyFilters.endDate) {
          query.set('startDate', historyFilters.startDate);
          query.set('endDate', historyFilters.endDate);
        }
        if (historyFilters.type !== 'all') query.append('type', historyFilters.type);
        if (historyFilters.status !== 'all') query.append('status', historyFilters.status);
        if (historyFilters.local !== 'all') query.append('local', historyFilters.local);
        const trimmedSearch = historyFilters.q?.trim();
        if (trimmedSearch) query.append('q', trimmedSearch);
      } else if (paymentStatus !== 'all') {
        if (startDate && endDate) {
          query.append('startDate', startDate);
          query.append('endDate', endDate);
        }
        if (type) query.append('type', type);
        query.append('paymentStatus', paymentStatus);
      } else if (type) {
        if (startDate && endDate) {
          query.append('startDate', startDate);
          query.append('endDate', endDate);
        }
        query.append('type', type);
      } else if (startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }

      const response = await fetch(`${apiUrl}/clients/${client._id}/orders?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) return;

      const data = (await response.json()) as IOrder[];
      setEligibleOrders(isMetadataPendingMode ? filterOrdersForMetadataPending(data) : data);
      setSelectedCacambaIds([]);
    } catch {
      setEligibleOrders([]);
      setSelectedCacambaIds([]);
    } finally {
      setIsInitialOrdersLoading(false);
    }
  }, [
    client._id,
    closureMode,
    endDate,
    filterOrdersForMetadataPending,
    historyFilters,
    isMetadataPendingMode,
    paymentStatus,
    startDate,
    type,
    viewMode,
  ]);

  const fetchExistingClosureGroups = useCallback(async (
    status: 'nota_fiscal_pendente' | 'pix_pendente' | 'paga' | 'all' = 'all',
  ) => {
    setIsLoadingHistory(true);
    try {
      const query = new URLSearchParams();
      if (viewMode !== 'generated_notes') {
        if (startDate) {
          query.append('startDate', startDate);
        }
        if (endDate) {
          query.append('endDate', endDate);
        }
      }
      query.append('status', status);

      const response = await fetch(`${apiUrl}/clients/${client._id}/closure-groups?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) return;

      const data = (await response.json()) as IClosureGroup[];
      setExistingClosureGroups(data);
      setSelectedGroupId((currentId) => {
        if (currentId && data.some((group) => group._id === currentId)) return currentId;
        const currentGroup = currentClosureGroupRef.current;
        if (currentGroup && data.some((group) => group._id === currentGroup._id)) {
          return currentGroup._id;
        }
        return data[0]?._id || null;
      });
    } catch {
      setExistingClosureGroups([]);
      setSelectedGroupId(null);
    } finally {
      setIsLoadingHistory(false);
      setHasLoadedInitialClosureGroups(true);
    }
  }, [client._id, endDate, startDate, viewMode]);

  useEffect(() => {
    void fetchEligibleOrders();
    setExistingClosureGroups([]);
    setCurrentClosureGroup(null);
    setSelectedGroupId(null);
    setInvoiceNumber('');
    setPixInfo('');
    setIsEditingInvoice(false);
  }, [fetchEligibleOrders]);

  const selectedOrders = useMemo(() => {
    if (!closureMode) return eligibleOrders;
    return buildSelectedOrders(eligibleOrders, selectedCacambaIds);
  }, [eligibleOrders, selectedCacambaIds, closureMode]);

  const clientTotal = useMemo(
    () =>
      eligibleOrders.reduce(
        (sum, order) => sum + (closureMode ? getClosureOrderTotal(order) : getWithdrawalOrderTotal(order)),
        0,
      ),
    [eligibleOrders, closureMode],
  );

  const selectedTotal = useMemo(
    () => selectedOrders.reduce((sum, order) => sum + getClosureOrderTotal(order), 0),
    [selectedOrders],
  );

  const reportStartDate = closureMode ? startDate : historyFilters?.startDate;
  const reportEndDate = closureMode ? endDate : historyFilters?.endDate;
  const reportType =
    closureMode
      ? type
      : historyFilters?.type && historyFilters.type !== 'all'
        ? historyFilters.type
        : undefined;

  const selectedGroup = useMemo(
    () => existingClosureGroups.find((group) => group._id === selectedGroupId) || null,
    [existingClosureGroups, selectedGroupId],
  );

  const closureGroupsTotal = useMemo(
    () =>
      existingClosureGroups.reduce((groupSum, group) => {
        const groupTotal = (group.cacambaIds || []).reduce((sum, cacamba) => {
          const price = Number(cacamba.price);
          return Number.isFinite(price) ? sum + price : sum;
        }, 0);
        return groupSum + groupTotal;
      }, 0),
    [existingClosureGroups],
  );

  const toggleSelectCacamba = (cacamba: ICacamba, checked: boolean) => {
    setSelectedCacambaIds((current) => {
      if (checked) return Array.from(new Set([...current, cacamba._id]));
      return current.filter((id) => id !== cacamba._id);
    });
  };

  const replaceCacambaInOrders = (orders: IOrder[], updated: ICacamba) => {
    const nextOrders = orders.map((order) => ({
      ...order,
      cacambas: (order.cacambas || []).map((cacamba) =>
        cacamba._id === updated._id ? { ...cacamba, ...updated } : cacamba,
      ),
    }));

    return isMetadataPendingMode ? filterOrdersForMetadataPending(nextOrders) : nextOrders;
  };

  const replaceCacambaInGroup = (group: IClosureGroup | null, updated: ICacamba) => {
    if (!group) return group;
    return {
      ...group,
      cacambaIds: (group.cacambaIds || []).map((cacamba) =>
        cacamba._id === updated._id ? { ...cacamba, ...updated } : cacamba,
      ),
    };
  };

  const buildOrdersFromGroup = (group: IClosureGroup): IOrder[] => [
    {
      _id: String(group._id),
      orderNumber:
        typeof group.clientSequenceNumber === 'number' ? group.clientSequenceNumber : null,
      clientId: String(client._id),
      clientName: client.clientName,
      cnpjCpf: client.cnpjCpf,
      city: client.city,
      cep: client.cep,
      contactName: client.contactName || '',
      contactNumber: client.contactNumber || '',
      neighborhood: client.neighborhood || '',
      address: client.address || '',
      addressNumber: client.addressNumber || '',
      type: 'retirada',
      priority: 0,
      status: group.status === 'paga' ? 'concluido' : 'em_andamento',
      cacambas: group.cacambaIds || [],
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    },
  ];

  const handleUpdateCacambaMeta = async (cacambaId: string, updates: CacambaMetaUpdates) => {
    const response = await fetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao atualizar dados da caçamba.');
    }

    const updated = (data as { cacamba?: ICacamba }).cacamba;
    if (!updated?._id) {
      throw new Error('Resposta inválida ao atualizar caçamba.');
    }

    setEligibleOrders((prev) => replaceCacambaInOrders(prev, updated));
    setCurrentClosureGroup((prev) => replaceCacambaInGroup(prev, updated));
    setExistingClosureGroups((prev) =>
      prev.map((group) =>
        group.cacambaIds?.some((cacamba) => cacamba._id === updated._id)
          ? (replaceCacambaInGroup(group, updated) as IClosureGroup)
          : group,
      ),
    );
  };

  const handleUpdateCacambaFull = async (
    cacambaId: string,
    updates: Partial<ICacamba> & { image?: File | null },
  ) => {
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'image' || value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    if (updates.image) {
      formData.append('image', updates.image);
    }

    const response = await fetch(`${apiUrl}/cacambas/${cacambaId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao corrigir caçamba.');
    }

    const updated = (data as { cacamba?: ICacamba }).cacamba;
    if (!updated?._id) {
      throw new Error('Resposta inválida ao corrigir caçamba.');
    }

    setEligibleOrders((prev) => replaceCacambaInOrders(prev, updated));
    setCurrentClosureGroup((prev) => replaceCacambaInGroup(prev, updated));
    setExistingClosureGroups((prev) =>
      prev.map((group) =>
        group.cacambaIds?.some((cacamba) => cacamba._id === updated._id)
          ? (replaceCacambaInGroup(group, updated) as IClosureGroup)
          : group,
      ),
    );
  };

  const handleDownload = async () => {
    const payloadOrders = closureMode ? selectedOrders : eligibleOrders;
    if (payloadOrders.length === 0) return null;

    if (!closureMode) {
      await downloadClientOrdersPdf({
        client,
        orders: payloadOrders,
        startDate: reportStartDate,
        endDate: reportEndDate,
        type: reportType,
        clientTotal,
      });
      return null;
    }

    setIsSubmittingPayment(true);
    try {
      const response = await fetch(`${apiUrl}/closures/download`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: client._id,
          startDate,
          endDate,
          selectedCacambaIds,
          paymentMethod,
        }),
      });

      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || 'Erro ao agrupar caçambas no fechamento.');
      }

      const createdAt = new Date().toISOString();
      const selectedCacambas = payloadOrders.flatMap((order) => order.cacambas || []);
      const createdGroup: IClosureGroup = {
        ...((data as { closureGroup: Omit<IClosureGroup, 'cacambaIds'> }).closureGroup),
        createdAt,
        updatedAt: createdAt,
        cacambaIds: selectedCacambas.map((cacamba) => ({
          ...cacamba,
          paymentStatus:
            (data as { closureGroup?: { status?: IClosureGroup['status'] } }).closureGroup?.status ||
            'nota_fiscal_pendente',
        })),
      };

      setCurrentClosureGroup(createdGroup);
      setExistingClosureGroups((prev) => [
        createdGroup,
        ...prev.filter((group) => group._id !== createdGroup._id),
      ]);
      setSelectedGroupId(createdGroup._id);
      setInvoiceNumber('');
      setPixInfo(createdGroup.pixInfo || '');

      await downloadClientOrdersPdf({
        client,
        orders: payloadOrders,
        startDate: reportStartDate,
        endDate: reportEndDate,
        type: reportType,
        clientTotal: selectedTotal,
        paymentMethod: createdGroup.paymentMethod,
        pixCopyPaste: createdGroup.pixCopyPaste,
      });

      await onClosureStateChanged?.();
      await fetchEligibleOrders();
      return createdGroup;
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const downloadExistingClosureGroup = async (group: IClosureGroup) => {
    await downloadClientOrdersPdf({
      client,
      orders: buildOrdersFromGroup(group),
      startDate: reportStartDate,
      endDate: reportEndDate,
      type: reportType,
      clientTotal: getGroupTotal(group),
      paymentMethod: group.paymentMethod,
      pixCopyPaste: group.pixCopyPaste,
    });
  };

  const downloadClosureReceipt = async (group: IClosureGroup, recipientName: string) => {
    await downloadClosureReceiptPdf({
      client,
      group,
      recipientName,
    });
  };

  const downloadGroupPdfBlob = async (group: IClosureGroup, totalAmount: number) => {
    const { filename, blob } = await buildClientOrdersPdf(
      {
        client,
        orders: buildOrdersFromGroup(group),
        startDate: reportStartDate,
        endDate: reportEndDate,
        type: reportType,
        clientTotal: totalAmount,
        paymentMethod: group.paymentMethod,
        pixCopyPaste: group.pixCopyPaste,
      },
      { output: 'blob' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const buildGroupShareMessage = (group: IClosureGroup, totalAmount: number) =>
    buildClosureShareMessage({
      recipientName: client.contactName || client.clientName,
      cacambaCount: group.cacambaIds?.length || 0,
      totalAmount,
      paymentMethod: group.paymentMethod,
      pixCopyPaste: group.pixCopyPaste,
      invoiceNumber: group.invoiceNumber,
    });

  const shareClosureGroupOnWhatsApp = async (group: IClosureGroup) => {
    const phone = normalizeBrazilianWhatsAppNumber(client.contactNumber);
    if (!phone) {
      throw new Error('O telefone do cliente é inválido para abrir o WhatsApp.');
    }

    const totalAmount = getGroupTotal(group);
    const message = buildGroupShareMessage(group, totalAmount);
    const whatsappWindow = window.open('', '_blank');
    if (!whatsappWindow) {
      throw new Error('O navegador bloqueou a abertura do WhatsApp. Libere os pop-ups e tente novamente.');
    }

    try {
      await downloadGroupPdfBlob(group, totalAmount);
      whatsappWindow.location.href = buildWhatsAppUrl(phone, message);
    } catch (error) {
      whatsappWindow.close();
      throw error;
    }
  };

  const shareClosureGroupByEmail = async (group: IClosureGroup) => {
    const email = normalizeEmailAddress(client.email);
    if (!email) {
      throw new Error('O cliente não possui um e-mail válido cadastrado.');
    }

    const totalAmount = getGroupTotal(group);
    const message = buildGroupShareMessage(group, totalAmount);
    const emailWindow = window.open('', '_blank');
    if (!emailWindow) {
      throw new Error('O navegador bloqueou a abertura do email. Libere os pop-ups e tente novamente.');
    }
    try {
      await downloadGroupPdfBlob(group, totalAmount);
      emailWindow.location.href = buildEmailUrl({
        email,
        subject: `Fechamento Central Caçambas - ${client.clientName}`,
        body: message,
      });
    } catch (error) {
      emailWindow.close();
      throw error;
    }
  };

  const markPixGroupPaid = async (groupId: string) => {
    const response = await fetch(`${apiUrl}/closure-groups/${groupId}/mark-paid`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao confirmar pagamento Pix.');
    }
    setCurrentClosureGroup((prev) =>
      prev?._id === groupId
        ? { ...prev, status: 'paga', cacambaIds: prev.cacambaIds.map((c) => ({ ...c, paymentStatus: 'paga' })) }
        : prev,
    );
    setExistingClosureGroups((prev) =>
      prev.map((group) =>
        group._id === groupId
          ? { ...group, status: 'paga', cacambaIds: group.cacambaIds.map((c) => ({ ...c, paymentStatus: 'paga' })) }
          : group,
      ),
    );
    await onClosureStateChanged?.();
  };

  const saveInvoiceForGroup = async (groupId: string, invoice: string) => {
    const response = await fetch(`${apiUrl}/closure-groups/${groupId}/invoice`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceNumber: invoice }),
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao salvar nota fiscal.');
    }

    const updatedAt = new Date().toISOString();
    const nextInvoice = String(
      ((data as { closureGroup?: { invoiceNumber?: string } }).closureGroup?.invoiceNumber || invoice),
    );
    const nextStatus =
      ((data as { closureGroup?: { status?: IClosureGroup['status'] } }).closureGroup?.status || 'paga');

    setCurrentClosureGroup((prev) =>
      prev && prev._id === groupId
        ? {
            ...prev,
            ...((data as { closureGroup?: Partial<IClosureGroup> }).closureGroup || {}),
            status: nextStatus,
            invoiceNumber: nextInvoice,
            updatedAt,
            cacambaIds: (prev.cacambaIds || []).map((cacamba) => ({
              ...cacamba,
              paymentStatus: nextStatus === 'paga' ? 'paga' : cacamba.paymentStatus,
            })),
          }
        : prev,
    );

    setExistingClosureGroups((prev) =>
      prev.map((group) =>
        group._id === groupId
          ? {
              ...group,
              ...((data as { closureGroup?: Partial<IClosureGroup> }).closureGroup || {}),
              status: nextStatus,
              invoiceNumber: nextInvoice,
              updatedAt,
              cacambaIds: (group.cacambaIds || []).map((cacamba) => ({
                ...cacamba,
                paymentStatus: nextStatus === 'paga' ? 'paga' : cacamba.paymentStatus,
              })),
            }
          : group,
      ),
    );

    setSelectedGroupId(groupId);
    setIsEditingInvoice(false);
    await onClosureStateChanged?.();
    await fetchEligibleOrders();
  };

  const savePixInfoForGroup = async (groupId: string, info: string) => {
    const response = await fetch(`${apiUrl}/closure-groups/${groupId}/pix-info`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pixInfo: info }),
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao salvar informações do Pix.');
    }

    const updatedAt = new Date().toISOString();
    const nextPixInfo = String(
      ((data as { closureGroup?: { pixInfo?: string } }).closureGroup?.pixInfo ?? info),
    );

    setCurrentClosureGroup((prev) =>
      prev && prev._id === groupId
        ? {
            ...prev,
            ...((data as { closureGroup?: Partial<IClosureGroup> }).closureGroup || {}),
            pixInfo: nextPixInfo,
            updatedAt,
          }
        : prev,
    );

    setExistingClosureGroups((prev) =>
      prev.map((group) =>
        group._id === groupId
          ? {
              ...group,
              ...((data as { closureGroup?: Partial<IClosureGroup> }).closureGroup || {}),
              pixInfo: nextPixInfo,
              updatedAt,
            }
          : group,
      ),
    );

    setSelectedGroupId(groupId);
    setPixInfo(nextPixInfo);
    await onClosureStateChanged?.();
  };

  const returnCacambaToPending = async (groupId: string, cacambaId: string) => {
    const response = await fetch(`${apiUrl}/closure-groups/${groupId}/cacambas/${cacambaId}/reopen`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao voltar caçamba para pendente.');
    }

    const deletedGroup = Boolean((data as { deletedGroup?: boolean }).deletedGroup);

    setCurrentClosureGroup((prev) => {
      if (!prev || prev._id !== groupId) return prev;
      if (deletedGroup) return null;
      return {
        ...prev,
        cacambaIds: (prev.cacambaIds || []).filter((cacamba) => cacamba._id !== cacambaId),
      };
    });

    setExistingClosureGroups((prev) => {
      const nextGroups = deletedGroup
        ? prev.filter((group) => group._id !== groupId)
        : prev.map((group) =>
            group._id === groupId
              ? {
                  ...group,
                  cacambaIds: (group.cacambaIds || []).filter((cacamba) => cacamba._id !== cacambaId),
                }
              : group,
          );

      setSelectedGroupId((currentId) => {
        if (currentId !== groupId || !deletedGroup) return currentId;
        return nextGroups[0]?._id || null;
      });

      return nextGroups;
    });

    setSelectedCacambaIds((prev) => prev.filter((id) => id !== cacambaId));
    await onClosureStateChanged?.();
    await fetchEligibleOrders();
  };

  return {
    orders: eligibleOrders,
    eligibleOrders,
    closureGroups: existingClosureGroups,
    existingClosureGroups,
    currentClosureGroup,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    invoiceNumber,
    setInvoiceNumber,
    pixInfo,
    setPixInfo,
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
    selectedOrders,
    clientTotal:
      viewMode === 'generated_notes' || (closureMode && paymentStatus === 'paid')
        ? closureGroupsTotal
        : clientTotal,
    selectedTotal,
    fetchOrders: fetchEligibleOrders,
    fetchEligibleOrders,
    fetchExistingClosureGroups,
    toggleSelectCacamba,
    handleUpdateCacambaMeta,
    handleUpdateCacambaFull,
    handleDownload,
    downloadExistingClosureGroup,
    downloadClosureReceipt,
    shareClosureGroupOnWhatsApp,
    shareClosureGroupByEmail,
    saveInvoiceForGroup,
    savePixInfoForGroup,
    markPixGroupPaid,
    returnCacambaToPending,
  };
};
