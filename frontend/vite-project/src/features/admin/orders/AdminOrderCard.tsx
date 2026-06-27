import type { ICacamba, IOrder, OrderType } from '../../../interfaces';
import CacambaList from '../../../components/CacambaList';
import { apiUrl } from '../../../services/api';
import { SHOW_ORDER_DOWNLOAD_BUTTON, typeLabels } from '../admin.constants';
import { formatOrderAddress } from '../admin.helpers';
import {
  ActionButton,
  CacambaSection,
  DeleteOrderButton,
  DownloadOrderButton,
  ImageContainer,
  InfoGrid,
  InfoLabel,
  InfoTile,
  InfoValue,
  OrderActions,
  OrderAddressBlock,
  OrderCard,
  OrderCardBody,
  OrderCardHeader,
  OrderClientName,
  OrderDetailsDivider,
  OrderFooter,
  OrderHeaderMeta,
  OrderImage,
  OrderNumber,
  OrderTypeBadge,
} from '../admin.styles';

type AdminOrderCardProps = {
  order: IOrder;
  onOpenImage: (url: string) => void;
  onEditCacamba: (payload: { cacamba: ICacamba; orderType: OrderType }) => void;
  onEditCacambaPrice: (cacamba: ICacamba) => void;
  onCorrectOrder: (order: IOrder) => void;
  onChangeClient: (order: IOrder) => void;
  onDeleteOrder: (orderId: string) => void;
};

export const AdminOrderCard = ({
  order,
  onOpenImage,
  onEditCacamba,
  onEditCacambaPrice,
  onCorrectOrder,
  onChangeClient,
  onDeleteOrder,
}: AdminOrderCardProps) => {
  const hasCacambas = (order.cacambas?.length ?? 0) > 0;
  const canCorrectOrder = order.status === 'pendente' && !hasCacambas;
  const contactText = [order.contactName, order.contactNumber ? `(${order.contactNumber})` : '']
    .filter(Boolean)
    .join(' ') || '-';

  return (
    <OrderCard key={order._id} status={order.status} data-testid={`order-card-${order._id}`}>
      <OrderCardHeader>
        <OrderHeaderMeta>
          <OrderNumber>#{order.orderNumber ?? '-'}</OrderNumber>
        </OrderHeaderMeta>
        <OrderTypeBadge $type={order.type}>{typeLabels[order.type] ?? order.type}</OrderTypeBadge>
      </OrderCardHeader>

      <OrderCardBody>
        <OrderClientName>{order.clientName}</OrderClientName>

        <OrderAddressBlock>
          <div>
            <InfoLabel>Endereço da obra</InfoLabel>
            <InfoValue>{formatOrderAddress(order)}</InfoValue>
          </div>
        </OrderAddressBlock>

        <InfoGrid>
          <InfoTile>
            <div>
              <InfoLabel>Contato</InfoLabel>
              <InfoValue>{contactText}</InfoValue>
            </div>
          </InfoTile>
          <InfoTile>
            <div>
              <InfoLabel>CNPJ/CPF</InfoLabel>
              <InfoValue>{order.cnpjCpf || '-'}</InfoValue>
            </div>
          </InfoTile>
          <InfoTile>
            <div>
              <InfoLabel>Placa veículo</InfoLabel>
              <InfoValue style={{ textTransform: 'uppercase' }}>{order.placa || '-'}</InfoValue>
            </div>
          </InfoTile>
        </InfoGrid>

        {hasCacambas && (
          <CacambaSection>
            <CacambaList
              cacambas={order.cacambas || []}
              onImageClick={onOpenImage}
              showTitle={false}
              onEdit={(cacamba) => onEditCacamba({ cacamba, orderType: order.type })}
              editLabel="Editar caçamba"
              adminMetaActions={order.type === 'retirada'}
              canEditPrice={order.type === 'retirada' && order.status === 'concluido'}
              onEditPrice={onEditCacambaPrice}
              showDeliveryDateForRetirada
              responsibility={{ motorista: order.motorista, placa: order.placa }}
            />
          </CacambaSection>
        )}

        {((order.imageUrls?.length ?? 0) > 0) && (
          <CacambaSection>
            <h4>Imagens Anexadas</h4>
            <ImageContainer>
              {(order.imageUrls ?? []).map((url, index) => (
                <OrderImage
                  key={url || index}
                  src={`${apiUrl}${url}`}
                  alt={`Imagem ${index + 1}`}
                  onClick={() => onOpenImage(`${apiUrl}${url}`)}
                />
              ))}
            </ImageContainer>
          </CacambaSection>
        )}

        <OrderDetailsDivider />

        <OrderFooter>
          <OrderActions>
            {order.status === 'pendente' && (
              <ActionButton
                type="button"
                disabled={!canCorrectOrder}
                title={hasCacambas ? 'Pedidos com caçambas cadastradas não podem ser corrigidos.' : undefined}
                onClick={() => onCorrectOrder(order)}
              >
                Corrigir Pedido
              </ActionButton>
            )}
            <ActionButton type="button" onClick={() => onChangeClient(order)}>
              Corrigir Cliente
            </ActionButton>
            <DeleteOrderButton onClick={() => onDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
            {SHOW_ORDER_DOWNLOAD_BUTTON && order.status === 'concluido' && (
              <DownloadOrderButton
                type="button"
                onClick={async () => {
                  const { downloadOrderPdf } = await import('../../../utils/orderPdf');
                  downloadOrderPdf(order);
                }}
              >
                Baixar Pedido
              </DownloadOrderButton>
            )}
          </OrderActions>
        </OrderFooter>
      </OrderCardBody>
    </OrderCard>
  );
};
