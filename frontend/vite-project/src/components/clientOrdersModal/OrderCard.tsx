import React from 'react';
import type { ICacamba, IOrder } from '../../interfaces';
import { cn } from '../../utils/cn';
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
  compact?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  closureMode,
  selectedCacambaIds,
  onToggleSelect,
  onImageClick,
  onEditPrice,
  onEditContentType,
  compact = false,
}) => {
  const responsibility = {
    driverName: getDriverName(order),
    placa: order.placa || '',
  };

  return (
    <article className={cn('overflow-hidden rounded-ui-lg border border-gray-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]', compact ? '[&+&]:mt-3' : '[&+&]:mt-4')}>
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <strong className="text-[0.95rem] font-black text-brand" style={{ color: 'rgb(227, 6, 19)' }}>
          Pedido #{order.orderNumber ?? '-'}
        </strong>
        <span className="text-[0.88rem] font-bold text-gray-600">{new Date(order.createdAt || '').toLocaleDateString('pt-BR')}</span>
      </div>

      <div className={compact ? 'p-3' : 'p-4'}>
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
