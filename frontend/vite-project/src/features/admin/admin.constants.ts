import type { IOrder } from '../../interfaces';
import type { AdminTab } from './admin.types';

export const ADMIN_PAGE_SIZE = 10;
export const SHOW_ORDER_DOWNLOAD_BUTTON = false;

export const sidebarItems: Array<{ key: AdminTab; label: string }> = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'retiradas', label: 'Retiradas pendentes' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'fechamento', label: 'Fechamento' },
  { key: 'faturamento', label: 'Faturamento' },
  { key: 'acompanhamentos', label: 'Acompanhamentos' },
  { key: 'motoristas', label: 'Motoristas' },
];

export const typeLabels: Record<IOrder['type'], string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};
