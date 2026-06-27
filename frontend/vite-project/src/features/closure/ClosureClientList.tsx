import type { IClient } from '../../interfaces';
import { getClosureActionLabel } from './closure.helpers';
import type { ClosurePaymentStatus } from './closure.types';
import {
  ActionButtons,
  ClientActionButton,
  ClientInfo,
  ClientName,
  ClientRow,
  ClientsWrap,
  EmptyState,
} from './closure.styles';

type ClosureClientListProps = {
  clients: IClient[];
  loading: boolean;
  paymentStatus: ClosurePaymentStatus;
  onOpenCreateClosure: (client: IClient) => void;
  onOpenGeneratedNotes: (client: IClient) => void;
};

export const ClosureClientList = ({
  clients,
  loading,
  paymentStatus,
  onOpenCreateClosure,
  onOpenGeneratedNotes,
}: ClosureClientListProps) => {
  if (loading) {
    return <EmptyState>Carregando clientes para fechamento...</EmptyState>;
  }

  if (!clients.length) {
    return (
      <EmptyState>
        Nenhum cliente com retirada concluida encontrado para os filtros selecionados.
      </EmptyState>
    );
  }

  return (
    <ClientsWrap>
      {clients.map((client) => (
        <ClientRow key={client._id} data-testid={`closure-client-row-${client._id}`}>
          <ClientInfo>
            <ClientName>{client.clientName}</ClientName>
          </ClientInfo>
          <ActionButtons>
            {(paymentStatus === 'metadata_pending'
              ? client.hasPendingClosureMetadata
              : client.hasPendingClosureItems) && (
              <ClientActionButton type="button" onClick={() => onOpenCreateClosure(client)}>
                {getClosureActionLabel(paymentStatus)}
              </ClientActionButton>
            )}
            {client.hasGeneratedClosureGroups && (
              <ClientActionButton type="button" onClick={() => onOpenGeneratedNotes(client)}>
                Ver notas geradas
              </ClientActionButton>
            )}
          </ActionButtons>
        </ClientRow>
      ))}
    </ClientsWrap>
  );
};
