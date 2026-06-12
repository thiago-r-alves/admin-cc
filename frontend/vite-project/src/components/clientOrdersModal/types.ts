import type { ICacamba, IClient } from '../../interfaces';

export interface ClientOrdersModalProps {
  client: IClient;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  closureMode?: boolean;
  viewMode?: 'create_closure' | 'generated_notes';
  paymentStatus?: 'all' | 'pending' | 'invoice_pending' | 'paid' | 'metadata_pending';
  onClosureStateChanged?: () => Promise<void> | void;
}

export interface CacambaMetaUpdates {
  contentType?: string;
  price?: number;
}

export interface CacambaMetaState {
  mode: 'contentType' | 'price';
  cacamba: ICacamba;
}
