import type { ReactNode } from 'react';
import type { ICacamba, IOrder } from '../../../interfaces';
import type { CacambaStatusBadge } from '../../../components/CacambaList';
import { formatOverdueBusinessDays, formatWithdrawalDueDate } from '../admin.formatters';
import type {
  PendingWithdrawalSortMode,
  WithdrawalAddressGroup,
  WithdrawalClientGroup,
} from '../admin.helpers';
import {
  AcompanhamentoFilterField,
  AcompanhamentoFilterLabel,
  AcompanhamentoFiltersGrid,
  AcompanhamentoSortSelect,
  AcompanhamentoToolbar,
  CacambaSection,
  EmptyState,
  InfoLabel,
  InfoTile,
  InfoValue,
  OrdersPage,
  OrdersSectionTitle,
  SectionContainer,
  WithdrawalAddressGroupBlock,
  WithdrawalAddressHeader,
  WithdrawalAddressInfo,
  WithdrawalClientHeader,
  WithdrawalClientHeaderActions,
  WithdrawalClientHeaderText,
  WithdrawalClientSection,
  WithdrawalClientTitle,
  WithdrawalCreateButton,
  WithdrawalGroupsStack,
  WithdrawalInfoGrid,
  WithdrawalOrderStatusBadge,
  WithdrawalOrderStatusRow,
} from '../admin.styles';

type PendingWithdrawalsTabProps = {
  groups: WithdrawalClientGroup[];
  sortMode: PendingWithdrawalSortMode;
  onSortModeChange: (mode: PendingWithdrawalSortMode) => void;
  onOpenWithdrawalOrder: (addressGroup: WithdrawalAddressGroup) => void;
  renderCompletedCacambas: (
    order: IOrder,
    cacambas: ICacamba[],
    statusBadges?: Record<string, CacambaStatusBadge | CacambaStatusBadge[]>,
    options?: { showTypeBadge?: boolean },
  ) => ReactNode;
};

