import React from 'react';

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
  <div className="flex justify-end gap-[0.6rem] border-t border-red-100 bg-white px-5 pb-4 pt-[0.9rem]">
    <button
      data-testid="client-orders-download"
      type="button"
      onClick={onDownload}
      disabled={disabled}
      className="min-h-10 cursor-pointer rounded-lg border border-brand bg-brand px-4 py-[0.58rem] text-[0.8rem] font-black uppercase text-white shadow-[0_8px_18px_rgba(227,6,19,0.24)] transition-[background-color,box-shadow,transform] duration-200 hover:enabled:-translate-y-px hover:enabled:bg-brand-hover hover:enabled:shadow-[0_10px_22px_rgba(201,0,11,0.32)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:transform-none"
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
