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
}

const ClientOrdersSummary: React.FC<ClientOrdersSummaryProps> = ({
  clientTotal,
  totalOrders,
  totalCacambas,
  closureMode,
  selectedCount,
  compactOnlyTotal = false,
}) => (
  <div className="mx-5 rounded-ui-lg border border-red-200 bg-[#fffafa] px-[0.9rem] py-[0.8rem] text-[0.92rem] font-extrabold text-gray-950">
    <div>Total do cliente (Retiradas): {formatCurrency(clientTotal)}</div>
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
