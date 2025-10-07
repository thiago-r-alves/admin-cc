import React from 'react';
import styled from 'styled-components';
import type { IClient } from '../interfaces';

// --- Styled Components ---

// O container principal da lista
const ListContainer = styled.div`
  width: 100%;
`;

// O cabeçalho que só aparece no desktop
const ListHeader = styled.div`
  display: none; // Escondido por padrão
  
  @media (min-width: 769px) {
    display: flex;
    padding: 0 1.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #4a5568;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.5rem;
  }
`;

// O card individual para cada cliente
const ClientCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column; // Layout de coluna para mobile
  gap: 0.75rem;

  @media (min-width: 769px) {
    flex-direction: row; // Layout de linha para desktop
    align-items: center;
    padding: 1rem 1.5rem;
    gap: 1rem;
  }
`;

// Seção de informações dentro do card/linha
const InfoSection = styled.div`
  flex: 1; // Ocupa o espaço disponível
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 769px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
`;

// Cada item de dado (Nome, Contato, etc.)
const DataItem = styled.div`
  display: flex;
  justify-content: space-between; // Label de um lado, valor do outro
  
  @media (min-width: 769px) {
    display: block; // Comportamento normal em desktop
    flex: 1; // Distribui o espaço igualmente
  }
`;

// O label que aparece no mobile ("Nome:", "Contato:")
const DataLabel = styled.span`
  font-weight: 600;
  color: #4a5568;

  @media (min-width: 769px) {
    display: none; // Esconde o label no desktop
  }
`;

const DataValue = styled.span`
  color: #1a202c;
  text-align: right;

  @media (min-width: 769px) {
    text-align: left;
  }
`;

// Container para os botões de ação
const ActionContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid #edf2f7;
  padding-top: 1rem;

  @media (min-width: 769px) {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
    flex-basis: 240px; // Largura fixa para a coluna de ações
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button<{ color?: string }>`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background-color: ${({ color }) => color || '#3b82f6'};
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

// --- Props ---

interface ClientListProps {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onDelete: (id: string) => void;
  onViewOrders: (client: IClient) => void;
}

// --- Componente ---

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete, onViewOrders }) => {
  return (
    <ListContainer>
      {/* Cabeçalho visível apenas no desktop */}
      <ListHeader>
        <DataItem style={{ flex: 1.5 }}>Nome</DataItem>
        <DataItem style={{ flex: 1.5 }}>Contato</DataItem>
        <DataItem style={{ flex: 2 }}>Endereço</DataItem>
        <DataItem style={{ flex: 1.5 }}>Data de Criação</DataItem>
        <div style={{ flexBasis: '240px', textAlign: 'right' }}>Ações</div>
      </ListHeader>

      {/* Lista de cards de cliente */}
      {clients.map((client) => (
        <ClientCard key={client._id}>
          <InfoSection>
            <DataItem style={{ flex: 1.5 }}>
              <DataLabel>Nome:</DataLabel>
              <DataValue>{client.clientName}</DataValue>
            </DataItem>
            <DataItem style={{ flex: 1.5 }}>
              <DataLabel>Contato:</DataLabel>
              <DataValue>{client.contactName} ({client.contactNumber})</DataValue>
            </DataItem>
            <DataItem style={{ flex: 2 }}>
              <DataLabel>Endereço:</DataLabel>
              <DataValue>{`${client.address}, ${client.addressNumber} - ${client.neighborhood} - ${client.city}`}</DataValue>
            </DataItem>
            <DataItem style={{ flex: 1.5 }}>
              <DataLabel>Data de Criação:</DataLabel>
              <DataValue>
                {client.createdAt 
                  ? new Date(client.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })
                  : 'N/A'
                }
              </DataValue>
            </DataItem>
          </InfoSection>

          <ActionContainer>
            <ActionButton onClick={() => onEdit(client)}>Editar</ActionButton>
            <ActionButton onClick={() => onViewOrders(client)} style={{ background: '#10b981' }}>Pedidos</ActionButton>
            <ActionButton onClick={() => onDelete(client._id)} color="#ef4444">Excluir</ActionButton>
          </ActionContainer>
        </ClientCard>
      ))}
    </ListContainer>
  );
};

export default ClientList;
