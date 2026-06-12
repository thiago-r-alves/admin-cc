import React from 'react';
import styled from 'styled-components';
import type { IClient } from '../interfaces';

const ListContainer = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

const ClientCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const ClientInfo = styled.div`
  min-width: 0;
  flex: 1 1 auto;
`;

const ClientName = styled.h3`
  margin: 0 0 0.25rem;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.25;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

const DocumentLine = styled.p`
  margin: 0 0 0.45rem;
  color: #4b5563;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.35;

  strong {
    color: #111827;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 0.28rem;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;

  svg {
    flex: 0 0 auto;
    color: #6b7280;
  }
`;

const AddressItem = styled(MetaItem)`
  max-width: 100%;
`;

const ActionContainer = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;

  @media (max-width: 760px) {
    justify-content: stretch;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button<{ $variant?: 'success' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 38px;
  padding: 0.6rem 0.85rem;
  border: 1px solid ${({ $variant }) => ($variant === 'danger' ? 'transparent' : '#d8b4b4')};
  border-radius: 4px;
  background: ${({ $variant }) =>
    $variant === 'danger' ? '#dc2626' :
    $variant === 'success' ? '#ffffff' :
    '#ffffff'};
  color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#374151')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'danger' ? '#b91c1c' :
      $variant === 'success' ? '#fff1f2' :
      '#fff1f2'};
    border-color: ${({ $variant }) => ($variant === 'danger' ? 'transparent' : '#e30613')};
    color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#e30613')};
  }

  @media (max-width: 760px) {
    flex: 1 1 120px;
  }
`;

const EmptyState = styled.div`
  padding: 1.2rem;
  color: #6b7280;
  background: #fffafa;
`;

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
      <ListContainer>
        <EmptyState>Nenhum cliente encontrado.</EmptyState>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      {clients.map((client) => (
        <ClientCard key={client._id}>
          <ClientInfo>
            <ClientName>{client.clientName}</ClientName>
            <DocumentLine>
              <strong>CNPJ:</strong> {client.cnpjCpf || '-'}
            </DocumentLine>

            <MetaRow>
              <MetaItem>
                <UserIcon />
                {client.contactName || '-'}
              </MetaItem>
              <MetaItem>
                <PhoneIcon />
                {client.contactNumber || '-'}
              </MetaItem>
            </MetaRow>

            <MetaRow>
              <AddressItem>
                <PinIcon />
                {formatAddress(client)}
              </AddressItem>
              <MetaItem>
                <MailIcon />
                CEP {client.cep || '-'}
              </MetaItem>
            </MetaRow>
          </ClientInfo>

          <ActionContainer>
            <ActionButton type="button" onClick={() => onEdit(client)}>
              <EditIcon />
              Editar
            </ActionButton>
            {onViewOrders && (
              <ActionButton type="button" $variant="success" onClick={() => onViewOrders(client)}>
                <ClipboardIcon />
                Pedidos
              </ActionButton>
            )}
            <ActionButton type="button" $variant="danger" onClick={() => onDelete(client._id)}>
              <TrashIcon />
              Excluir
            </ActionButton>
          </ActionContainer>
        </ClientCard>
      ))}
    </ListContainer>
  );
};

export default ClientList;
