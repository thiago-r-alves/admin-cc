import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IDriver, IClient, OrderType } from '../interfaces';
import type {
  FilterOptionOption,
  Props as ReactSelectProps,
  SingleValue,
  StylesConfig,
} from 'react-select';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(17, 24, 39, 0.62);

  @media (max-width: 768px) {
    align-items: stretch;
    padding: 0;
  }
`;

const ModalContent = styled.div`
  width: min(960px, 94vw);
  max-height: min(90dvh, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);

  @media (max-width: 768px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleAccent = styled.span`
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: #e30613;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.2rem;
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
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const Form = styled.form`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
`;

const ModalBody = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.25rem;
  -webkit-overflow-scrolling: touch;
`;

const IntroText = styled.p`
  margin: 0 0 1rem;
  color: #6b7280;
  font-size: 0.88rem;
`;

const PresetNotice = styled.div`
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fffafa;
  color: #374151;
  font-size: 0.88rem;
  line-height: 1.45;

  strong {
    color: #991b1b;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.section`
  min-width: 0;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const SectionIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: #e30613;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div<{ $span?: 1 | 2 }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};

  @media (max-width: 560px) {
    grid-column: span 1;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  box-sizing: border-box;
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

const Select = styled.select`
  width: 100%;
  min-height: 38px;
  box-sizing: border-box;
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

const ServiceTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const ServiceTypeOption = styled.button<{ $tone: OrderType; $selected: boolean }>`
  width: 100%;
  min-height: 94px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.75rem;
  border: 1px solid
    ${({ $selected, $tone }) => {
      if (!$selected) return '#d8b4b4';
      return $tone === 'entrega' ? '#22c55e' : '#ef4444';
    }};
  border-radius: 6px;
  background: ${({ $selected, $tone }) => {
    if (!$selected) return '#ffffff';
    return $tone === 'entrega' ? '#f0fdf4' : '#fff1f2';
  }};
  color: ${({ $selected, $tone }) => {
    if (!$selected) return '#374151';
    return $tone === 'entrega' ? '#14532d' : '#7f1d1d';
  }};
  cursor: pointer;
  text-align: left;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;

  &:hover {
    border-color: ${({ $tone }) => ($tone === 'entrega' ? '#22c55e' : '#ef4444')};
    background: ${({ $tone }) => ($tone === 'entrega' ? '#f0fdf4' : '#fff1f2')};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ $tone }) => ($tone === 'entrega' ? '#22c55e' : '#ef4444')};
    box-shadow: 0 0 0 3px
      ${({ $tone }) => ($tone === 'entrega' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)')};
  }
`;

const ServiceTypeHeader = styled.span`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const ServiceTypeName = styled.span<{ $tone: OrderType }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0.2rem 0.5rem;
  border: 1px solid ${({ $tone }) => ($tone === 'entrega' ? '#bbf7d0' : '#fecaca')};
  border-radius: 4px;
  background: ${({ $tone }) => ($tone === 'entrega' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $tone }) => ($tone === 'entrega' ? '#166534' : '#b91c1c')};
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const ServiceTypeDot = styled.span<{ $tone: OrderType }>`
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'entrega' ? '#22c55e' : '#ef4444')};
  box-shadow: 0 0 0 3px ${({ $tone }) => ($tone === 'entrega' ? '#dcfce7' : '#fee2e2')};
`;

const ServiceTypeDescription = styled.span`
  color: #4b5563;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
`;

const FetchingHint = styled.small`
  display: block;
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.75rem;
`;

const MapFrameWrap = styled.div`
  position: relative;
  min-height: 170px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #eef0f3;
`;

const MapFrame = styled.iframe`
  width: 100%;
  height: 190px;
  display: block;
  border: 0;
`;

const MapPlaceholder = styled.div`
  min-height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #6b7280;
  text-align: center;
  font-size: 0.88rem;
`;

const MapBadge = styled.a`
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);

  span {
    color: #e30613;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex: 0 0 auto;
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
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  @media (max-width: 560px) {
    width: 100%;
  }
`;

