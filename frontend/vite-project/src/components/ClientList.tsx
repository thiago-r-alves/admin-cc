import React from 'react';
import type { IClient } from '../interfaces';
import { cn } from '../utils/cn';

const metaItemClass = 'inline-flex min-w-0 items-center gap-[0.42rem] text-[0.82rem] font-bold leading-[1.35] text-gray-500 [overflow-wrap:anywhere] [&_svg]:flex-none [&_svg]:text-gray-500';
const actionButtonClass =
  'inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-[0.42rem] rounded-ui-md px-[0.85rem] py-[0.6rem] text-[0.78rem] font-black uppercase transition-[background,border-color,color] duration-[180ms] max-[760px]:flex-[1_1_120px]';

interface ClientListProps {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onDelete: (id: string) => void;
  onViewOrders?: (client: IClient) => void;
}

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 8.5 12 14l8-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 3h8l1 2h3v16H4V5h3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const formatAddress = (client: IClient) => {
  const street = [client.address, client.addressNumber].filter(Boolean).join(', ');
  const parts = [street, client.neighborhood, client.city].filter(Boolean);
  return parts.join(' - ') || '-';
};

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete, onViewOrders }) => {
  if (!clients.length) {
    return (
      <div className="w-full overflow-hidden rounded-ui-lg border border-red-200 bg-white">
        <div className="bg-[#fffafa] p-[1.2rem] text-gray-500">Nenhum cliente encontrado.</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-ui-lg border border-red-200 bg-white">
      {clients.map((client) => (
        <div key={client._id} className="flex items-center justify-between gap-5 border-b border-red-100 bg-white px-5 py-4 last:border-b-0 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-4 max-[760px]:p-4">
          <div className="min-w-0 flex-auto">
            <h3 className="m-0 mb-1 text-base font-black uppercase leading-tight text-gray-800 [overflow-wrap:anywhere]">{client.clientName}</h3>
            <p className="m-0 mb-[0.45rem] text-[0.78rem] font-extrabold leading-[1.35] text-gray-600 [&_strong]:text-gray-950">
              <strong>CNPJ:</strong> {client.cnpjCpf || '-'}
            </p>
            <p className="m-0 mb-[0.45rem] text-[0.78rem] font-extrabold leading-[1.35] text-gray-600 [&_strong]:text-gray-950">
              <strong>RG/IE:</strong> {client.rgInscricaoEstadual || '-'}
            </p>

            <div className="mt-[0.28rem] flex flex-wrap items-center gap-5">
              <span className={metaItemClass}>
                <UserIcon />
                {client.contactName || '-'}
              </span>
              <span className={metaItemClass}>
                <PhoneIcon />
                {client.contactNumber || '-'}
              </span>
              <span className={metaItemClass}>
                <MailIcon />
                {client.email || '-'}
              </span>
            </div>

            <div className="mt-[0.28rem] flex flex-wrap items-center gap-5">
              <span className={cn(metaItemClass, 'max-w-full')}>
                <PinIcon />
                {formatAddress(client)}
              </span>
              <span className={metaItemClass}>
                <MailIcon />
                CEP {client.cep || '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-none items-center justify-end gap-[0.6rem] max-[760px]:flex-wrap max-[760px]:justify-stretch">
            <button type="button" onClick={() => onEdit(client)} className={cn(actionButtonClass, 'border border-brand-border bg-white text-gray-700 hover:border-brand hover:bg-brand-soft hover:text-brand')}>
              <EditIcon />
              Editar
            </button>
            {onViewOrders && (
              <button type="button" onClick={() => onViewOrders(client)} className={cn(actionButtonClass, 'border border-brand-border bg-white text-gray-700 hover:border-brand hover:bg-brand-soft hover:text-brand')}>
                <ClipboardIcon />
                Pedidos
              </button>
            )}
            <button type="button" onClick={() => onDelete(client._id)} className={cn(actionButtonClass, 'border border-transparent bg-red-600 text-white hover:bg-red-800')}>
              <TrashIcon />
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientList;
