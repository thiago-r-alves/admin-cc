import type { ICacamba, IOrder } from '../../interfaces';

export const hasValidPrice = (cacamba: ICacamba) =>
  typeof cacamba.price === 'number' && Number.isFinite(cacamba.price);

export const hasValidContentType = (cacamba: ICacamba) =>
  typeof cacamba.contentType === 'string' && cacamba.contentType.trim().length > 0;

export const isEligibleForClosureSelection = (cacamba: ICacamba) =>
  cacamba.tipo === 'retirada' &&
  cacamba.paymentStatus !== 'paga' &&
  hasValidPrice(cacamba) &&
  hasValidContentType(cacamba);

export const getOrderTotal = (order: IOrder) =>
  (order.cacambas || [])
    .filter((cacamba) => cacamba.tipo === 'retirada' && hasValidPrice(cacamba))
    .reduce((sum, cacamba) => sum + Number(cacamba.price), 0);

export const buildSelectedOrders = (orders: IOrder[], selectedCacambaIds: string[]) =>
  orders
    .map((order) => ({
      ...order,
      cacambas: (order.cacambas || []).filter(
        (cacamba) =>
          selectedCacambaIds.includes(cacamba._id) &&
          hasValidPrice(cacamba) &&
          hasValidContentType(cacamba),
      ),
    }))
    .filter((order) => (order.cacambas?.length || 0) > 0);
