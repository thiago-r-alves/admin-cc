import React from 'react';
import { cn } from '../utils/cn';

type Tone = 'success' | 'error' | 'info';

const toneClasses: Record<Tone, string> = {
  success: 'border-green-300 bg-green-50 text-green-700',
  error: 'border-red-200 bg-brand-soft text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export interface ActionFeedbackBannerProps {
  message?: string | null;
  tone?: Tone;
  onClose?: () => void;
}

const ActionFeedbackBanner: React.FC<ActionFeedbackBannerProps> = ({ message, tone = 'info', onClose }) => {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('mb-4 rounded-ui-lg border px-[0.85rem] py-[0.7rem] text-[0.88rem] font-extrabold', toneClasses[tone])}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar mensagem" className="cursor-pointer border-0 bg-transparent text-base leading-none text-inherit">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionFeedbackBanner;
