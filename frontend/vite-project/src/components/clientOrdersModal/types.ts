import type { ICacamba, IClient } from '../../interfaces';

export type ClientOrdersHistoryType = 'all' | 'entrega' | 'retirada';
export type ClientOrdersHistoryStatus = 'all' | 'pendente' | 'em_andamento' | 'concluido';
export type ClientOrdersHistoryLocal = 'all' | 'via_publica' | 'canteiro_obra';

export interface ClientOrdersHistoryFilters {
  type: ClientOrdersHistoryType;
  startDate?: string;
  endDate?: string;
  status: ClientOrdersHistoryStatus;
  local: ClientOrdersHistoryLocal;
  q?: string;
}

export interface ClientOrdersModalProps {
  client: IClient;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  initialType?: ClientOrdersHistoryType;
  closureMode?: boolean;
  viewMode?: 'create_closure' | 'generated_notes';
  paymentStatus?: 'all' | 'pending' | 'invoice_pending' | 'pix_pending' | 'paid' | 'metadata_pending';
  onClosureStateChanged?: () => Promise<void> | void;
  onInitialContentReady?: () => void;
}

export interface CacambaMetaUpdates {
  contentType?: string;
  price?: number;
}

export interface CacambaMetaState {
  mode: 'contentType' | 'price';
  cacamba: ICacamba;
}
