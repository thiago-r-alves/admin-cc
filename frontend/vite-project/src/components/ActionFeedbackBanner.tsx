import React from 'react';
import styled from 'styled-components';

type Tone = 'success' | 'error' | 'info';

const Banner = styled.div<{ $tone: Tone }>`
  margin: 0 0 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: 6px;
  border: 1px solid
    ${({ $tone }) => ($tone === 'success' ? '#86efac' : $tone === 'error' ? '#fecaca' : '#bfdbfe')};
  background: ${({ $tone }) => ($tone === 'success' ? '#f0fdf4' : $tone === 'error' ? '#fff1f2' : '#eff6ff')};
  color: ${({ $tone }) => ($tone === 'success' ? '#166534' : $tone === 'error' ? '#b91c1c' : '#1d4ed8')};
  font-size: 0.88rem;
  font-weight: 800;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Close = styled.button`
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
`;

export interface ActionFeedbackBannerProps {
  message?: string | null;
  tone?: Tone;
  onClose?: () => void;
}

const ActionFeedbackBanner: React.FC<ActionFeedbackBannerProps> = ({ message, tone = 'info', onClose }) => {
  if (!message) return null;
  return (
    <Banner $tone={tone} role="status" aria-live="polite">
      <Row>
        <span>{message}</span>
        {onClose && (
          <Close type="button" onClick={onClose} aria-label="Fechar mensagem">
            ×
          </Close>
        )}
      </Row>
    </Banner>
  );
};

export default ActionFeedbackBanner;

