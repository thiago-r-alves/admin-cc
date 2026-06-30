import type { Dispatch, SetStateAction } from 'react';
import type { ICacamba, OrderType } from '../../../interfaces';
import { apiUrl } from '../../../services/api';
import {
  formatDaysOnSite,
  formatOrderAddress,
  getDaysOnSite,
  getDaysOnSiteTone,
  type AcompanhamentoFilters,
  type AcompanhamentoItem,
  type AcompanhamentoSortMode,
} from '../admin.helpers';
import {
  ActionButton,
  AcompanhamentoActions,
  AcompanhamentoFilterField,
  AcompanhamentoFilterInput,
  AcompanhamentoFilterLabel,
  AcompanhamentoFiltersGrid,
  AcompanhamentoImage,
  AcompanhamentoSortSelect,
  AcompanhamentoToolbar,
  CacambaAgeBadge,
  DeleteOrderButton,
  EmptyState,
  InfoGrid,
  InfoLabel,
  InfoTile,
  InfoValue,
  OrderCard,
  OrderCardBody,
  OrderCardHeader,
  OrderClientName,
  OrderDetailsDivider,
  OrderHeaderBadges,
  OrderHeaderMeta,
  OrderNumber,
  OrdersGrid,
  OrdersPage,
  OrdersSectionTitle,
  SectionContainer,
  SummaryBadge,
} from '../admin.styles';

type AcompanhamentoTabProps = {
  items: AcompanhamentoItem[];
  filters: AcompanhamentoFilters;
  sortMode: AcompanhamentoSortMode;
  onFiltersChange: Dispatch<SetStateAction<AcompanhamentoFilters>>;
  onSortModeChange: (mode: AcompanhamentoSortMode) => void;
  onEditCacamba: (payload: { cacamba: ICacamba; orderType: OrderType }) => void;
  onDeleteCacamba: (cacambaId: string, numero: string) => void;
  onOpenImage: (url: string) => void;
};

const acompanhamentoFilterFields: Array<{
  id: string;
  label: string;
  key: keyof AcompanhamentoFilters;
  inputMode?: 'numeric';
}> = [
  { id: 'filtro-numero-cacamba', label: 'Nº caçamba', key: 'numero' },
  { id: 'filtro-qtd-cacambas', label: 'Qtd. mín. caçambas', key: 'cacambaCount', inputMode: 'numeric' },
  { id: 'filtro-cliente', label: 'Cliente', key: 'clientName' },
  { id: 'filtro-cnpj', label: 'CNPJ/CPF', key: 'cnpjCpf' },
  { id: 'filtro-contato', label: 'Contato', key: 'contact' },
  { id: 'filtro-telefone', label: 'Telefone', key: 'phone' },
  { id: 'filtro-ordem-servico', label: 'Ordem de serviço', key: 'serviceOrder' },
  { id: 'filtro-ordem-servico-digital', label: 'Ordem de serviço digital', key: 'serviceOrderDigital' },
  { id: 'filtro-endereco', label: 'Endereço', key: 'address' },
  { id: 'filtro-bairro', label: 'Bairro', key: 'neighborhood' },
  { id: 'filtro-cidade', label: 'Cidade', key: 'city' },
  { id: 'filtro-cep', label: 'CEP', key: 'cep' },
];

