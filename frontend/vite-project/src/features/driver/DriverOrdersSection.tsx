import type { ICacamba, IOrder, OrderType } from '../../interfaces';
import CacambaList from '../../components/CacambaList';
import { driverOrderTypeLabels } from './driver.constants';
import {
  ActionRow,
  CacambaButton,
  CacambaHeader,
  CacambaSection,
  ClientName,
  EmptyState,
  InfoBlock,
  InfoGrid,
  InfoLabel,
  InfoValue,
  OrderCard,
  OrderCardBody,
  OrderCardHeader,
  OrderIdentifier,
  OrderNumber,
  OrdersGrid,
  OrdersSection,
  OrdersSectionTitle,
  OrderTypeBadge,
} from './driver.styles';

type DriverOrdersSectionProps = {
  orders: IOrder[];
  onOpenRoute: (address: string, number: string, neighborhood: string) => void;
  onCompleteOrder: (orderId: string) => void;
  onAddCacamba: (orderId: string, orderType: OrderType) => void;
  onOpenImage: (url: string) => void;
  onEditCacamba: (cacamba: ICacamba, orderType: OrderType) => void;
  onDeleteCacamba: (cacambaId: string) => void;
};

export const DriverOrdersSection = ({
  orders,
  onOpenRoute,
  onCompleteOrder,
  onAddCacamba,
  onOpenImage,
  onEditCacamba,
  onDeleteCacamba,
}: DriverOrdersSectionProps) => (
  <OrdersSection>
    <OrdersSectionTitle>Pedidos Ativos</OrdersSectionTitle>
    <OrdersGrid>
      {orders.length === 0 && (
        <EmptyState>Nenhum pedido ativo para o motorista no momento.</EmptyState>
      )}

      {orders.map((order) => {
        const canConclude = (order.cacambas?.length ?? 0) >= 1;
        const canManage = order.status !== 'cancelado';

        return (
          <OrderCard key={order._id}>
            <OrderCardHeader>
              <OrderIdentifier>
                <OrderNumber>{order.orderNumber ? `#${order.orderNumber}` : 'Pedido'}</OrderNumber>
              </OrderIdentifier>
              <OrderTypeBadge>{driverOrderTypeLabels[order.type] ?? order.type}</OrderTypeBadge>
            </OrderCardHeader>

            <OrderCardBody>
              <ClientName>{order.clientName}</ClientName>

              <InfoGrid>
                <InfoBlock $span={2}>
                  <InfoLabel>Endereço da obra</InfoLabel>
                  <InfoValue>
                    {order.address}, {order.addressNumber} - {order.neighborhood} - {order.city} - CEP {order.cep}
                  </InfoValue>
                </InfoBlock>
                <InfoBlock>
                  <InfoLabel>Contato</InfoLabel>
                  <InfoValue>{order.contactName} ({order.contactNumber})</InfoValue>
                </InfoBlock>
              </InfoGrid>

              <ActionRow>
                <CacambaButton
                  type="button"
                  $variant="danger"
                  onClick={() => onOpenRoute(order.address, order.addressNumber, order.neighborhood)}
                >
                  Ver rota
                </CacambaButton>
                {canManage && canConclude && (
                  <CacambaButton
                    type="button"
                    $variant="success"
                    onClick={() => onCompleteOrder(order._id)}
                  >
                    Concluir Pedido
                  </CacambaButton>
                )}
              </ActionRow>

              {canManage && (
                <CacambaSection>
                  <CacambaHeader>
                    <CacambaButton type="button" $variant="primary" onClick={() => onAddCacamba(order._id, order.type)}>
                      + Adicionar Caçamba
                    </CacambaButton>
                  </CacambaHeader>
                  <CacambaList
                    cacambas={order.cacambas || []}
                    onImageClick={onOpenImage}
                    onEdit={(cacamba) => onEditCacamba(cacamba, order.type)}
                    onDelete={onDeleteCacamba}
                    responsibility={{ motorista: order.motorista, placa: order.placa }}
                  />
                </CacambaSection>
              )}
            </OrderCardBody>
          </OrderCard>
        );
      })}
    </OrdersGrid>
  </OrdersSection>
);
