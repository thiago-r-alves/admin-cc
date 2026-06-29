import type { ICacamba, IOrder } from '../../interfaces';

export const hasValidPrice = (cacamba: ICacamba) =>
  typeof cacamba.price === 'number' && Number.isFinite(cacamba.price) && cacamba.price >= 0;

export const hasValidContentType = (cacamba: ICacamba) =>
  typeof cacamba.contentType === 'string' && cacamba.contentType.trim().length > 0;

export const isPendingClosurePayment = (cacamba: ICacamba) =>
  (cacamba.paymentStatus || 'pendente') === 'pendente';

export const hasPendingClosureMetadata = (cacamba: ICacamba) =>
  isPendingClosurePayment(cacamba) &&
  (cacamba.tipo === 'entrega' || cacamba.tipo === 'retirada') &&
  (!hasValidPrice(cacamba) || (cacamba.tipo === 'retirada' && !hasValidContentType(cacamba)));

export const isEligibleForClosureSelection = (cacamba: ICacamba) =>
  isPendingClosurePayment(cacamba) &&
  hasValidPrice(cacamba) &&
  (cacamba.tipo === 'entrega' || (cacamba.tipo === 'retirada' && hasValidContentType(cacamba)));

export const getWithdrawalOrderTotal = (order: IOrder) =>
  (order.cacambas || [])
    .filter((cacamba) => cacamba.tipo === 'retirada' && hasValidPrice(cacamba))
    .reduce((sum, cacamba) => sum + Number(cacamba.price), 0);

export const getClosureOrderTotal = (order: IOrder) =>
  (order.cacambas || [])
    .filter((cacamba) => (cacamba.tipo === 'entrega' || cacamba.tipo === 'retirada') && hasValidPrice(cacamba))
    .reduce((sum, cacamba) => sum + Number(cacamba.price), 0);

export const buildSelectedOrders = (orders: IOrder[], selectedCacambaIds: string[]) =>
  orders
    .map((order) => ({
      ...order,
      cacambas: (order.cacambas || []).filter(
        (cacamba) =>
          selectedCacambaIds.includes(cacamba._id) &&
          isEligibleForClosureSelection(cacamba),
      ),
    }))
    .filter((order) => (order.cacambas?.length || 0) > 0);