const SubmitButton = styled(FooterButton)`
  border: 1px solid #e30613;
  background: #e30613;
  color: #ffffff;

  &:hover {
    background: #c9000b;
    border-color: #c9000b;
  }
`;

const CancelButton = styled(FooterButton)`
  border: 1px solid #d8b4b4;
  background: #ffffff;
  color: #6b1f1f;

  &:hover {
    border-color: #e30613;
    color: #e30613;
  }
`;

const ErrorMessage = styled.p`
  margin: 1rem 0 0;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 700;
`;

export type CreateOrderPreset = {
  mode: 'withdrawal';
  clientId: string;
  clientName: string;
  cnpjCpf?: string;
  contactName?: string;
  contactNumber?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  cep?: string;
  plannedWithdrawalCacambaIds: string[];
  cacambaNumbers: string[];
};

interface CreateOrderModalProps {
  onClose: () => void;
  onOrderCreated: () => void;
  drivers: IDriver[];
  initialPreset?: CreateOrderPreset | null;
}

type ClientOption = { value: string; label: string; clientName: string };
type SelectComponentType = React.ComponentType<ReactSelectProps<ClientOption, false>>;

type CreateOrderForm = {
  clientName: string;
  cnpjCpf: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  city: string;
  cep: string;
  type: OrderType | '';
  motorista: string;
  placa: string;
  cacambaPrice: string;
};

const emptyForm: CreateOrderForm = {
  clientName: '',
  cnpjCpf: '',
  contactName: '',
  contactNumber: '',
  neighborhood: '',
  address: '',
  addressNumber: '',
  city: '',
  cep: '',
  type: '',
  motorista: '',
  placa: '',
  cacambaPrice: '',
};

const formFromPreset = (preset: CreateOrderPreset): CreateOrderForm => ({
  clientName: preset.clientName || '',
  cnpjCpf: preset.cnpjCpf ?? '',
  contactName: preset.contactName || '',
  contactNumber: preset.contactNumber || '',
  neighborhood: preset.neighborhood || '',
  address: preset.address || '',
  addressNumber: preset.addressNumber || '',
  city: preset.city ?? '',
  cep: preset.cep ?? '',
  type: 'retirada',
  motorista: '',
  placa: '',
  cacambaPrice: '',
});

const serviceTypeOptions: Array<{
  value: OrderType;
  title: string;
  description: string;
}> = [
  {
    value: 'entrega',
    title: 'Entrega',
    description: 'Colocar caçamba no cliente',
  },
  {
    value: 'retirada',
    title: 'Retirada',
    description: 'Retirar caçamba do cliente',
  },
];

const DocumentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 13h6M10 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onOrderCreated, drivers, initialPreset }) => {
  const isPresetWithdrawal = initialPreset?.mode === 'withdrawal';
  const [SelectComponent, setSelectComponent] = useState<SelectComponentType | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialPreset?.clientId || '');
  const [form, setForm] = useState<CreateOrderForm>(() =>
    initialPreset ? formFromPreset(initialPreset) : emptyForm,
  );
  const [error, setError] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const fallbackClientSelectRef = useRef<HTMLSelectElement>(null);
  const lastCepRef = useRef<string>('');
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let mounted = true;
    import('react-select').then(mod => {
      if (mounted) setSelectComponent(() => mod.default as SelectComponentType);
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!SelectComponent) fallbackClientSelectRef.current?.focus();
  }, [SelectComponent]);

  useEffect(() => {
    if (!initialPreset) return;
    setSelectedClientId(initialPreset.clientId);
    setForm(formFromPreset(initialPreset));
  }, [initialPreset]);

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    };

    fetchClients();
  }, [apiUrl]);

  const clientOptions = useMemo<ClientOption[]>(
    () =>
      clients.map(c => ({
        value: c._id,
        clientName: c.clientName,
        label: [c.clientName, c.cnpjCpf].filter(Boolean).join(' • '),
      })),
    [clients]
  );

  const selectedClientOption = useMemo(
    () => clientOptions.find(o => o.value === selectedClientId) || null,
    [clientOptions, selectedClientId]
  );

  const mapAddress = useMemo(
    () =>
      [form.address, form.addressNumber, form.neighborhood, form.city, form.cep, 'Brasil']
        .filter(Boolean)
        .join(', '),
    [form.address, form.addressNumber, form.neighborhood, form.city, form.cep]
  );
  const hasMapAddress = Boolean(form.address && form.city);
  const encodedMapAddress = encodeURIComponent(mapAddress);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedMapAddress}&z=15&output=embed`;
  const mapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapAddress}`;

  const setSelectedClientById = (clientId: string) => {
    if (isPresetWithdrawal) return;
    setSelectedClientId(clientId);
    setError('');

    if (!clientId) {
      setForm(emptyForm);
      return;
    }

    const selectedClient = clients.find(c => c._id === clientId);
    if (!selectedClient) return;

    setForm(prev => ({
      ...prev,
      clientName: selectedClient.clientName || '',
      cnpjCpf: selectedClient.cnpjCpf ?? '',
      contactName: selectedClient.contactName || '',
      contactNumber: selectedClient.contactNumber || '',
      neighborhood: selectedClient.neighborhood || '',
      address: selectedClient.address || '',
      addressNumber: selectedClient.addressNumber || '',
      city: selectedClient.city ?? '',
      cep: selectedClient.cep ?? '',
    }));
  };

  const handleClientChangeRs = (opt: SingleValue<ClientOption>) => {
    setSelectedClientById(opt?.value || '');
  };

  const selectOrderType = (type: OrderType) => {
    setForm(prev => ({
      ...prev,
      type,
      cacambaPrice: type === 'retirada' ? prev.cacambaPrice : '',
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Por favor, selecione um cliente.');
      return;
    }
    if (!form.type) {
      setError('Selecione Entrega ou Retirada para continuar.');
      return;
    }
    const orderType = form.type;
    const parsedCacambaPrice = Number(form.cacambaPrice.replace(',', '.'));
    if (orderType === 'retirada' && (!Number.isFinite(parsedCacambaPrice) || parsedCacambaPrice <= 0)) {
      setError('Informe o valor da caçamba para pedidos de retirada.');
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientId: selectedClientId,
        clientName: form.clientName,
        cnpjCpf: form.cnpjCpf,
        city: form.city,
        cep: form.cep,
        contactName: form.contactName,
        contactNumber: form.contactNumber,
        neighborhood: form.neighborhood,
        address: form.address,
        addressNumber: form.addressNumber,
        type: orderType,
        priority: 0,
        placa: form.placa,
        motorista: form.motorista || undefined,
        ...(orderType === 'retirada' ? { cacambaPrice: parsedCacambaPrice } : {}),
        ...(isPresetWithdrawal ? { plannedWithdrawalCacambaIds: initialPreset?.plannedWithdrawalCacambaIds || [] } : {}),
      }),
    });

    if (response.ok) {
      onOrderCreated();
      onClose();
      return;
    }

    const errorData = await response.json();
    setError(errorData.message || 'Erro ao criar pedido.');
  };

  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const maskCep = (digits: string) => (digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5, 8)}` : digits);

  const fetchCep = useCallback(async (cepDigits: string) => {
    if (!cepDigits || cepDigits.length !== 8) return;
    if (lastCepRef.current === cepDigits) return;
    lastCepRef.current = cepDigits;

    try {
      setIsFetchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();

      if (data && !data.erro) {
        setForm(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
        }));
      }
    } catch {
      // CEP autocomplete is best-effort; manual entry remains available.
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value).slice(0, 8);
    setForm(prev => ({ ...prev, cep: maskCep(digits) }));
    if (digits.length === 8) fetchCep(digits);
  };

  useEffect(() => {
    if (isPresetWithdrawal) return;
    const digits = onlyDigits(form.cep || '');
    if (digits.length === 8) fetchCep(digits);
  }, [form.cep, fetchCep, isPresetWithdrawal]);

  const selectStyles = useMemo<StylesConfig<ClientOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 38,
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

  const filterClientOption = (opt: FilterOptionOption<ClientOption>, raw: string) => {
    const option = opt.data;
    const search = raw.toLowerCase();
    return option.label.toLowerCase().includes(search) || option.clientName.toLowerCase().includes(search);
  };

  const renderClientPicker = () => (
    <Field $span={2}>
      <Label>Buscar Cliente (Autocomplete)</Label>
      {SelectComponent ? (
        <SelectComponent
          options={clientOptions}
          value={selectedClientOption}
          onChange={handleClientChangeRs}
          placeholder="Digite nome, CPF ou CNPJ..."
          isSearchable
          isClearable
          autoFocus
          filterOption={filterClientOption}
          menuPortalTarget={document.body}
          styles={selectStyles}
        />
      ) : (
        <Select
          ref={fallbackClientSelectRef}
          value={selectedClientId}
          onChange={(e) => setSelectedClientById(e.target.value)}
        >
          <option value="">Selecione...</option>
          {clientOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      )}
    </Field>
  );

  const plannedCacambaText =
    initialPreset?.cacambaNumbers.map((numero) => `#${numero}`).join(', ') || '';

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <TitleWrap>
            <TitleAccent />
            <Title>{isPresetWithdrawal ? 'Novo Pedido de Retirada' : 'Novo Pedido'}</Title>
          </TitleWrap>
          <CloseButton type="button" aria-label="Fechar modal" onClick={onClose}>
            ×
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <ModalBody>
            {isPresetWithdrawal && (
              <PresetNotice data-testid="withdrawal-preset-notice">
                Pedido aberto a partir de caçamba(s) vencida(s): <strong>{plannedCacambaText}</strong>.
                Confira os dados da entrega e informe valor, motorista e placa.
              </PresetNotice>
            )}

            {!selectedClientId && !isPresetWithdrawal && (
              <>
                <IntroText>Selecione um cliente para carregar os dados cadastrados e liberar os campos do pedido.</IntroText>
                <FormGrid>
                  <FormSection>
                    <SectionTitle>
                      <SectionIcon><SearchIcon /></SectionIcon>
                      Buscar cliente
                    </SectionTitle>
                    <FieldGrid>{renderClientPicker()}</FieldGrid>
                  </FormSection>
                </FormGrid>
              </>
            )}

            {selectedClientId && (
              <FormGrid>
                <FormSection>
                  <SectionTitle>
                    <SectionIcon><DocumentIcon /></SectionIcon>
                    Dados do Pedido
                  </SectionTitle>
                  <FieldGrid>
                    {!isPresetWithdrawal && renderClientPicker()}

                    <Field $span={2}>
                      <Label>Nome do Cliente</Label>
                      <Input
                        type="text"
                        value={form.clientName}
                        onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                        disabled={isPresetWithdrawal}
                        required
                      />
                    </Field>

                    <Field>
                      <Label>CNPJ/CPF</Label>
                      <Input
                        type="text"
                        value={form.cnpjCpf}
                        onChange={e => setForm(f => ({ ...f, cnpjCpf: e.target.value }))}
                        placeholder="00.000.000/0000-00"
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    <Field>
                      <Label>Telefone/Celular</Label>
                      <Input
                        type="text"
                        value={form.contactNumber}
                        onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    <Field>
                      <Label>Nome do Contato</Label>
                      <Input
                        type="text"
                        value={form.contactName}
                        onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    {!isPresetWithdrawal && (
                      <Field $span={2}>
                        <Label as="div" id="order-type-label">Tipo de Serviço</Label>
                        <ServiceTypeGrid role="radiogroup" aria-labelledby="order-type-label">
                          {serviceTypeOptions.map(option => {
                            const selected = form.type === option.value;
                            return (
                              <ServiceTypeOption
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                data-testid={`order-type-${option.value}`}
                                $tone={option.value}
                                $selected={selected}
                                onClick={() => selectOrderType(option.value)}
                              >
                                <ServiceTypeHeader>
                                  <ServiceTypeName $tone={option.value}>{option.title}</ServiceTypeName>
                                  <ServiceTypeDot $tone={option.value} />
                                </ServiceTypeHeader>
                                <ServiceTypeDescription>{option.description}</ServiceTypeDescription>
                              </ServiceTypeOption>
                            );
                          })}
                        </ServiceTypeGrid>
                      </Field>
                    )}

                    {form.type === 'retirada' && (
                      <Field>
                        <Label>Valor da Caçamba (R$)</Label>
                        <Input
                          type="text"
                          value={form.cacambaPrice}
                          onChange={e => setForm(f => ({ ...f, cacambaPrice: e.target.value }))}
                          placeholder="Ex: 180,00"
                          inputMode="decimal"
                          required
                        />
                      </Field>
                    )}

                    <Field>
                      <Label>Placa</Label>
                      <Select
                        value={form.placa}
                        onChange={e => setForm(prev => ({ ...prev, placa: e.target.value }))}
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="fto2e29">FTO 2E29</option>
                        <option value="etu7g44">ETU 7G44</option>
                      </Select>
                    </Field>
                  </FieldGrid>
                </FormSection>

                <FormSection>
                  <SectionTitle>
                    <SectionIcon><PinIcon /></SectionIcon>
                    Localização e Logística
                  </SectionTitle>
                  <FieldGrid>
                    <Field>
                      <Label>CEP</Label>
                      <Input
                        type="text"
                        value={form.cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={9}
                        inputMode="numeric"
                        disabled={isPresetWithdrawal}
                      />
                      {isFetchingCep && <FetchingHint>Buscando endereço...</FetchingHint>}
                    </Field>

                    <Field>
                      <Label>Rua/Logradouro</Label>
                      <Input
                        type="text"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    <Field>
                      <Label>Número</Label>
                      <Input
                        type="text"
                        value={form.addressNumber}
                        onChange={e => setForm(f => ({ ...f, addressNumber: e.target.value }))}
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    <Field>
                      <Label>Bairro</Label>
                      <Input
                        type="text"
                        value={form.neighborhood}
                        onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                        disabled={isPresetWithdrawal}
                      />
                    </Field>

                    <Field>
                      <Label>Cidade/UF</Label>
                      <Select
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        disabled={isPresetWithdrawal}
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="São José dos Campos">São José dos Campos</option>
                        <option value="Jacareí">Jacareí</option>
                        <option value="Caçapava">Caçapava</option>
                        <option value="Jambeiro">Jambeiro</option>
                        <option value="Monteiro Lobato">Monteiro Lobato</option>
                      </Select>
                    </Field>

                    <Field>
                      <Label>Atribuir Motorista</Label>
                      <Select
                        value={form.motorista}
                        onChange={e => setForm(prev => ({ ...prev, motorista: e.target.value }))}
                        required
                      >
                        <option value="">Selecione...</option>
                        {drivers.map(driver => (
                          <option key={driver._id} value={driver._id}>{driver.username}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field $span={2}>
                      <MapFrameWrap>
                        {hasMapAddress ? (
                          <>
                            <MapFrame
                              title="Mapa do endereço do pedido"
                              src={mapEmbedUrl}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                            <MapBadge href={mapOpenUrl} target="_blank" rel="noreferrer">
                              <span><PinIcon /></span>
                              Local verificado
                            </MapBadge>
                          </>
                        ) : (
                          <MapPlaceholder>
                            Preencha endereço e cidade para visualizar o mapa.
                          </MapPlaceholder>
                        )}
                      </MapFrameWrap>
                    </Field>
                  </FieldGrid>
                </FormSection>
              </FormGrid>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalBody>

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            <SubmitButton type="submit">Criar Pedido</SubmitButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateOrderModal;
