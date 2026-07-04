import React from 'react';
import type { ICacamba, IOrder, OrderType } from '../../interfaces';
import { cn } from '../../utils/cn';
import OrderCard from './OrderCard';

interface ClientOrdersListProps {
  orders: IOrder[];
  closureMode: boolean;
  emptyMessage?: string;
  selectedCacambaIds: string[];
  onToggleSelect: (cacamba: ICacamba, checked: boolean) => void;
  onImageClick: (url: string) => void;
  onEditPrice: (cacamba: ICacamba) => void;
  onEditContentType: (cacamba: ICacamba) => void;
  onEditCacamba?: (payload: { cacamba: ICacamba; orderType: OrderType }) => void;
  compact?: boolean;
}

const ClientOrdersList: React.FC<ClientOrdersListProps> = ({
  orders,
  closureMode,
  emptyMessage = 'Nenhum pedido encontrado para os filtros selecionados.',
  selectedCacambaIds,
  onToggleSelect,
  onImageClick,
  onEditPrice,
  onEditContentType,
  onEditCacamba,
  compact = false,
}) => (
  <div className={cn('min-h-0 flex-auto overflow-y-auto', compact ? 'px-0 pb-0 pt-0' : 'px-5 pb-5 pt-4')}>
    {orders.length > 0 ? (
      orders.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          closureMode={closureMode}
          selectedCacambaIds={selectedCacambaIds}
          onToggleSelect={onToggleSelect}
          onImageClick={onImageClick}
          onEditPrice={onEditPrice}
          onEditContentType={onEditContentType}
          onEditCacamba={onEditCacamba}
          compact={compact}
        />
      ))
    ) : (
      <div className="rounded-ui-lg border border-dashed border-gray-300 bg-white p-4 text-[0.92rem] text-gray-500">{emptyMessage}</div>
    )}
  </div>
);

export default ClientOrdersList;
