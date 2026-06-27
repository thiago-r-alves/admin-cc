import React from 'react';
import type { ICacamba, IOrder } from '../../interfaces';
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
}) => (
  <div className="min-h-0 flex-auto overflow-y-auto px-5 pb-5 pt-4">
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
        />
      ))
    ) : (
      <div className="rounded-ui-lg border border-dashed border-red-200 bg-[#fffafa] p-4 text-[0.92rem] text-gray-500">{emptyMessage}</div>
    )}
  </div>
);

export default ClientOrdersList;
