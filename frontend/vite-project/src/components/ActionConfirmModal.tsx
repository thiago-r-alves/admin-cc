import React from 'react';
import styled from 'styled-components';

type Variant = 'danger' | 'warning' | 'info';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.62);
`;

const Modal = styled.div`
  width: min(460px, 96vw);
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
`;

const Header = styled.div<{ $variant: Variant }>`
  padding: 1rem 1.15rem;
  border-bottom: 1px solid #fee2e2;
  border-left: 4px solid
    ${({ $variant }) =>
      $variant === 'danger' ? '#dc2626' : $variant === 'warning' ? '#d97706' : '#2563eb'};
`;

const Title = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1.05rem;
  font-weight: 900;
`;

const Body = styled.div`
  padding: 1rem 1.15rem;
  color: #374151;
  font-size: 0.92rem;
  line-height: 1.45;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 0.9rem 1.15rem 1rem;
  border-top: 1px solid #fee2e2;
`;

const Button = styled.button<{ $variant?: Variant }>`
  min-height: 38px;
  min-width: 120px;
  padding: 0.6rem 0.85rem;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'danger' ? '#dc2626' : $variant === 'warning' ? '#d97706' : '#d1d5db'};
  border-radius: 4px;
  background: ${({ $variant }) =>
    $variant === 'danger' ? '#dc2626' : $variant === 'warning' ? '#d97706' : '#ffffff'};
  color: ${({ $variant }) => ($variant ? '#ffffff' : '#374151')};
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export interface ActionConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header $variant={variant}>
          <Title>{title}</Title>
        </Header>
        <Body>{description}</Body>
        <Footer>
          <Button type="button" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" $variant={variant} onClick={() => void onConfirm()} disabled={loading}>
            {loading ? 'Aguarde...' : confirmLabel}
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default ActionConfirmModal;

