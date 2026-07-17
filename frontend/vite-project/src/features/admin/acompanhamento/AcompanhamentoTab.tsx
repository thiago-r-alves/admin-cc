import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import type { Props as ReactSelectProps, SingleValue, StylesConfig } from 'react-select';
import type {
  ICacamba,
  ICacambaTrackEvent,
  ICacambaTrackResponse,
  IClient,
  IOrder,
  OrderType,
} from '../../../interfaces';
import { apiUrl } from '../../../services/api';
import { formatDriverName } from '../../../utils/formatDriverName';
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
import { CacambaTrackModal } from './CacambaTrackModal';
import { ClientHistoryModal } from './ClientHistoryModal';

type HistoryOption = {
  value: string;
  label: string;
};

type HistorySelectComponent = ComponentType<ReactSelectProps<HistoryOption, false>>;

type AcompanhamentoTabProps = {
  items: AcompanhamentoItem[];
  filters: AcompanhamentoFilters;
  sortMode: AcompanhamentoSortMode;
  onFiltersChange: Dispatch<SetStateAction<AcompanhamentoFilters>>;
  onSortModeChange: (mode: AcompanhamentoSortMode) => void;
  onEditCacamba: (payload: { cacamba: ICacamba; orderType: OrderType; onUpdated?: () => Promise<void> | void }) => void;
  onDeleteCacamba: (
    cacambaId: string,
    numero: string,
    onDeleted?: () => Promise<void> | void,
    options?: { skipRefresh?: boolean },
  ) => void;
  onOpenImage: (url: string) => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const acompanhamentoFilterFields: Array<{
  id: string;
  label: string;
  key: keyof AcompanhamentoFilters;
  inputMode?: 'numeric';
}> = [
  { id: 'filtro-cliente', label: 'Cliente', key: 'clientName' },
  { id: 'filtro-numero-cacamba', label: 'Nº caçamba', key: 'numero' },
  { id: 'filtro-qtd-cacambas', label: 'Qtd. mín. caçambas', key: 'cacambaCount', inputMode: 'numeric' },
  { id: 'filtro-cnpj', label: 'CNPJ/CPF', key: 'cnpjCpf' },
  { id: 'filtro-contato', label: 'Contato', key: 'contact' },
  { id: 'filtro-telefone', label: 'Telefone', key: 'phone' },
  { id: 'filtro-ordem-servico-digital', label: 'Ordem de serviço digital', key: 'serviceOrderDigital' },
  { id: 'filtro-endereco', label: 'Endereço', key: 'address' },
  { id: 'filtro-bairro', label: 'Bairro', key: 'neighborhood' },
  { id: 'filtro-cidade', label: 'Cidade', key: 'city' },
  { id: 'filtro-cep', label: 'CEP', key: 'cep' },
];

const historySelectStyles: StylesConfig<HistoryOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderColor: state.isFocused ? '#ef4444' : '#fecaca',
    borderRadius: 10,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(239, 68, 68, 0.16)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#ef4444' : '#fecaca',
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 1400 }),
};

