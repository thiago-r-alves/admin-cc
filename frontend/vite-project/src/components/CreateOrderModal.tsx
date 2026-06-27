import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IDriver, IClient, OrderType } from '../interfaces';
import type {
  FilterOptionOption,
  Props as ReactSelectProps,
  SingleValue,
  StylesConfig,
} from 'react-select';
import { twComponent } from '../utils/twComponent';

const fieldClass = 'box-border min-h-[38px] w-full rounded-ui-md border border-brand-border bg-white px-[0.65rem] py-[0.55rem] text-[0.9rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';
const footerButtonClass = 'min-h-[42px] min-w-[150px] cursor-pointer rounded-ui-md px-4 py-[0.7rem] text-[0.82rem] font-black uppercase tracking-[0.04em] transition-colors duration-[180ms] max-[560px]:w-full';

const ModalOverlay = twComponent('div', 'fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-[max(16px,env(safe-area-inset-top))_max(16px,env(safe-area-inset-right))_max(16px,env(safe-area-inset-bottom))_max(16px,env(safe-area-inset-left))] max-[768px]:items-stretch max-[768px]:p-0');
const ModalContent = twComponent('div', 'flex max-h-[min(90dvh,820px)] w-[min(960px,94vw)] flex-col overflow-hidden rounded-lg border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[768px]:h-[100dvh] max-[768px]:max-h-[100dvh] max-[768px]:w-screen max-[768px]:rounded-none');
const ModalHeader = twComponent('div', 'flex flex-none items-center justify-between gap-4 border-b border-red-100 bg-white px-5 py-4');
const TitleWrap = twComponent('div', 'flex items-center gap-3');
const TitleAccent = twComponent('span', 'h-7 w-1 rounded-full bg-brand');
const Title = twComponent('h2', 'm-0 text-[1.2rem] font-black text-gray-950');
const CloseButton = twComponent('button', 'h-[34px] w-[34px] cursor-pointer rounded-ui-lg border-0 bg-transparent text-[1.55rem] leading-none text-gray-500 transition-colors duration-[180ms] hover:bg-brand-soft hover:text-brand');
const Form = twComponent('form', 'flex min-h-0 flex-auto flex-col');
const ModalBody = twComponent('div', 'flex-auto overflow-y-auto p-5 [-webkit-overflow-scrolling:touch]');
const IntroText = twComponent('p', 'm-0 mb-4 text-[0.88rem] text-gray-500');
const PresetNotice = twComponent('div', 'm-0 mb-4 rounded-ui-lg border border-red-200 bg-[#fffafa] px-4 py-[0.85rem] text-[0.88rem] leading-[1.45] text-gray-700 [&_strong]:text-red-900');
const FormGrid = twComponent('div', 'grid grid-cols-2 gap-5 max-[860px]:grid-cols-1');
const FormSection = twComponent('section', 'min-w-0');
const SectionTitle = twComponent('h3', 'm-0 mb-4 flex items-center gap-2 text-[0.82rem] font-black uppercase tracking-[0.02em] text-gray-700');
const SectionIcon = twComponent('span', 'inline-flex items-center text-brand');
const FieldGrid = twComponent('div', 'grid grid-cols-2 gap-[0.9rem] max-[560px]:grid-cols-1');
const Field = twComponent<'div', { $span?: 1 | 2 }>('div', 'min-w-0 max-[560px]:col-span-1', ({ $span }) => ($span === 2 ? 'col-span-2' : 'col-span-1'));
const Label = twComponent('label', 'mb-[0.35rem] block text-[0.72rem] font-black tracking-[0.02em] text-gray-600');
const Input = twComponent('input', fieldClass);
const Select = twComponent('select', fieldClass);
const ServiceTypeGrid = twComponent('div', 'grid grid-cols-2 gap-[0.65rem] max-[560px]:grid-cols-1');
const ServiceTypeOption = twComponent<'button', { $tone: OrderType; $selected: boolean }>('button', 'flex min-h-[94px] w-full cursor-pointer flex-col items-start justify-between gap-[0.7rem] rounded-ui-lg border p-3 text-left transition-[background,border-color,box-shadow,color] duration-[180ms] focus-visible:outline-none', ({ $tone, $selected }) => {
  if (!$selected) {
    return $tone === 'entrega'
      ? 'border-brand-border bg-white text-gray-700 hover:border-green-500 hover:bg-green-50 focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-200'
      : 'border-brand-border bg-white text-gray-700 hover:border-red-500 hover:bg-brand-soft focus-visible:border-red-500 focus-visible:ring-[3px] focus-visible:ring-red-200';
  }

  return $tone === 'entrega'
    ? 'border-green-500 bg-green-50 text-green-950 focus-visible:ring-[3px] focus-visible:ring-green-200'
    : 'border-red-500 bg-brand-soft text-red-950 focus-visible:ring-[3px] focus-visible:ring-red-200';
});
const ServiceTypeHeader = twComponent('span', 'flex w-full items-center justify-between gap-2');
const ServiceTypeName = twComponent<'span', { $tone: OrderType }>('span', 'inline-flex min-h-6 items-center rounded-ui-md border px-2 py-[0.2rem] text-[0.78rem] font-black uppercase', ({ $tone }) =>
  $tone === 'entrega' ? 'border-green-200 bg-green-100 text-green-700' : 'border-red-200 bg-red-100 text-red-700',
);
const ServiceTypeDot = twComponent<'span', { $tone: OrderType }>('span', 'h-2.5 w-2.5 flex-none rounded-full', ({ $tone }) =>
  $tone === 'entrega' ? 'bg-green-500 shadow-[0_0_0_3px_#dcfce7]' : 'bg-red-500 shadow-[0_0_0_3px_#fee2e2]',
);
const ServiceTypeDescription = twComponent('span', 'text-[0.82rem] font-bold leading-[1.35] text-gray-600');
const FetchingHint = twComponent('small', 'mt-[0.35rem] block text-xs text-gray-500');
const MapFrameWrap = twComponent('div', 'relative min-h-[170px] overflow-hidden rounded-ui-md border border-gray-200 bg-[#eef0f3]');
const MapFrame = twComponent('iframe', 'block h-[190px] w-full border-0');
const MapPlaceholder = twComponent('div', 'flex min-h-[170px] items-center justify-center p-4 text-center text-[0.88rem] text-gray-500');
const MapBadge = twComponent('a', 'absolute bottom-[18px] left-1/2 inline-flex -translate-x-1/2 items-center gap-[0.4rem] rounded-full bg-white px-[0.8rem] py-[0.55rem] text-[0.78rem] font-black text-gray-700 no-underline shadow-[0_8px_18px_rgba(15,23,42,0.16)] [&_span]:text-brand');
const ModalFooter = twComponent('div', 'flex flex-none justify-end gap-3 border-t border-red-100 bg-[#fffafa] px-5 py-4 max-[560px]:flex-col-reverse');
const SubmitButton = twComponent('button', `${footerButtonClass} border border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover`);
const CancelButton = twComponent('button', `${footerButtonClass} border border-brand-border bg-white text-[#6b1f1f] hover:border-brand hover:text-brand`);
const ErrorMessage = twComponent('p', 'm-0 mt-4 text-sm font-bold text-red-500');

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
    if (orderType === 'entrega' && (!Number.isFinite(parsedCacambaPrice) || parsedCacambaPrice <= 0)) {
      setError('Informe o valor da caçamba para pedidos de entrega.');
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
        ...(Number.isFinite(parsedCacambaPrice) && parsedCacambaPrice > 0 ? { cacambaPrice: parsedCacambaPrice } : {}),
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
                Confira os dados da entrega e informe motorista e placa.
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
                        <div
                          className="mb-[0.35rem] block text-[0.72rem] font-black tracking-[0.02em] text-gray-600"
                          id="order-type-label"
                        >
                          Tipo de Serviço
                        </div>
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

                    {form.type && (
                      <Field>
                        <Label>Valor da Caçamba (R$)</Label>
                        <Input
                          type="text"
                          value={form.cacambaPrice}
                          onChange={e => setForm(f => ({ ...f, cacambaPrice: e.target.value }))}
                          placeholder="Ex: 180,00"
                          inputMode="decimal"
                          required={form.type === 'entrega'}
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
