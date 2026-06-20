import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

type ToastTone = 'success' | 'error' | 'info';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, -14px, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const ToastWrap = styled.div<{ $tone: ToastTone }>`
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  z-index: 2200;
  width: min(420px, calc(100vw - 32px));
  padding: 0.9rem 1rem;
  border: 1px solid
    ${({ $tone }) => ($tone === 'success' ? '#86efac' : $tone === 'error' ? '#fca5a5' : '#93c5fd')};
  border-radius: 14px;
  background: ${({ $tone }) => ($tone === 'success' ? '#f0fdf4' : $tone === 'error' ? '#fff1f2' : '#eff6ff')};
  color: ${({ $tone }) => ($tone === 'success' ? '#166534' : $tone === 'error' ? '#991b1b' : '#1d4ed8')};
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1.35;
  animation: ${slideIn} 220ms ease-out;
`;

export interface ToastPopupProps {
  message?: string | null;
  tone?: ToastTone;
  durationMs?: number;
  onClose: () => void;
}

const ToastPopup: React.FC<ToastPopupProps> = ({
  message,
  tone = 'info',
  durationMs = 3600,
  onClose,
}) => {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timeout);
  }, [durationMs, message, onClose]);

  if (!message) return null;

  return (
    <ToastWrap $tone={tone} role="status" aria-live="polite">
      {message}
    </ToastWrap>
  );
};

export default ToastPopup;
