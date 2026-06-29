import React from 'react';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ClientOrdersSummaryProps {
  clientTotal: number;
  totalOrders: number;
  totalCacambas: number;
  closureMode: boolean;
  selectedCount: number;
  compactOnlyTotal?: boolean;
  totalLabel?: string;
}

const ClientOrdersSummary: React.FC<ClientOrdersSummaryProps> = ({
  clientTotal,
  totalOrders,
  totalCacambas,
  closureMode,
  selectedCount,
  compactOnlyTotal = false,
  totalLabel = 'Total do cliente (Retiradas)',
}) => (
  <div className="mx-5 rounded-ui-lg border border-red-200 bg-[#fffafa] px-[0.9rem] py-[0.8rem] text-[0.92rem] font-extrabold text-gray-950">
    <div>{totalLabel}: {formatCurrency(clientTotal)}</div>
    {!compactOnlyTotal && (
      <>
        <div>Quantidade total de pedidos: {totalOrders}</div>
        <div>Quantidade total de caçambas: {totalCacambas}</div>
        {closureMode && <div>Caçambas selecionadas: {selectedCount}</div>}
      </>
    )}
  </div>
);

export default ClientOrdersSummary;
