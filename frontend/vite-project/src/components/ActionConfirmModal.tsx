import React from 'react';
import { cn } from '../utils/cn';

type Variant = 'danger' | 'warning' | 'info';

const accentClasses: Record<Variant, string> = {
  danger: 'border-l-red-600',
  warning: 'border-l-gray-700',
  info: 'border-l-gray-700',
};

const confirmClasses: Record<Variant, string> = {
  danger: 'border-red-600 bg-red-600 text-white',
  warning: 'border-gray-700 bg-gray-700 text-white',
  info: 'border-gray-700 bg-gray-700 text-white',
};

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
  const titleId = React.useId();
  const descriptionId = React.useId();

  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[1300] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
        className="w-[min(460px,96vw)] rounded-lg border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        <div className={cn('border-b border-l-4 border-b-red-100 px-[1.15rem] py-4', accentClasses[variant])}>
          <h3 id={titleId} className="m-0 text-[1.05rem] font-black text-gray-950">
            {title}
          </h3>
        </div>
        <div id={descriptionId} className="px-[1.15rem] py-4 text-[0.92rem] leading-[1.45] text-gray-700">
          {description}
        </div>
        <div className="flex justify-end gap-[0.65rem] border-t border-red-100 px-[1.15rem] pb-4 pt-[0.9rem]">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-[38px] min-w-[120px] cursor-pointer rounded-ui-md border border-gray-300 bg-white px-[0.85rem] py-[0.6rem] text-[0.8rem] font-black uppercase text-gray-700 disabled:cursor-not-allowed disabled:opacity-60">
            {cancelLabel}
          </button>
          <button type="button" className={cn('min-h-[38px] min-w-[120px] cursor-pointer rounded-ui-md border px-[0.85rem] py-[0.6rem] text-[0.8rem] font-black uppercase disabled:cursor-not-allowed disabled:opacity-60', confirmClasses[variant])} onClick={() => void onConfirm()} disabled={loading}>
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmModal;
