import { useEffect, useMemo, useState } from 'react';
import type { ICacamba, IClosureGroup, IOrder } from '../../interfaces';
import { downloadClientOrdersPdf } from '../../utils/clientOrdersPdf';
import {
  buildSelectedOrders,
  getOrderTotal,
  hasPendingClosureMetadata,
} from './helpers';
import type { CacambaMetaState, CacambaMetaUpdates, ClientOrdersModalProps } from './types';

interface UseClientOrdersModalArgs
  extends Pick<
    ClientOrdersModalProps,
    | 'client'
    | 'startDate'
    | 'endDate'
    | 'type'
    | 'closureMode'
    | 'viewMode'
    | 'paymentStatus'
    | 'onClosureStateChanged'
  > {}

const apiUrl = import.meta.env.VITE_API_URL;

export const useClientOrdersModal = ({
  client,
  startDate,
  endDate,
  type,
  closureMode = false,
  viewMode = 'create_closure',
  paymentStatus = 'all',
  onClosureStateChanged,
}: UseClientOrdersModalArgs) => {
  const [eligibleOrders, setEligibleOrders] = useState<IOrder[]>([]);
  const [existingClosureGroups, setExistingClosureGroups] = useState<IClosureGroup[]>([]);
  const [currentClosureGroup, setCurrentClosureGroup] = useState<IClosureGroup | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedCacambaIds, setSelectedCacambaIds] = useState<string[]>([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [cacambaMetaModal, setCacambaMetaModal] = useState<CacambaMetaState | null>(null);
  const isMetadataPendingMode = closureMode && paymentStatus === 'metadata_pending';

  const filterOrdersForMetadataPending = (orders: IOrder[]) =>
    orders
      .map((order) => ({
        ...order,
        cacambas: (order.cacambas || []).filter((cacamba) => hasPendingClosureMetadata(cacamba)),
      }))
      .filter((order) => (order.cacambas?.length || 0) > 0);

  const fetchEligibleOrders = async () => {
    if (viewMode === 'generated_notes') {
      setEligibleOrders([]);
      setSelectedCacambaIds([]);
      return;
    }

    const query = new URLSearchParams();
    if (startDate && endDate) {
      query.append('startDate', startDate);
      query.append('endDate', endDate);
    }
    if (type) query.append('type', type);
    if (closureMode) {
      query.append('closure', 'true');
      query.append('paymentStatus', isMetadataPendingMode ? 'metadata_pending' : 'pending');
    } else if (paymentStatus !== 'all') {
      query.append('paymentStatus', paymentStatus);
    }

    const response = await fetch(`${apiUrl}/clients/${client._id}/orders?${query.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) return;

    const data = (await response.json()) as IOrder[];
    setEligibleOrders(isMetadataPendingMode ? filterOrdersForMetadataPending(data) : data);
    setSelectedCacambaIds([]);
  };

  const fetchExistingClosureGroups = async (
    status: 'nota_fiscal_pendente' | 'paga' | 'all' = 'all',
  ) => {
    setIsLoadingHistory(true);
    try {
      const query = new URLSearchParams();
      if (viewMode !== 'generated_notes' && startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
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
        if (currentClosureGroup && data.some((group) => group._id === currentClosureGroup._id)) {
          return currentClosureGroup._id;
        }
        return data[0]?._id || null;
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void fetchEligibleOrders();
    setExistingClosureGroups([]);
    setCurrentClosureGroup(null);
    setSelectedGroupId(null);
    setInvoiceNumber('');
    setIsEditingInvoice(false);
  }, [client._id, startDate, endDate, type, closureMode, viewMode, isMetadataPendingMode]);

  const selectedOrders = useMemo(() => {
    if (!closureMode) return eligibleOrders;
    return buildSelectedOrders(eligibleOrders, selectedCacambaIds);
  }, [eligibleOrders, selectedCacambaIds, closureMode]);

  const clientTotal = useMemo(
    () => eligibleOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    [eligibleOrders],
  );

  const selectedTotal = useMemo(
    () => selectedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    [selectedOrders],
  );

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

  const handleDownload = async () => {
    const payloadOrders = closureMode ? selectedOrders : eligibleOrders;
    if (payloadOrders.length === 0) return null;

    await downloadClientOrdersPdf({
      client,
      orders: payloadOrders,
      startDate,
      endDate,
      type,
      clientTotal: closureMode ? selectedTotal : clientTotal,
    });

    if (!closureMode) return null;

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
          paymentStatus: 'nota_fiscal_pendente',
        })),
      };

      setCurrentClosureGroup(createdGroup);
      setExistingClosureGroups((prev) => [
        createdGroup,
        ...prev.filter((group) => group._id !== createdGroup._id),
      ]);
      setSelectedGroupId(createdGroup._id);
      setInvoiceNumber('');

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
      startDate,
      endDate,
      type,
      clientTotal: (group.cacambaIds || []).reduce((sum, cacamba) => {
        const price = Number(cacamba.price);
        return Number.isFinite(price) ? sum + price : sum;
      }, 0),
    });
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
    isEditingInvoice,
    setIsEditingInvoice,
    modalImage,
    setModalImage,
    selectedCacambaIds,
    isSubmittingPayment,
    isLoadingHistory,
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
    handleDownload,
    downloadExistingClosureGroup,
    saveInvoiceForGroup,
    returnCacambaToPending,
  };
};
