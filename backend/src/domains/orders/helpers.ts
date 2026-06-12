import type { ObjectId } from 'mongodb';

export const ORDER_CLIENT_SNAPSHOT_FIELDS = [
  'clientId',
  'clientName',
  'cnpjCpf',
  'contactName',
  'contactNumber',
  'neighborhood',
  'address',
  'addressNumber',
  'city',
  'cep',
] as const;

export const orderTypes = ['entrega', 'retirada'] as const;

export const isOrderType = (value: unknown): value is (typeof orderTypes)[number] =>
  orderTypes.includes(value as (typeof orderTypes)[number]);

export const buildOrderClientSnapshot = (client: {
  _id: unknown;
  clientName?: string;
  cnpjCpf?: string;
  contactName?: string;
  contactNumber?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  cep?: string;
}) => ({
  clientId: client._id as string | ObjectId,
  clientName: String(client.clientName || '').trim(),
  cnpjCpf: String(client.cnpjCpf || '').trim(),
  contactName: String(client.contactName || '').trim(),
  contactNumber: String(client.contactNumber || '').trim(),
  neighborhood: String(client.neighborhood || '').trim(),
  address: String(client.address || '').trim(),
  addressNumber: String(client.addressNumber || '').trim(),
  city: String(client.city || '').trim(),
  cep: String(client.cep || '').trim(),
});
