// src/interfaces/index.ts

export interface IClient {
  _id: string;
  clientName: string;
  cnpjCpf?: string;
  contactName?: string;
  contactNumber?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  cep?: string;
  createdAt?: string; // Adicionar este campo
}

export interface IDriver {
  _id: string;
  username: string;
}

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

export interface ICacamba {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  contentType?: CacambaContentType;
  price?: number;
  local?: string;
  orderId: string;
  imageUrl?: string;
  createdAt: string; // Remover o '?' para tornar obrigatório
  horaServicoDigitos?: string;
}

export type OrderType = 'entrega' | 'retirada';

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
  motorista?: any;
  imageUrls?: string[];
  cacambas?: ICacamba[];
  createdAt?: string;
  updatedAt?: string; // adicionado para evitar erro no orderPdf e modais
  placa?: string; // Adicione este campo
}
