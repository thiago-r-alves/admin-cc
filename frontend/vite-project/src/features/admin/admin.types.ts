import type { ICacamba, OrderType } from '../../interfaces';

export type AdminTab =
  | 'pedidos'
  | 'retiradas'
  | 'acompanhamentos'
  | 'clientes'
  | 'fechamento'
  | 'faturamento'
  | 'motoristas';

export type SidebarIconName = AdminTab | 'sair' | 'menu';

export type FeedbackState = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

export type ConfirmState = {
  title: string;
  description: string;
  variant: 'danger' | 'warning' | 'info';
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
} | null;

export type AdminCacambaMetaModalState = {
  mode: 'contentType' | 'price';
  cacamba: ICacamba;
} | null;

export type AdminEditingCacambaState = {
  cacamba: ICacamba;
  orderType: OrderType;
  onUpdated?: () => Promise<void> | void;
} | null;
