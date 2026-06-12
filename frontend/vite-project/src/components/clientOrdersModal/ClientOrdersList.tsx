import React from 'react';
import styled from 'styled-components';
import type { ICacamba, IOrder } from '../../interfaces';
import OrderCard from './OrderCard';

const OrdersList = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.25rem;
`;

const EmptyState = styled.div`
  padding: 1rem;
  border: 1px dashed #fecaca;
  border-radius: 6px;
  background: #fffafa;
  color: #6b7280;
  font-size: 0.92rem;
`;

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
  <OrdersList>
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
      <EmptyState>{emptyMessage}</EmptyState>
    )}
  </OrdersList>
);

export default ClientOrdersList;
