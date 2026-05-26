import { useEffect, useMemo, useState } from 'react';
import type { ICacamba, IClosureGroup, IOrder } from '../../interfaces';
import { downloadClientOrdersPdf } from '../../utils/clientOrdersPdf';
import { buildSelectedOrders, getOrderTotal } from './helpers';
import type { CacambaMetaState, CacambaMetaUpdates, ClientOrdersModalProps } from './types';

interface UseClientOrdersModalArgs
  extends Pick<
    ClientOrdersModalProps,
    | 'client'
    | 'startDate'
    | 'endDate'
    | 'type'
    | 'closureMode'
    | 'paymentStatus'
    | 'onPaymentCompleted'
  > {}

const apiUrl = import.meta.env.VITE_API_URL;

export const useClientOrdersModal = ({
  client,
  startDate,
  endDate,
  type,
  closureMode = false,
  paymentStatus = 'all',
  onPaymentCompleted,
}: UseClientOrdersModalArgs) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [closureGroups, setClosureGroups] = useState<IClosureGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedCacambaIds, setSelectedCacambaIds] = useState<string[]>([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [cacambaMetaModal, setCacambaMetaModal] = useState<CacambaMetaState | null>(null);

  const fetchOrders = async () => {
    if (closureMode && (paymentStatus === 'paid' || paymentStatus === 'invoice_pending')) {
      const query = new URLSearchParams();
      if (startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }
      query.append('status', paymentStatus === 'paid' ? 'paga' : 'nota_fiscal_pendente');
      const response = await fetch(`${apiUrl}/clients/${client._id}/closure-groups?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = (await response.json()) as IClosureGroup[];
        setClosureGroups(data);
        setSelectedGroupId(data[0]?._id || null);
        setOrders([]);
        setSelectedCacambaIds([]);
      }
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
      query.append('paymentStatus', paymentStatus);
    }

    const response = await fetch(`${apiUrl}/clients/${client._id}/orders?${query.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (response.ok) {
      const data = await response.json();
      setOrders(data);
      setClosureGroups([]);
      setSelectedGroupId(null);
      setSelectedCacambaIds([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [client._id, startDate, endDate, type, closureMode, paymentStatus]);

  const selectedOrders = useMemo(() => {
    if (!closureMode) return orders;
    return buildSelectedOrders(orders, selectedCacambaIds);
  }, [orders, selectedCacambaIds, closureMode]);

  const clientTotal = useMemo(
    () => orders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    [orders],
  );
  const selectedTotal = useMemo(
    () => selectedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    [selectedOrders],
  );

  const selectedGroup = useMemo(
    () => closureGroups.find((group) => group._id === selectedGroupId) || null,
    [closureGroups, selectedGroupId],
  );

  const closureGroupsTotal = useMemo(
    () =>
      closureGroups.reduce((groupSum, group) => {
        const groupTotal = (group.cacambaIds || []).reduce((sum, cacamba) => {
          const price = Number(cacamba.price);
          return Number.isFinite(price) ? sum + price : sum;
        }, 0);
        return groupSum + groupTotal;
      }, 0),
    [closureGroups],
  );

  const toggleSelectCacamba = (cacamba: ICacamba, checked: boolean) => {
    setSelectedCacambaIds((current) => {
      if (checked) return Array.from(new Set([...current, cacamba._id]));
      return current.filter((id) => id !== cacamba._id);
    });
  };

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
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        cacambas: (order.cacambas || []).map((cacamba) =>
          cacamba._id === updated._id ? { ...cacamba, ...updated } : cacamba,
        ),
      })),
    );
  };

  const handleDownload = async () => {
    const payloadOrders = closureMode ? selectedOrders : orders;
    if (payloadOrders.length === 0) return;

    await downloadClientOrdersPdf({
      client,
      orders: payloadOrders,
      startDate,
      endDate,
      type,
      clientTotal: closureMode ? selectedTotal : clientTotal,
    });

    if (!closureMode) return;

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

      if (!response.ok) {
        const data = await response.json().catch(() => ({} as Record<string, unknown>));
        throw new Error((data as { message?: string }).message || 'Erro ao agrupar caçambas no fechamento.');
      }

      await onPaymentCompleted?.();
      await fetchOrders();
    } finally {
      setIsSubmittingPayment(false);
    }
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
    await fetchOrders();
  };

  return {
    orders,
    closureGroups,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    invoiceNumber,
    setInvoiceNumber,
    modalImage,
    setModalImage,
    selectedCacambaIds,
    isSubmittingPayment,
    cacambaMetaModal,
    setCacambaMetaModal,
    selectedOrders,
    clientTotal:
      closureMode && (paymentStatus === 'paid' || paymentStatus === 'invoice_pending')
        ? closureGroupsTotal
        : clientTotal,
    selectedTotal,
    fetchOrders,
    toggleSelectCacamba,
    handleUpdateCacambaMeta,
    handleDownload,
    saveInvoiceForGroup,
  };
};
