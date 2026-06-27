import React, { useEffect } from 'react';
import { cn } from '../utils/cn';

type ToastTone = 'success' | 'error' | 'info';

const toneClasses: Record<ToastTone, string> = {
  success: 'border-green-300 bg-green-50 text-green-700',
  error: 'border-red-300 bg-brand-soft text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-700',
};

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
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed right-[max(16px,env(safe-area-inset-right))] top-[max(16px,env(safe-area-inset-top))] z-[2200] w-[min(420px,calc(100vw-32px))] rounded-[14px] border px-4 py-[0.9rem] text-[0.9rem] font-black leading-[1.35] shadow-[0_18px_45px_rgba(15,23,42,0.18)] [animation:app-toast-in_220ms_ease-out]',
        toneClasses[tone],
      )}
    >
      {message}
    </div>
  );
};

export default ToastPopup;
