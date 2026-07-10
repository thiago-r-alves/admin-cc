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
  onOpenRoute: (address: string, number: string, neighborhood: string, city?: string, cep?: string) => void;
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
        const cacambaCount = order.cacambas?.length ?? 0;
        const fullAddress = `${order.address}, ${order.addressNumber} - ${order.neighborhood} - ${order.city || ''} - CEP ${order.cep || ''}`;
        const actionLabel = order.type === 'entrega' ? 'Registrar entrega' : 'Registrar retirada';

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
                  <InfoValue>{fullAddress}</InfoValue>
                </InfoBlock>
                <InfoBlock>
                  <InfoLabel>Contato</InfoLabel>
                  <InfoValue><strong>{order.contactName}</strong><br />{order.contactNumber}</InfoValue>
                </InfoBlock>
              </InfoGrid>

              <ActionRow>
                <CacambaButton
                  type="button"
                  $variant="route"
                  onClick={() => onOpenRoute(order.address, order.addressNumber, order.neighborhood, order.city, order.cep)}
                >
                  Abrir no Maps
                </CacambaButton>
              </ActionRow>

              {canManage && (
                <CacambaSection>
                  <CacambaHeader>
                    <CacambaButton type="button" $variant="primary" onClick={() => onAddCacamba(order._id, order.type)}>
                      {actionLabel}
                    </CacambaButton>
                  </CacambaHeader>
                  <CacambaList
                    cacambas={order.cacambas || []}
                    onImageClick={onOpenImage}
                    onEdit={(cacamba) => onEditCacamba(cacamba, order.type)}
                    onDelete={onDeleteCacamba}
                    responsibility={{ motorista: order.motorista, placa: order.placa }}
                    showTypeBadge={false}
                    showResponsibility={false}
                  />
                  <div className="mt-4 rounded-ui-md bg-slate-100 px-4 py-3 text-sm font-bold text-gray-700" role="status">
                    {cacambaCount === 0
                      ? `Nenhuma caçamba registrada. Registre a ${order.type} para liberar a conclusão.`
                      : `${cacambaCount} caçamba${cacambaCount > 1 ? 's' : ''} registrada${cacambaCount > 1 ? 's' : ''} • Pronto para concluir`}
                  </div>
                  {canConclude && (
                    <CacambaButton
                      type="button"
                      $variant="success"
                      className="mt-3 w-full"
                      onClick={() => onCompleteOrder(order._id)}
                    >
                      Concluir pedido
                    </CacambaButton>
                  )}
                </CacambaSection>
              )}
            </OrderCardBody>
          </OrderCard>
        );
      })}
    </OrdersGrid>
  </OrdersSection>
);