export const AcompanhamentoTab = ({
  items,
  filters,
  sortMode,
  onFiltersChange,
  onSortModeChange,
  onEditCacamba,
  onDeleteCacamba,
  onOpenImage,
}: AcompanhamentoTabProps) => (
  <OrdersPage>
    <SectionContainer>
      <AcompanhamentoToolbar>
        <OrdersSectionTitle>Acompanhamentos</OrdersSectionTitle>
        <SummaryBadge>TOTAL: {items.length}</SummaryBadge>
      </AcompanhamentoToolbar>
      <AcompanhamentoFiltersGrid>
        {acompanhamentoFilterFields.map((field) => (
          <AcompanhamentoFilterField key={field.key}>
            <AcompanhamentoFilterLabel htmlFor={field.id}>{field.label}</AcompanhamentoFilterLabel>
            <AcompanhamentoFilterInput
              id={field.id}
              type="text"
              inputMode={field.inputMode}
              value={filters[field.key]}
              onChange={(event) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  [field.key]: event.target.value,
                }))
              }
            />
          </AcompanhamentoFilterField>
        ))}
        <AcompanhamentoFilterField>
          <AcompanhamentoFilterLabel htmlFor="acompanhamento-sort-mode">Ordenar por</AcompanhamentoFilterLabel>
          <AcompanhamentoSortSelect
            id="acompanhamento-sort-mode"
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as AcompanhamentoSortMode)}
          >
            <option value="default">Menos tempo na obra</option>
            <option value="oldest">Mais tempo na obra</option>
            <option value="cacambaCountDesc">Qtd. caçambas maior</option>
            <option value="cacambaCountAsc">Qtd. caçambas menor</option>
            <option value="clientName">Cliente A-Z</option>
          </AcompanhamentoSortSelect>
        </AcompanhamentoFilterField>
      </AcompanhamentoFiltersGrid>

      {items.length ? (
        <OrdersGrid>
          {items.map(({ numero, cacamba, order, activeCacambaCount }) => {
            const motoristaNome =
              typeof order.motorista === 'object' && order.motorista !== null
                ? (order.motorista as { username?: string }).username
                : '';
            const contato = [order.contactName, order.contactNumber].filter(Boolean).join(' - ');
            const localLabel =
              cacamba.local === 'via_publica'
                ? 'Via pública'
                : cacamba.local === 'canteiro_obra'
                  ? 'Canteiro de obra'
                  : '-';
            const daysOnSite = getDaysOnSite(cacamba.createdAt);
            const daysOnSiteTone = getDaysOnSiteTone(daysOnSite);

            return (
              <OrderCard key={cacamba._id} status={order.status} data-testid={`acompanhamento-card-${cacamba._id}`}>
                <OrderCardHeader>
                  <OrderHeaderMeta>
                    <OrderNumber>Caçamba #{numero}</OrderNumber>
                  </OrderHeaderMeta>
                  <OrderHeaderBadges>
                    <CacambaAgeBadge
                      $tone={daysOnSiteTone}
                      data-testid="cacamba-age-badge"
                      data-age-tone={daysOnSiteTone}
                    >
                      {formatDaysOnSite(daysOnSite)}
                    </CacambaAgeBadge>
                  </OrderHeaderBadges>
                </OrderCardHeader>

                <OrderCardBody>
                  <InfoGrid>
                    <InfoTile>
                      <InfoLabel>Última entrega</InfoLabel>
                      <InfoValue>{cacamba.createdAt ? new Date(cacamba.createdAt).toLocaleString('pt-BR') : '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Local</InfoLabel>
                      <InfoValue>{localLabel}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Qtd. no endereço</InfoLabel>
                      <InfoValue>{activeCacambaCount}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Ordem de serviço</InfoLabel>
                      <InfoValue>{cacamba.horaServicoDigitos || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Ordem de serviço digital</InfoLabel>
                      <InfoValue>{order.orderNumber ?? '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Placa do caminhão</InfoLabel>
                      <InfoValue style={{ textTransform: 'uppercase' }}>{order.placa || '-'}</InfoValue>
                    </InfoTile>
                    {cacamba.imageUrl && (
                      <InfoTile>
                        <InfoLabel>Imagem da caçamba</InfoLabel>
                        <div style={{ marginTop: '0.4rem' }}>
                          <AcompanhamentoImage
                            src={cacamba.imageUrl.startsWith('http') ? cacamba.imageUrl : `${apiUrl}${cacamba.imageUrl}`}
                            alt="Foto da caçamba"
                            data-testid={`acompanhamento-image-${cacamba._id}`}
                            onClick={async () => {
                              const full = cacamba.imageUrl!.startsWith('http') ? cacamba.imageUrl! : `${apiUrl}${cacamba.imageUrl}`;
                              try {
                                const mod = await import('../../../utils/image');
                                const large = await mod.resizeImage(full, 1200, 0.8);
                                onOpenImage(large);
                              } catch (error) {
                                console.error('Erro redimensionando imagem:', error);
                                onOpenImage(full);
                              }
                            }}
                          />
                        </div>
                      </InfoTile>
                    )}
                  </InfoGrid>

                  <OrderDetailsDivider />

                  <OrderClientName>{order.clientName || '-'}</OrderClientName>
                  <InfoGrid>
                    <InfoTile>
                      <InfoLabel>Motorista</InfoLabel>
                      <InfoValue>{motoristaNome || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>CNPJ/CPF</InfoLabel>
                      <InfoValue>{order.cnpjCpf || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Contato</InfoLabel>
                      <InfoValue>{contato || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Endereço</InfoLabel>
                      <InfoValue>{formatOrderAddress(order)}</InfoValue>
                    </InfoTile>
                  </InfoGrid>
                  <AcompanhamentoActions>
                    <ActionButton
                      type="button"
                      data-testid={`acompanhamento-edit-${cacamba._id}`}
                      onClick={() => onEditCacamba({ cacamba, orderType: order.type })}
                    >
                      Editar caçamba
                    </ActionButton>
                    <DeleteOrderButton
                      type="button"
                      data-testid={`acompanhamento-delete-${cacamba._id}`}
                      onClick={() => onDeleteCacamba(cacamba._id, numero)}
                    >
                      Excluir caçamba
                    </DeleteOrderButton>
                  </AcompanhamentoActions>
                </OrderCardBody>
              </OrderCard>
            );
          })}
        </OrdersGrid>
      ) : (
        <EmptyState>
          {Object.values(filters).some((value) => String(value).trim())
            ? 'Nenhuma caçamba encontrada para este filtro.'
            : 'Nenhuma caçamba em colocação pendente de retirada.'}
        </EmptyState>
      )}
    </SectionContainer>
  </OrdersPage>
);