export const AcompanhamentoTab = ({
  items,
  filters,
  sortMode,
  onFiltersChange,
  onSortModeChange,
  onEditCacamba,
  onDeleteCacamba,
  onOpenImage,
  authenticatedFetch,
}: AcompanhamentoTabProps) => {
  const [SelectComponent, setSelectComponent] = useState<HistorySelectComponent | null>(null);
  const [trackedNumbers, setTrackedNumbers] = useState<string[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [numbersError, setNumbersError] = useState('');
  const [selectedHistoryNumero, setSelectedHistoryNumero] = useState('');
  const [historyClients, setHistoryClients] = useState<IClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState('');
  const [selectedHistoryClientId, setSelectedHistoryClientId] = useState('');
  const [selectedHistoryClientName, setSelectedHistoryClientName] = useState('');
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<ICacambaTrackResponse | null>(null);
  const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
  const [clientHistoryLoading, setClientHistoryLoading] = useState(false);
  const [clientHistoryError, setClientHistoryError] = useState<string | null>(null);
  const [clientHistoryOrders, setClientHistoryOrders] = useState<IOrder[]>([]);

  useEffect(() => {
    let mounted = true;
    import('react-select')
      .then((mod) => {
        if (mounted) setSelectComponent(() => mod.default as HistorySelectComponent);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchTrackedNumbers = async () => {
      setNumbersLoading(true);
      setNumbersError('');
      try {
        const response = await authenticatedFetch(`${apiUrl}/cacambas/tracked-numbers`);
        const data = await response.json();
        if (!mounted) return;
        if (!response.ok) {
          setNumbersError(data?.message || 'Erro ao carregar caçambas já registradas.');
          return;
        }
        setTrackedNumbers(Array.isArray(data?.numbers) ? data.numbers.map(String) : []);
      } catch (error) {
        if (mounted) {
          setNumbersError(error instanceof Error ? error.message : 'Erro ao carregar caçambas já registradas.');
        }
      } finally {
        if (mounted) setNumbersLoading(false);
      }
    };

    void fetchTrackedNumbers();
    return () => {
      mounted = false;
    };
  }, [authenticatedFetch]);

  useEffect(() => {
    let mounted = true;

    const fetchClients = async () => {
      setClientsLoading(true);
      setClientsError('');
      try {
        const response = await authenticatedFetch(`${apiUrl}/clients`);
        const data = await response.json();
        if (!mounted) return;
        if (!response.ok) {
          setClientsError(data?.message || 'Erro ao carregar clientes.');
          return;
        }
        setHistoryClients(Array.isArray(data) ? data : []);
      } catch (error) {
        if (mounted) {
          setClientsError(error instanceof Error ? error.message : 'Erro ao carregar clientes.');
        }
      } finally {
        if (mounted) setClientsLoading(false);
      }
    };

    void fetchClients();
    return () => {
      mounted = false;
    };
  }, [authenticatedFetch]);

  const historyOptions = useMemo<HistoryOption[]>(
    () => trackedNumbers.map((numero) => ({ value: numero, label: `Caçamba #${numero}` })),
    [trackedNumbers],
  );

  const clientHistoryOptions = useMemo<HistoryOption[]>(
    () => historyClients.map((client) => ({ value: client._id, label: client.clientName || '-' })),
    [historyClients],
  );

  const selectedHistoryOption = useMemo(
    () => historyOptions.find((option) => option.value === selectedHistoryNumero) || null,
    [historyOptions, selectedHistoryNumero],
  );

  const selectedClientHistoryOption = useMemo(
    () => clientHistoryOptions.find((option) => option.value === selectedHistoryClientId) || null,
    [clientHistoryOptions, selectedHistoryClientId],
  );

  const handleHistoryOptionChange = (option: SingleValue<HistoryOption>) => {
    setSelectedHistoryNumero(option?.value || '');
    setTrackError(null);
  };

  const handleClientHistoryOptionChange = (option: SingleValue<HistoryOption>) => {
    setSelectedHistoryClientId(option?.value || '');
    setSelectedHistoryClientName(option?.label || '');
    setClientHistoryError(null);
  };

  const searchTrack = async (numero: string) => {
    const normalizedNumero = numero.trim();
    setTrackOpen(true);
    setTrackResult(null);

    if (!normalizedNumero) {
      setTrackLoading(false);
      setTrackError('Selecione uma caçamba para buscar o histórico.');
      return;
    }

    setTrackLoading(true);
    setTrackError(null);
    setSelectedHistoryNumero(normalizedNumero);

    try {
      const response = await authenticatedFetch(
        `${apiUrl}/cacambas/track?numero=${encodeURIComponent(normalizedNumero)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setTrackError(data?.message || 'Erro ao buscar histórico da caçamba.');
        return;
      }
      setTrackResult(data as ICacambaTrackResponse);
    } catch (error) {
      setTrackError(error instanceof Error ? error.message : 'Erro ao buscar histórico da caçamba.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleTrackSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchTrack(selectedHistoryNumero);
  };

  const refreshOpenTrack = async () => {
    const numero = trackResult?.numero || selectedHistoryNumero;
    if (numero) await searchTrack(numero);
  };

  const buildCacambaFromTrackEvent = (event: ICacambaTrackEvent): ICacamba => ({
    _id: event._id,
    numero: event.numero,
    tipo: event.tipo,
    paymentStatus: event.paymentStatus,
    closureGroupId: event.closureGroupId,
    contentType: event.contentType,
    price: event.price,
    local: event.local,
    imageUrl: event.imageUrl,
    createdAt: event.createdAt,
    horaServicoDigitos: event.horaServicoDigitos,
    orderId: event.order?._id || '',
  });

  const handleEditTrackEvent = (event: ICacambaTrackEvent) => {
    onEditCacamba({
      cacamba: buildCacambaFromTrackEvent(event),
      orderType: event.order?.type || event.tipo,
      onUpdated: refreshOpenTrack,
    });
  };

  const handleDeleteTrackEvent = (event: ICacambaTrackEvent) => {
    onDeleteCacamba(event._id, event.numero, refreshOpenTrack, { skipRefresh: true });
  };

  const searchClientHistory = async (clientId: string, clientName?: string) => {
    const normalizedClientId = clientId.trim();
    setClientHistoryOpen(true);
    setClientHistoryOrders([]);
    setClientHistoryError(null);
    if (clientName !== undefined) setSelectedHistoryClientName(clientName);

    if (!normalizedClientId) {
      setClientHistoryLoading(false);
      setClientHistoryError('Selecione um cliente para buscar o histórico.');
      return;
    }

    setClientHistoryLoading(true);
    setSelectedHistoryClientId(normalizedClientId);

    try {
      const response = await authenticatedFetch(
        `${apiUrl}/clients/${encodeURIComponent(normalizedClientId)}/orders`,
      );
      const data = await response.json();
      if (!response.ok) {
        setClientHistoryError(data?.message || 'Erro ao buscar histórico do cliente.');
        return;
      }
      setClientHistoryOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setClientHistoryError(error instanceof Error ? error.message : 'Erro ao buscar histórico do cliente.');
    } finally {
      setClientHistoryLoading(false);
    }
  };

  const handleClientHistorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchClientHistory(selectedHistoryClientId, selectedHistoryClientName);
  };

  return (
    <OrdersPage>
      <SectionContainer>
        <AcompanhamentoToolbar>
          <OrdersSectionTitle>Acompanhamentos</OrdersSectionTitle>
          <SummaryBadge>TOTAL: {items.length}</SummaryBadge>
        </AcompanhamentoToolbar>

        <form onSubmit={handleTrackSubmit} className="mb-4 grid grid-cols-[minmax(220px,360px)_auto] items-end gap-[0.65rem] max-[560px]:grid-cols-1">
          <AcompanhamentoFilterField>
            <AcompanhamentoFilterLabel htmlFor="historico-cacamba-select">Histórico da caçamba</AcompanhamentoFilterLabel>
            {SelectComponent ? (
              <SelectComponent
                inputId="historico-cacamba-select"
                options={historyOptions}
                value={selectedHistoryOption}
                onChange={handleHistoryOptionChange}
                placeholder="Selecione ou pesquise a caçamba..."
                isSearchable
                isClearable
                isLoading={numbersLoading}
                loadingMessage={() => 'Carregando caçambas...'}
                noOptionsMessage={() => (numbersError ? numbersError : 'Nenhuma caçamba registrada.')}
                menuPortalTarget={document.body}
                styles={historySelectStyles}
              />
            ) : (
              <AcompanhamentoSortSelect
                id="historico-cacamba-select"
                value={selectedHistoryNumero}
                onChange={(event) => {
                  setSelectedHistoryNumero(event.target.value);
                  setTrackError(null);
                }}
                disabled={numbersLoading}
              >
                <option value="">
                  {numbersLoading ? 'Carregando caçambas...' : numbersError || 'Selecione...'}
                </option>
                {historyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AcompanhamentoSortSelect>
            )}
            {numbersError && <span className="text-[0.76rem] font-bold text-red-700">{numbersError}</span>}
          </AcompanhamentoFilterField>
          <ActionButton type="submit" disabled={trackLoading || numbersLoading || !selectedHistoryNumero}>
            {trackLoading ? 'Buscando...' : 'Buscar histórico da caçamba'}
          </ActionButton>
        </form>

        <form onSubmit={handleClientHistorySubmit} className="mb-4 grid grid-cols-[minmax(220px,360px)_auto] items-end gap-[0.65rem] max-[560px]:grid-cols-1">
          <AcompanhamentoFilterField>
            <AcompanhamentoFilterLabel htmlFor="historico-cliente-select">Histórico do cliente</AcompanhamentoFilterLabel>
            {SelectComponent ? (
              <SelectComponent
                inputId="historico-cliente-select"
                options={clientHistoryOptions}
                value={selectedClientHistoryOption}
                onChange={handleClientHistoryOptionChange}
                placeholder="Selecione ou pesquise o cliente..."
                isSearchable
                isClearable
                isLoading={clientsLoading}
                loadingMessage={() => 'Carregando clientes...'}
                noOptionsMessage={() => (clientsError ? clientsError : 'Nenhum cliente registrado.')}
                menuPortalTarget={document.body}
                styles={historySelectStyles}
              />
            ) : (
              <AcompanhamentoSortSelect
                id="historico-cliente-select"
                value={selectedHistoryClientId}
                onChange={(event) => {
                  const option = clientHistoryOptions.find((item) => item.value === event.target.value);
                  setSelectedHistoryClientId(option?.value || '');
                  setSelectedHistoryClientName(option?.label || '');
                  setClientHistoryError(null);
                }}
                disabled={clientsLoading}
              >
                <option value="">
                  {clientsLoading ? 'Carregando clientes...' : clientsError || 'Selecione...'}
                </option>
                {clientHistoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AcompanhamentoSortSelect>
            )}
            {clientsError && <span className="text-[0.76rem] font-bold text-red-700">{clientsError}</span>}
          </AcompanhamentoFilterField>
          <ActionButton type="submit" disabled={clientHistoryLoading || clientsLoading || !selectedHistoryClientId}>
            {clientHistoryLoading ? 'Buscando...' : 'Buscar histórico do cliente'}
          </ActionButton>
        </form>

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
                  ? formatDriverName((order.motorista as { username?: string }).username, '')
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
                        <InfoLabel>Ordem de serviço digital</InfoLabel>
                        <InfoValue className="font-bold text-red-600">{order.orderNumber ?? '-'}</InfoValue>
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
                        data-testid={`acompanhamento-track-${cacamba._id}`}
                        onClick={() => void searchTrack(numero)}
                      >
                        Ver histórico da caçamba
                      </ActionButton>
                      <ActionButton
                        type="button"
                        data-testid={`acompanhamento-client-history-${cacamba._id}`}
                        onClick={() => {
                          if (!order.clientId) {
                            setSelectedHistoryClientName(order.clientName || '');
                            setClientHistoryOpen(true);
                            setClientHistoryOrders([]);
                            setClientHistoryError('Cliente sem ID vinculado para buscar histórico.');
                            return;
                          }
                          void searchClientHistory(String(order.clientId), order.clientName || '');
                        }}
                      >
                        Ver histórico do cliente
                      </ActionButton>
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

      <CacambaTrackModal
        open={trackOpen}
        loading={trackLoading}
        error={trackError}
        track={trackResult}
        onClose={() => setTrackOpen(false)}
        onOpenImage={onOpenImage}
        onEditEvent={handleEditTrackEvent}
        onDeleteEvent={handleDeleteTrackEvent}
      />
      <ClientHistoryModal
        open={clientHistoryOpen}
        loading={clientHistoryLoading}
        error={clientHistoryError}
        clientName={selectedHistoryClientName}
        orders={clientHistoryOrders}
        onClose={() => setClientHistoryOpen(false)}
        onOpenImage={onOpenImage}
      />
    </OrdersPage>
  );
};
