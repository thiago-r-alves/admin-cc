import type { ReactNode } from 'react';
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

type ClosureModalViewMode = 'create_closure' | 'generated_notes';
type OpeningAction = {
  clientId: string;
  viewMode: ClosureModalViewMode;
} | null;

type ClosureClientListProps = {
  clients: IClient[];
  loading: boolean;
  paymentStatus: ClosurePaymentStatus;
  openingAction?: OpeningAction;
  onOpenCreateClosure: (client: IClient) => void;
  onOpenGeneratedNotes: (client: IClient) => void;
};

const ActionSpinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-brand-border border-t-brand motion-reduce:animate-none"
  />
);

const ActionContent = ({ loading, children }: { loading: boolean; children: ReactNode }) => (
  <>
    {loading ? <ActionSpinner /> : null}
    <span>{children}</span>
  </>
);

export const ClosureClientList = ({
  clients,
  loading,
  paymentStatus,
  openingAction = null,
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
      {clients.map((client) => {
        const isCreateOpening =
          openingAction?.clientId === client._id && openingAction.viewMode === 'create_closure';
        const isGeneratedNotesOpening =
          openingAction?.clientId === client._id && openingAction.viewMode === 'generated_notes';
        const isAnyActionOpening = Boolean(openingAction);

        return (
          <ClientRow key={client._id} data-testid={`closure-client-row-${client._id}`}>
            <ClientInfo>
              <ClientName>{client.clientName}</ClientName>
            </ClientInfo>
            <ActionButtons>
              {(paymentStatus === 'metadata_pending'
                ? client.hasPendingClosureMetadata
                : client.hasPendingClosureItems) && (
                <ClientActionButton
                  type="button"
                  disabled={isAnyActionOpening}
                  aria-busy={isCreateOpening}
                  onClick={() => onOpenCreateClosure(client)}
                >
                  <ActionContent loading={isCreateOpening}>
                    {getClosureActionLabel(paymentStatus)}
                  </ActionContent>
                </ClientActionButton>
              )}
              {client.hasGeneratedClosureGroups && (
                <ClientActionButton
                  type="button"
                  disabled={isAnyActionOpening}
                  aria-busy={isGeneratedNotesOpening}
                  onClick={() => onOpenGeneratedNotes(client)}
                >
                  <ActionContent loading={isGeneratedNotesOpening}>
                    Ver notas geradas
                  </ActionContent>
                </ClientActionButton>
              )}
            </ActionButtons>
          </ClientRow>
        );
      })}
    </ClientsWrap>
  );
};
