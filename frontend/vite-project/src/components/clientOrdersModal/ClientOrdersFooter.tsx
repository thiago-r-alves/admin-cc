import React from 'react';
import styled from 'styled-components';

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.9rem 1.25rem 1rem;
  border-top: 1px solid #fee2e2;
  background: #ffffff;
`;

const DownloadButton = styled.button`
  min-height: 40px;
  padding: 0.58rem 1rem;
  border: 1px solid #e30613;
  border-radius: 8px;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(227, 6, 19, 0.24);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;

  &:hover:enabled {
    background: #c9000b;
    box-shadow: 0 10px 22px rgba(201, 0, 11, 0.32);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

interface ClientOrdersFooterProps {
  onDownload: () => Promise<void>;
  disabled: boolean;
  isSubmittingPayment: boolean;
  closureMode: boolean;
  actionLabel?: string;
}

const ClientOrdersFooter: React.FC<ClientOrdersFooterProps> = ({
  onDownload,
  disabled,
  isSubmittingPayment,
  closureMode,
  actionLabel,
}) => (
  <ModalFooter>
    <DownloadButton
      data-testid="client-orders-download"
      type="button"
      onClick={onDownload}
      disabled={disabled}
    >
      {isSubmittingPayment
        ? 'Processando...'
        : actionLabel
          ? actionLabel
          : closureMode
          ? 'Baixar nota com caçambas selecionada'
          : 'Baixar'}
    </DownloadButton>
  </ModalFooter>
);

export default ClientOrdersFooter;
