import React from 'react';
import type { ICacamba, IOrder } from '../../interfaces';
import CacambaList from '../CacambaList';

const isObjectIdLike = (value: string) => /^[a-f0-9]{24}$/i.test(value);

const getDriverName = (order: IOrder) => {
  if (!order.motorista) return '';
  if (typeof order.motorista === 'string') {
    return isObjectIdLike(order.motorista) ? '' : order.motorista;
  }
  return order.motorista.username || '';
};

interface OrderCardProps {
  order: IOrder;
  closureMode: boolean;
  selectedCacambaIds: string[];
  onToggleSelect: (cacamba: ICacamba, checked: boolean) => void;
  onImageClick: (url: string) => void;
  onEditPrice: (cacamba: ICacamba) => void;
  onEditContentType: (cacamba: ICacamba) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  closureMode,
  selectedCacambaIds,
  onToggleSelect,
  onImageClick,
  onEditPrice,
  onEditContentType,
}) => {
  const responsibility = {
    driverName: getDriverName(order),
    placa: order.placa || '',
  };

  return (
    <article className="overflow-hidden rounded-ui-lg border border-red-200 bg-white [&+&]:mt-4">
      <div className="flex items-center justify-between gap-4 border-b border-red-100 bg-slate-50 px-4 py-[0.95rem]">
        <strong className="font-black text-brand" style={{ color: 'rgb(227, 6, 19)' }}>
          Pedido #{order.orderNumber ?? '-'}
        </strong>
        <span>{new Date(order.createdAt || '').toLocaleDateString('pt-BR')}</span>
      </div>

      <div className="p-4">
        {order.cacambas && order.cacambas.length > 0 && (
          <CacambaList
            cacambas={order.cacambas || []}
            onImageClick={onImageClick}
            showTitle={false}
            selectable={closureMode}
            canEditPrice={closureMode}
            adminMetaActions={closureMode}
            onEditPrice={onEditPrice}
            onEditContentType={onEditContentType}
            selectedCacambaIds={selectedCacambaIds}
            onToggleSelect={onToggleSelect}
            showDeliveryDateForRetirada
            responsibility={responsibility}
          />
        )}
      </div>
    </article>
  );
};

export default OrderCard;
