import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IClient, IOrder } from '../interfaces';
import type { Props as ReactSelectProps, SingleValue, StylesConfig } from 'react-select';
import { twComponent } from '../utils/twComponent';

const footerButtonClass = 'min-h-[42px] min-w-[150px] cursor-pointer rounded-ui-md px-4 py-[0.7rem] text-[0.82rem] font-black uppercase max-[560px]:w-full';

const Overlay = twComponent('div', 'fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-4');
const Modal = twComponent('div', 'flex max-h-[min(90dvh,820px)] w-[min(760px,96vw)] flex-col overflow-hidden rounded-[10px] border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[768px]:h-[100dvh] max-[768px]:max-h-[100dvh] max-[768px]:w-screen max-[768px]:rounded-none');
const Header = twComponent('div', 'flex flex-none items-center justify-between gap-4 border-b border-red-100 px-5 py-4');
const Title = twComponent('h2', 'm-0 text-[1.1rem] font-black text-gray-950');
const CloseButton = twComponent('button', 'h-[34px] w-[34px] cursor-pointer rounded-ui-lg border-0 bg-transparent text-[1.55rem] leading-none text-gray-500 hover:bg-brand-soft hover:text-brand');
const Form = twComponent('form', 'flex min-h-0 flex-auto flex-col');
const Body = twComponent('div', 'min-h-0 flex-auto overflow-y-auto p-5 [-webkit-overflow-scrolling:touch]');
const Intro = twComponent('p', 'm-0 mb-4 leading-normal text-gray-600');
const WarningBox = twComponent('div', 'mb-4 rounded-lg border border-red-300 bg-brand-soft px-4 py-[0.9rem] text-[0.88rem] font-bold leading-normal text-rose-800');
const Section = twComponent('section', 'grid gap-[0.85rem]');
const Label = twComponent('label', 'mb-[0.35rem] block text-[0.72rem] font-black uppercase tracking-[0.02em] text-gray-600');
const NativeSelect = twComponent('select', 'min-h-10 w-full rounded-ui-md border border-brand-border bg-white px-[0.65rem] py-[0.55rem] text-[0.9rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus');
const SummaryGrid = twComponent('div', 'grid grid-cols-2 gap-4 max-[700px]:grid-cols-1');
const SummaryCard = twComponent('div', 'rounded-lg border border-red-100 bg-[#fffafa] p-4');
const SummaryTitle = twComponent('h3', 'm-0 mb-[0.7rem] text-[0.82rem] font-black uppercase tracking-[0.04em] text-[#6b1f1f]');
const SummaryLine = twComponent('div', 'text-[0.88rem] leading-[1.55] text-gray-700 [&_strong]:text-gray-950');
const Footer = twComponent('div', 'flex flex-none justify-end gap-3 border-t border-red-100 bg-[#fffafa] px-5 py-4 max-[560px]:flex-col-reverse');
const CancelButton = twComponent('button', `${footerButtonClass} border border-brand-border bg-white text-[#6b1f1f]`);
const SubmitButton = twComponent('button', `${footerButtonClass} border border-brand bg-brand text-white disabled:cursor-not-allowed disabled:border-[#f39aa0] disabled:bg-[#f39aa0]`);
const ErrorMessage = twComponent('p', 'm-0 mt-4 text-sm font-bold text-red-500');

type ClientOption = { value: string; label: string; clientName: string };
type ClientSelectComponent = React.ComponentType<ReactSelectProps<ClientOption, false>>;

interface ChangeOrderClientModalProps {
  apiUrl: string;
  order: IOrder;
  onClose: () => void;
  onChanged: (payload: { order: IOrder; migration?: Record<string, number> }) => void;
}

const formatContact = (clientLike: Partial<IClient>) =>
  [clientLike.contactName, clientLike.contactNumber].filter(Boolean).join(' - ') || '-';

const formatAddress = (clientLike: Partial<IClient>) =>
  [clientLike.address, clientLike.addressNumber, clientLike.neighborhood, clientLike.city, clientLike.cep]
    .filter(Boolean)
    .join(', ') || '-';

