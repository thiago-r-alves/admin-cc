import type { ICacamba, IClient } from '../../interfaces';

export interface ClientOrdersModalProps {
  client: IClient;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  closureMode?: boolean;
  paymentStatus?: 'all' | 'pending' | 'paid';
  onPaymentCompleted?: () => Promise<void> | void;
}

export interface CacambaMetaUpdates {
  contentType?: string;
  price?: number;
}

export interface CacambaMetaState {
  mode: 'contentType' | 'price';
  cacamba: ICacamba;
}