export const PendingWithdrawalsTab = ({
  groups,
  sortMode,
  onSortModeChange,
  onOpenWithdrawalOrder,
  renderCompletedCacambas,
}: PendingWithdrawalsTabProps) => (
  <OrdersPage>
    <SectionContainer>
      <AcompanhamentoToolbar>
        <OrdersSectionTitle>Retiradas pendentes</OrdersSectionTitle>
      </AcompanhamentoToolbar>
      <AcompanhamentoFiltersGrid>
        <AcompanhamentoFilterField>
          <AcompanhamentoFilterLabel htmlFor="pending-withdrawal-sort-mode">Ordenar por</AcompanhamentoFilterLabel>
          <AcompanhamentoSortSelect
            id="pending-withdrawal-sort-mode"
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as PendingWithdrawalSortMode)}
          >
            <option value="overdueDesc">Vencidas há mais tempo</option>
            <option value="overdueAsc">Vencidas há menos tempo</option>
            <option value="clientName">Cliente A-Z</option>
          </AcompanhamentoSortSelect>
        </AcompanhamentoFilterField>
      </AcompanhamentoFiltersGrid>

      {groups.length ? (
        <WithdrawalGroupsStack>
          {groups.map((clientGroup) => (
            <WithdrawalClientSection key={clientGroup.key} data-testid="withdrawal-client-group">
              <WithdrawalClientHeader>
                <WithdrawalClientHeaderText>
                  <WithdrawalClientTitle>{clientGroup.clientName}</WithdrawalClientTitle>
                </WithdrawalClientHeaderText>
                <WithdrawalClientHeaderActions>
                  {clientGroup.groups.map((addressGroup) => {
                    const hasAvailableCacambas = addressGroup.availableCacambaIds.length > 0;

                    return (
                      <WithdrawalCreateButton
                        key={addressGroup.key}
                        type="button"
                        data-testid={`create-withdrawal-order-${addressGroup.cacambaIds[0]}`}
                        disabled={!hasAvailableCacambas}
                        title={
                          hasAvailableCacambas
                            ? addressGroup.address
                            : 'Todas as caçambas deste endereço já têm pedido de retirada criado.'
                        }
                        onClick={() => onOpenWithdrawalOrder(addressGroup)}
                      >
                        {hasAvailableCacambas ? 'Criar pedido de retirada' : 'Pedido de retirada criado'}
                      </WithdrawalCreateButton>
                    );
                  })}
                </WithdrawalClientHeaderActions>
              </WithdrawalClientHeader>

              {clientGroup.groups.map((addressGroup) => {
                const contact = [
                  addressGroup.order.contactName,
                  addressGroup.order.contactNumber ? `(${addressGroup.order.contactNumber})` : '',
                ].filter(Boolean).join(' ');
                const plannedWithdrawalOrders = [
                  ...new Map(
                    addressGroup.items
                      .filter((item) => item.plannedWithdrawal)
                      .map((item) => [
                        item.plannedWithdrawal!.orderId,
                        {
                          id: item.plannedWithdrawal!.orderId,
                          label: item.plannedWithdrawal!.orderNumber
                            ? `Pedido #${item.plannedWithdrawal!.orderNumber} criado - aguardando motorista finalizar retirada`
                            : 'Pedido criado - aguardando motorista finalizar retirada',
                        },
                      ]),
                  ).values(),
                ];
                const withdrawalStatusBadges = Object.fromEntries(
                  addressGroup.items.map((item) => {
                    const badges: CacambaStatusBadge[] = [
                      {
                        tone: 'danger',
                        label: `Venceu em ${formatWithdrawalDueDate(item.dueDate)} • ${formatOverdueBusinessDays(item.businessDaysOnSite)}`,
                      },
                    ];

                    return [item.cacamba._id, badges];
                  }),
                );

                return (
                  <WithdrawalAddressGroupBlock key={addressGroup.key} data-testid="withdrawal-address-group">
                    <WithdrawalAddressHeader>
                      <WithdrawalAddressInfo>
                        <WithdrawalInfoGrid>
                          <InfoTile>
                            <InfoLabel>Endereço da entrega</InfoLabel>
                            <InfoValue>{addressGroup.address}</InfoValue>
                          </InfoTile>
                          <InfoTile>
                            <InfoLabel>Contato</InfoLabel>
                            <InfoValue>{contact || '-'}</InfoValue>
                          </InfoTile>
                          <InfoTile>
                            <InfoLabel>CNPJ/CPF</InfoLabel>
                            <InfoValue>{clientGroup.cnpjCpf || '-'}</InfoValue>
                          </InfoTile>
                        </WithdrawalInfoGrid>
                        {plannedWithdrawalOrders.length > 0 && (
                          <WithdrawalOrderStatusRow>
                            {plannedWithdrawalOrders.map((orderStatus) => (
                              <WithdrawalOrderStatusBadge
                                key={orderStatus.id}
                                data-testid={`withdrawal-order-status-${orderStatus.id}`}
                              >
                                {orderStatus.label}
                              </WithdrawalOrderStatusBadge>
                            ))}
                          </WithdrawalOrderStatusRow>
                        )}
                      </WithdrawalAddressInfo>
                    </WithdrawalAddressHeader>

                    <CacambaSection>
                      {renderCompletedCacambas(
                        addressGroup.order,
                        addressGroup.items.map((item) => item.cacamba),
                        withdrawalStatusBadges,
                        { showTypeBadge: false },
                      )}
                    </CacambaSection>
                  </WithdrawalAddressGroupBlock>
                );
              })}
            </WithdrawalClientSection>
          ))}
        </WithdrawalGroupsStack>
      ) : (
        <EmptyState>Nenhuma caçamba passou de 5 dias úteis para abertura de retirada.</EmptyState>
      )}
    </SectionContainer>
  </OrdersPage>
);
