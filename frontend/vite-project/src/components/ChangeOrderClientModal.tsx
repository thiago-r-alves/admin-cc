import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IClient, IOrder } from '../interfaces';
import type { Props as ReactSelectProps, SingleValue, StylesConfig } from 'react-select';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.62);
`;

const Modal = styled.div`
  width: min(760px, 96vw);
  max-height: min(90dvh, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);

  @media (max-width: 768px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
`;

const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.55rem;
  line-height: 1;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const Form = styled.form`
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
`;

const Body = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem;
`;

const Intro = styled.p`
  margin: 0 0 1rem;
  color: #4b5563;
  line-height: 1.5;
`;

const WarningBox = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fff1f2;
  padding: 0.9rem 1rem;
  color: #9f1239;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.5;
`;

const Section = styled.section`
  display: grid;
  gap: 0.85rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const NativeSelect = styled.select`
  width: 100%;
  min-height: 40px;
  padding: 0.55rem 0.65rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 8px;
  padding: 1rem;
  background: #fffafa;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 0.7rem;
  color: #6b1f1f;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SummaryLine = styled.div`
  color: #374151;
  font-size: 0.88rem;
  line-height: 1.55;

  strong {
    color: #111827;
  }
`;

const Footer = styled.div`
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #fee2e2;
  background: #fffafa;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
  }
`;

const FooterButton = styled.button`
  min-width: 150px;
  min-height: 42px;
  padding: 0.7rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;

  @media (max-width: 560px) {
    width: 100%;
  }
`;

const CancelButton = styled(FooterButton)`
  border: 1px solid #d8b4b4;
  background: #ffffff;
  color: #6b1f1f;
`;

const SubmitButton = styled(FooterButton)`
  border: 1px solid #e30613;
  background: #e30613;
  color: #ffffff;

  &:disabled {
    background: #f39aa0;
    border-color: #f39aa0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  margin: 1rem 0 0;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 700;
`;

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
