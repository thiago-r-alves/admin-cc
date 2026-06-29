import React from 'react';
import { cn } from '../../utils/cn';

interface ClientOrdersFooterProps {
  onDownload: () => Promise<void>;
  disabled: boolean;
  isSubmittingPayment: boolean;
  closureMode: boolean;
  actionLabel?: string;
  className?: string;
}

const ClientOrdersFooter: React.FC<ClientOrdersFooterProps> = ({
  onDownload,
  disabled,
  isSubmittingPayment,
  closureMode,
  actionLabel,
  className,
}) => (
  <div className={cn('flex justify-end gap-[0.6rem] bg-white', className ?? 'border-t border-red-100 px-5 pb-4 pt-[0.9rem]')}>
    <button
      data-testid="client-orders-download"
      type="button"
      onClick={onDownload}
      disabled={disabled}
      className="min-h-11 w-full cursor-pointer rounded-ui-lg border border-brand bg-brand px-4 py-[0.72rem] text-[0.82rem] font-black uppercase text-white shadow-[0_8px_18px_rgba(227,6,19,0.22)] transition-[background-color,box-shadow,transform] duration-200 hover:enabled:-translate-y-px hover:enabled:bg-brand-hover hover:enabled:shadow-[0_10px_22px_rgba(201,0,11,0.3)] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:transform-none"
    >
      {isSubmittingPayment
        ? 'Processando...'
        : actionLabel
          ? actionLabel
          : closureMode
          ? 'Baixar nota com caçambas selecionada'
          : 'Baixar'}
    </button>
  </div>
);

export default ClientOrdersFooter;
