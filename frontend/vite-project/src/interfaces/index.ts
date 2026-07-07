// src/interfaces/index.ts

export interface IClient {
  _id: string;
  clientName: string;
  cnpjCpf?: string;
  email?: string;
  rgInscricaoEstadual?: string;
  contactName?: string;
  contactNumber?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  cep?: string;
  createdAt?: string; // Adicionar este campo
  hasPendingClosureItems?: boolean;
  hasGeneratedClosureGroups?: boolean;
  hasPendingClosureMetadata?: boolean;
  pendingClosureCount?: number;
  generatedClosureGroupsCount?: number;
  pendingClosureMetadataCount?: number;
  pendingClosureMissingPriceCount?: number;
  pendingClosureMissingContentTypeCount?: number;
}

export interface ICity {
  _id: string;
  name: string;
  createdAt?: string;
}

export interface IDriver {
  _id: string;
  username: string;
}

export type DriverRef = string | Pick<IDriver, '_id' | 'username'>;

export const CACAMBA_CONTENT_TYPES = [
  'Entulho limpo',
  'Entulho misto',
  'Entulho com madeira',
  'Terra',
  'Madeira limpa',
  'Madeira mista',
  'Madeira MDF',
  'Lixo diversos',
  'Gesso',
  'Gesso acartonado',
  'PMTFGP',
  'Sucatas',
  'Residuos contaminados',
] as const;

export type CacambaContentType = typeof CACAMBA_CONTENT_TYPES[number];

export interface IClosureActionMetadata {
  date?: string;
  driverName?: string;
  placa?: string;
  orderNumber?: number | null;
}

export interface ICacamba {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  paymentStatus?: 'pendente' | 'nota_fiscal_pendente' | 'pix_pendente' | 'paga';
  closureGroupId?: string;
  contentType?: CacambaContentType;
  price?: number;
  local?: string;
  orderId: string;
  imageUrl?: string;
  createdAt: string; // Remover o '?' para tornar obrigatório
  horaServicoDigitos?: string;
  closureDelivery?: IClosureActionMetadata | null;
  closureWithdrawal?: IClosureActionMetadata | null;
}

export interface ICacambaTrackEvent {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  paymentStatus?: ICacamba['paymentStatus'];
  closureGroupId?: string;
  contentType?: CacambaContentType;
  price?: number;
  local?: string;
  imageUrl?: string;
  createdAt: string;
  horaServicoDigitos?: string;
  order: {
    _id: string;
    orderNumber: number | null;
    clientId?: string;
    clientName: string;
    cnpjCpf?: string;
    contactName?: string;
    contactNumber?: string;
    neighborhood?: string;
    address?: string;
    addressNumber?: string;
    city?: string;
    cep?: string;
    type: OrderType;
    status: IOrder['status'];
    motorista?: DriverRef;
    placa?: string;
  } | null;
}

export interface ICacambaTrackResponse {
  numero: string;
  total: number;
  currentStatus: 'em_obra' | 'retirada' | null;
  firstRegisteredAt: string | null;
  lastRegisteredAt: string | null;
  events: ICacambaTrackEvent[];
}

export interface IClosureGroup {
  _id: string;
  clientId: string;
  clientSequenceNumber: number;
  status: 'nota_fiscal_pendente' | 'pix_pendente' | 'paga';
  paymentMethod?: 'invoice' | 'pix';
  invoiceNumber?: string;
  totalAmount?: number;
  pixCopyPaste?: string;
  pixTxid?: string;
  pixInfo?: string;
  startDate: string;
  endDate: string;
  cacambaIds: ICacamba[];
  createdAt?: string;
  updatedAt?: string;
}

export type OrderType = 'entrega' | 'retirada';
export type BillingGranularity = 'monthly' | 'semiannual' | 'annual';

export interface IOrder {
  _id: string;
  orderNumber: number | null;
  clientId?: string;
  clientName: string;
  cnpjCpf?: string;
  city?: string;
  cep?: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: OrderType;
  priority: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: DriverRef;
  imageUrls?: string[];
  cacambas?: ICacamba[];
  createdAt?: string;
  updatedAt?: string; // adicionado para evitar erro no orderPdf e modais
  placa?: string; // Adicione este campo
  cacambaPrice?: number;
  plannedWithdrawalCacambaIds?: string[];
}

export interface IBillingSummaryResponse {
  summary: {
    totalRevenue: number;
    totalCacambas: number;
    averageTicket: number;
    activeClients: number;
    previousPeriodRevenue: number;
    revenueDeltaPercent: number;
  };
  timeseries: Array<{
    label: string;
    start: string;
    end: string;
    revenue: number;
    count: number;
  }>;
  topClients: Array<{
    clientId: string;
    clientName: string;
    revenue: number;
    cacambaCount: number;
    averageTicket: number;
  }>;
  topCities: Array<{
    city: string;
    revenue: number;
    cacambaCount: number;
  }>;
  topContentTypes: Array<{
    contentType: string;
    revenue: number;
    cacambaCount: number;
  }>;
  highlights: {
    topClientName: string;
    topClientRevenue: number;
    bestBucketLabel: string;
    bestBucketRevenue: number;
  };
}
