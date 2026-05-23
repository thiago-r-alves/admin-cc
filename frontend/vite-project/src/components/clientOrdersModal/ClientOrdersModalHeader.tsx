import React from 'react';
import styled from 'styled-components';

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.15rem;
  font-weight: 900;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.55rem;
`;

interface ClientOrdersModalHeaderProps {
  clientName: string;
  onClose: () => void;
}

const ClientOrdersModalHeader: React.FC<ClientOrdersModalHeaderProps> = ({ clientName, onClose }) => (
  <ModalHeader>
    <Title>Pedidos de {clientName}</Title>
    <HeaderActions>
      <CloseButton type="button" onClick={onClose} aria-label="Fechar modal">
        x
      </CloseButton>
    </HeaderActions>
  </ModalHeader>
);

export default ClientOrdersModalHeader;
