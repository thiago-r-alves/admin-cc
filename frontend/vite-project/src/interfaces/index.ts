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

export interface ICacamba {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  imageUrl: string;
  orderId: string;
  local: 'via_publica' | 'canteiro_obra'; // <-- Adicione aqui
  createdAt: string;
}

export type OrderType = 'entrega' | 'retirada' | 'troca';

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
  type: 'entrega' | 'retirada' | 'troca';
  priority: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: any;
  imageUrls?: string[];
  cacambas?: ICacamba[];
  createdAt?: string;
  updatedAt?: string; // adicionado para evitar erro no orderPdf e modais
}