import React from 'react';
import styled from 'styled-components';
import type { ICacamba, IOrder } from '../../interfaces';
import CacambaList from '../CacambaList';

const StyledOrderCard = styled.article`
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;

  & + & {
    margin-top: 1rem;
  }
`;

const OrderCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #fee2e2;
  background: #f8fafc;
`;

const OrderCardBody = styled.div`
  padding: 1rem;
`;

const OrderIdentifier = styled.strong`
  color: #e30613;
  font-weight: 900;
`;

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
}) => (
  <StyledOrderCard>
    <OrderCardHeader>
      <OrderIdentifier>Pedido #{order.orderNumber ?? '-'}</OrderIdentifier>
      <span>{new Date(order.createdAt || '').toLocaleDateString('pt-BR')}</span>
    </OrderCardHeader>

    <OrderCardBody>
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
        />
      )}
    </OrderCardBody>
  </StyledOrderCard>
);

export default OrderCard;
