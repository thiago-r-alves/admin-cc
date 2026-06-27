import React from 'react';

interface ClientOrdersModalHeaderProps {
  clientName: string;
  onClose: () => void;
}

const ClientOrdersModalHeader: React.FC<ClientOrdersModalHeaderProps> = ({ clientName, onClose }) => (
  <div className="flex items-center justify-between gap-4 border-b border-red-100 px-5 py-4">
    <h2 className="m-0 text-[1.15rem] font-black text-gray-950">Pedidos de {clientName}</h2>
    <div className="flex items-center gap-[0.55rem]">
      <button type="button" onClick={onClose} aria-label="Fechar modal" className="h-[34px] w-[34px] cursor-pointer rounded-ui-lg border-0 bg-transparent text-[1.55rem] text-gray-500">
        x
      </button>
    </div>
  </div>
);

export default ClientOrdersModalHeader;
