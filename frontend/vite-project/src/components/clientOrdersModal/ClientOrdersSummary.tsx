import React from 'react';
import { cn } from '../../utils/cn';

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
  className?: string;
  stacked?: boolean;
}

const ClientOrdersSummary: React.FC<ClientOrdersSummaryProps> = ({
  clientTotal,
  totalOrders,
  totalCacambas,
  closureMode,
  selectedCount,
  compactOnlyTotal = false,
  totalLabel = 'Total do cliente (Retiradas)',
  className,
  stacked = false,
}) => (
  <div className={cn('grid gap-2 text-[0.88rem] font-extrabold text-gray-950', className)}>
    <div className="rounded-ui-lg border border-gray-200 bg-white px-3 py-2">
      {totalLabel}: <span className="text-brand">{formatCurrency(clientTotal)}</span>
    </div>
    {!compactOnlyTotal && (
      <div className={cn('grid gap-2', stacked ? 'grid-cols-1' : 'grid-cols-3 max-[720px]:grid-cols-1')}>
        <div className="rounded-ui-lg border border-gray-200 bg-white px-3 py-2">
          Quantidade total de pedidos: {totalOrders}
        </div>
        <div className="rounded-ui-lg border border-gray-200 bg-white px-3 py-2">
          Quantidade total de caçambas: {totalCacambas}
        </div>
        {closureMode && (
          <div className="rounded-ui-lg border border-brand-border bg-brand-soft px-3 py-2 text-brand">
            Caçambas selecionadas: {selectedCount}
          </div>
        )}
      </div>
    )}
  </div>
);

export default ClientOrdersSummary;