const ChangeOrderClientModal: React.FC<ChangeOrderClientModalProps> = ({
  apiUrl,
  order,
  onClose,
  onChanged,
}) => {
  const [SelectComponent, setSelectComponent] = useState<ClientSelectComponent | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fallbackClientSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let mounted = true;
    import('react-select')
      .then((mod) => {
        if (mounted) setSelectComponent(mod.default || mod);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!SelectComponent) fallbackClientSelectRef.current?.focus();
  }, [SelectComponent]);

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Não foi possível carregar os clientes.');
        return;
      }

      const data = await response.json();
      setClients(data);
    };

    fetchClients().catch(() => {
      setError('Não foi possível carregar os clientes.');
    });
  }, [apiUrl]);

  const clientOptions = useMemo<ClientOption[]>(
    () =>
      clients
        .filter((client) => client._id !== order.clientId)
        .map((client) => ({
          value: client._id,
          clientName: client.clientName,
          label: [client.clientName, client.cnpjCpf].filter(Boolean).join(' • '),
        })),
    [clients, order.clientId],
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const selectedOption = useMemo(
    () => clientOptions.find((option) => option.value === selectedClientId) || null,
    [clientOptions, selectedClientId],
  );

  const selectStyles = useMemo<StylesConfig<ClientOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderColor: state.isFocused ? '#e30613' : '#d8b4b4',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(227, 6, 19, 0.12)' : 'none',
        borderRadius: 4,
        fontSize: '0.9rem',
        '&:hover': { borderColor: '#e30613' },
      }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }),
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientId) {
      setError('Selecione o cliente correto para continuar.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/orders/${order._id}/change-client`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Erro ao corrigir cliente do pedido.');
        return;
      }

      onChanged(data);
      onClose();
    } catch {
      setError('Erro ao corrigir cliente do pedido.');
    } finally {
      setSaving(false);
    }
  };

  const handleClientChangeRs = (option: SingleValue<ClientOption>) => {
    setSelectedClientId(option?.value || '');
    setError('');
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()} data-testid="change-order-client-modal">
        <Header>
          <Title>Corrigir cliente do pedido #{order.orderNumber ?? '-'}</Title>
          <CloseButton type="button" aria-label="Fechar modal" onClick={onClose}>
            ×
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Body>
            <Intro>
              Escolha o cliente correto. Essa ação transfere o pedido e também move os dados de fechamento e faturamento vinculados a ele.
            </Intro>

            <WarningBox>
              Valores, grupos de fechamento, notas pendentes e caçambas pagas deste pedido passarão a compor o novo cliente selecionado.
            </WarningBox>

            <Section>
              <div>
                <Label>Cliente correto</Label>
                {SelectComponent ? (
                  <SelectComponent
                    inputId="change-order-client-select"
                    options={clientOptions}
                    value={selectedOption}
                    onChange={handleClientChangeRs}
                    placeholder="Digite nome, CPF ou CNPJ..."
                    isSearchable
                    isClearable
                    autoFocus
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                ) : (
                  <NativeSelect
                    ref={fallbackClientSelectRef}
                    value={selectedClientId}
                    onChange={(event) => {
                      setSelectedClientId(event.target.value);
                      setError('');
                    }}
                  >
                    <option value="">Selecione...</option>
                    {clientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </div>

              <SummaryGrid>
                <SummaryCard>
                  <SummaryTitle>Cliente atual</SummaryTitle>
                  <SummaryLine><strong>Nome:</strong> {order.clientName || '-'}</SummaryLine>
                  <SummaryLine><strong>CNPJ/CPF:</strong> {order.cnpjCpf || '-'}</SummaryLine>
                  <SummaryLine><strong>Contato:</strong> {formatContact(order)}</SummaryLine>
                  <SummaryLine><strong>Endereço:</strong> {formatAddress(order)}</SummaryLine>
                </SummaryCard>

                <SummaryCard>
                  <SummaryTitle>Novo cliente</SummaryTitle>
                  <SummaryLine><strong>Nome:</strong> {selectedClient?.clientName || '-'}</SummaryLine>
                  <SummaryLine><strong>CNPJ/CPF:</strong> {selectedClient?.cnpjCpf || '-'}</SummaryLine>
                  <SummaryLine><strong>Contato:</strong> {formatContact(selectedClient || {})}</SummaryLine>
                  <SummaryLine><strong>Endereço:</strong> {formatAddress(selectedClient || {})}</SummaryLine>
                </SummaryCard>
              </SummaryGrid>

              {error && <ErrorMessage>{error}</ErrorMessage>}
            </Section>
          </Body>

          <Footer>
            <CancelButton type="button" onClick={onClose}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={!selectedClientId || saving}>
              {saving ? 'Salvando...' : 'Confirmar correção'}
            </SubmitButton>
          </Footer>
        </Form>
      </Modal>
    </Overlay>
  );
};

export default ChangeOrderClientModal;
