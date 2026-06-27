import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ICity, IClient } from '../interfaces';
import { Button as UIButton, Field as UIField, SelectInput, TextInput } from '../components/ui';
import { twComponent } from '../utils/twComponent';
import { cn } from '../utils/cn';

const ModalOverlay = twComponent('div', 'fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-[max(16px,env(safe-area-inset-top))_max(16px,env(safe-area-inset-right))_max(16px,env(safe-area-inset-bottom))_max(16px,env(safe-area-inset-left))] max-[768px]:items-stretch max-[768px]:p-0');
const ModalContent = twComponent('div', 'flex max-h-[min(90dvh,820px)] w-[min(860px,94vw)] flex-col overflow-hidden rounded-ui-lg border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[768px]:h-[100dvh] max-[768px]:max-h-[100dvh] max-[768px]:w-screen max-[768px]:rounded-none');
const ModalHeader = twComponent('div', 'flex flex-none items-center justify-between gap-4 border-b border-red-200 bg-white px-8 py-[1.15rem] max-[560px]:px-5 max-[560px]:py-4');
const Title = twComponent('h2', 'm-0 text-[1.3rem] font-black text-gray-800');
const CloseButton: React.FC<React.ComponentProps<typeof UIButton>> = ({ className, ...props }) => (
  <UIButton className={cn('h-[34px] min-h-[34px] w-[34px] min-w-[34px] rounded-ui-lg p-0 text-[1.55rem] leading-none', className)} {...props} />
);
const Form = twComponent('form', 'flex min-h-0 flex-auto flex-col');
const ModalBody = twComponent('div', 'flex-auto overflow-y-auto px-8 py-7 [-webkit-overflow-scrolling:touch] max-[560px]:p-5');
const Section = twComponent('section', 'mb-[1.35rem] border-b border-gray-100 pb-[1.35rem] last:mb-0');
const SectionTitle = twComponent('h3', 'm-0 mb-[1.1rem] flex items-center gap-2 text-[0.78rem] font-black uppercase tracking-[0.04em] text-brand');
const FieldGrid = twComponent('div', 'grid grid-cols-2 gap-x-5 gap-y-4 max-[680px]:grid-cols-1');
const GridField = twComponent<'div', { $span?: 1 | 2 }>('div', 'min-w-0 max-[680px]:col-span-1', ({ $span }) => ($span === 2 ? 'col-span-2' : 'col-span-1'));
const FetchingHint = twComponent('small', 'mt-[0.35rem] block text-xs text-gray-500');
const InlineActions = twComponent('div', 'mt-[0.45rem] flex flex-wrap items-center gap-[0.6rem]');
const InlineLinkButton = twComponent('button', 'cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-extrabold text-red-700 underline');
const ResultOverlay = twComponent('div', 'fixed inset-0 z-[1400] flex items-center justify-center bg-[rgba(17,24,39,0.55)] p-4');
const ResultModal = twComponent('div', 'w-[min(440px,94vw)] overflow-hidden rounded-lg border border-red-200 bg-white');
const ResultHeader = twComponent<'div', { $tone: 'success' | 'error' | 'info' }>('div', 'border-b border-l-4 border-b-red-100 px-4 py-[0.9rem] font-extrabold', ({ $tone }) =>
  $tone === 'success' ? 'border-l-green-600' : $tone === 'error' ? 'border-l-red-600' : 'border-l-blue-600',
);
const ResultBody = twComponent('div', 'p-4 text-slate-700');
const ResultFooter = twComponent('div', 'flex justify-end px-4 pb-4 pt-[0.8rem]');
const ResultOkButton = twComponent('button', 'min-h-[38px] min-w-[92px] cursor-pointer rounded-ui-lg border border-gray-300 bg-white font-bold');
const ModalFooter = twComponent('div', 'flex flex-none justify-start gap-3 border-t border-red-200 bg-white px-8 py-4 max-[560px]:flex-col max-[560px]:px-5');
const FooterButton: React.FC<React.ComponentProps<typeof UIButton>> = ({ className, ...props }) => (
  <UIButton className={cn('min-w-[150px] max-[560px]:w-full', className)} {...props} />
);

const SectionIcon = ({ name }: { name: 'client' | 'pin' | 'contact' }) => {
  if (name === 'pin') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'contact') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M16 11l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16v13H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7V5h8v2M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

interface Props {
  onSubmit: (client: Omit<IClient, '_id'>) => void;
  onCancel: () => void;
  initialData?: IClient;
}

const ClientForm: React.FC<Props> = ({ onSubmit, onCancel, initialData }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const [formData, setFormData] = useState({
    clientName: '',
    cnpjCpf: '',
    email: '',
    rgInscricaoEstadual: '',
    city: '',
    cep: '',
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
  });
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cities, setCities] = useState<ICity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cityFeedback, setCityFeedback] = useState<{ tone: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isDeletingCity, setIsDeletingCity] = useState(false);
  const lastCepRef = useRef<string>('');

  type CityMutationResponse = Partial<ICity> & { message?: string };

  const onlyDigits = useCallback((s: string) => s.replace(/\D/g, ''), []);
  const maskCep = (digits: string) =>
    digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5, 8)}` : digits;

  const fetchCep = useCallback(async (cepDigits: string) => {
    if (!cepDigits || cepDigits.length !== 8) return;
    if (lastCepRef.current === cepDigits) return;
    lastCepRef.current = cepDigits;

    try {
      setIsFetchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();

      if (data && !data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
        }));
      }
    } catch {
      // best effort
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    if (!apiUrl || !token) return;
    try {
      setIsLoadingCities(true);
      setCityFeedback(null);
      const response = await fetch(`${apiUrl}/cities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setCityFeedback({ tone: 'error', title: 'Erro', message: 'Nao foi possivel carregar cidades.' });
        return;
      }
      const data = (await response.json()) as ICity[];
      setCities(Array.isArray(data) ? data : []);
    } catch {
      setCityFeedback({ tone: 'error', title: 'Erro', message: 'Nao foi possivel carregar cidades.' });
    } finally {
      setIsLoadingCities(false);
    }
  }, [apiUrl, token]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value).slice(0, 8);
    setFormData((prev) => ({ ...prev, cep: maskCep(digits) }));
    if (digits.length === 8) void fetchCep(digits);
  };

  useEffect(() => {
    void fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (!initialData) return;

    setFormData((prev) => ({
      ...prev,
      clientName: initialData.clientName || '',
      cnpjCpf: initialData.cnpjCpf || '',
      email: initialData.email || '',
      rgInscricaoEstadual: initialData.rgInscricaoEstadual || '',
      city: initialData.city || '',
      cep: initialData.cep || '',
      contactName: initialData.contactName || '',
      contactNumber: initialData.contactNumber || '',
      neighborhood: initialData.neighborhood || '',
      address: initialData.address || '',
      addressNumber: initialData.addressNumber || '',
    }));

    const digits = onlyDigits(initialData.cep || '');
    if (digits.length === 8) void fetchCep(digits);
  }, [fetchCep, initialData, onlyDigits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCity = async () => {
    const name = newCityName.trim();
    if (!name) {
      setCityFeedback({ tone: 'error', title: 'Campo obrigatorio', message: 'Informe o nome da cidade.' });
      return;
    }
    if (!apiUrl || !token) return;

    try {
      setIsSavingCity(true);
      setCityFeedback(null);
      const response = await fetch(`${apiUrl}/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json().catch(() => ({} as CityMutationResponse));

      if (response.status === 409) {
        setCityFeedback({ tone: 'error', title: 'Cidade duplicada', message: payload.message || 'Cidade ja cadastrada.' });
        return;
      }
      if (!response.ok) {
        setCityFeedback({ tone: 'error', title: 'Erro', message: payload.message || 'Erro ao cadastrar cidade.' });
        return;
      }

      const created = payload as ICity;
      setCities((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      setFormData((prev) => ({ ...prev, city: created.name }));
      setCityFeedback({ tone: 'success', title: 'Sucesso', message: 'Cidade cadastrada com sucesso.' });
      setNewCityName('');
      setIsAddingCity(false);
    } catch {
      setCityFeedback({ tone: 'error', title: 'Erro', message: 'Erro ao cadastrar cidade.' });
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const cityExists = cities.some((city) => city.name === formData.city);
  const selectedCity = cities.find((city) => city.name === formData.city);

  const handleDeleteSelectedCity = async () => {
    if (!selectedCity || !apiUrl || !token) return;
    const confirmed = window.confirm(`Excluir a cidade "${selectedCity.name}" da lista?`);
    if (!confirmed) return;

    try {
      setIsDeletingCity(true);
      setCityFeedback(null);
      const response = await fetch(`${apiUrl}/cities/${selectedCity._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({} as CityMutationResponse));
      if (!response.ok) {
        setCityFeedback({ tone: 'error', title: 'Erro', message: payload.message || 'Erro ao excluir cidade.' });
        return;
      }
      setCities((prev) => prev.filter((city) => city._id !== selectedCity._id));
      setFormData((prev) => ({ ...prev, city: '' }));
      setCityFeedback({ tone: 'success', title: 'Sucesso', message: 'Cidade excluida da lista.' });
    } catch {
      setCityFeedback({ tone: 'error', title: 'Erro', message: 'Erro ao excluir cidade.' });
    } finally {
      setIsDeletingCity(false);
    }
  };

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Gerenciamento de Clientes</Title>
          <CloseButton type="button" variant="ghost" aria-label="Fechar modal" onClick={onCancel}>
            x
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Section>
              <SectionTitle>
                <SectionIcon name="client" />
                Dados do Cliente
              </SectionTitle>
              <FieldGrid>
                <GridField>
                  <UIField label="Nome do Cliente" htmlFor="clientName">
                    <TextInput
                      id="clientName"
                      name="clientName"
                      type="text"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Razao Social ou Nome Completo"
                      required
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="CNPJ/CPF" htmlFor="cnpjCpf">
                    <TextInput
                      id="cnpjCpf"
                      name="cnpjCpf"
                      type="text"
                      value={formData.cnpjCpf}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="E-mail" htmlFor="email">
                    <TextInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="cliente@email.com"
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="RG/Inscricao Estadual" htmlFor="rgInscricaoEstadual">
                    <TextInput
                      id="rgInscricaoEstadual"
                      name="rgInscricaoEstadual"
                      type="text"
                      value={formData.rgInscricaoEstadual}
                      onChange={handleChange}
                      placeholder="RG ou Inscricao Estadual"
                    />
                  </UIField>
                </GridField>
              </FieldGrid>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon name="pin" />
                Localizacao
              </SectionTitle>
              <FieldGrid>
                <GridField>
                  <UIField label="CEP" htmlFor="cep">
                    <TextInput
                      id="cep"
                      name="cep"
                      type="text"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      inputMode="numeric"
                    />
                  </UIField>
                  {isFetchingCep ? <FetchingHint>Buscando endereco...</FetchingHint> : null}
                </GridField>

                <GridField>
                  <UIField label="Logradouro" htmlFor="address">
                    <TextInput
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, Avenida, Praca..."
                      required
                    />
                  </UIField>
                </GridField>

                <GridField $span={2}>
                  <UIField label="Numero" htmlFor="addressNumber">
                    <TextInput
                      id="addressNumber"
                      name="addressNumber"
                      type="text"
                      value={formData.addressNumber}
                      onChange={handleChange}
                      placeholder="Numero, Bloco, Sala"
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="Bairro" htmlFor="neighborhood">
                    <TextInput
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      placeholder="Nome do Bairro"
                      required
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="Cidade" htmlFor="city">
                    <SelectInput
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione...</option>
                      {!cityExists && formData.city ? <option value={formData.city}>{formData.city}</option> : null}
                      {cities.map((city) => (
                        <option key={city._id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </SelectInput>
                    {isLoadingCities ? <FetchingHint>Carregando cidades...</FetchingHint> : null}
                    {!cityExists && formData.city ? (
                      <FetchingHint>Cidade preenchida pelo CEP ainda nao cadastrada.</FetchingHint>
                    ) : null}
                    {isAdmin ? (
                      <InlineActions>
                        {!isAddingCity ? (
                          <InlineLinkButton type="button" onClick={() => setIsAddingCity(true)}>
                            + Nova cidade
                          </InlineLinkButton>
                        ) : (
                          <>
                            <TextInput
                              type="text"
                              value={newCityName}
                              onChange={(e) => setNewCityName(e.target.value)}
                              placeholder="Nome da cidade"
                              style={{ maxWidth: 240 }}
                            />
                            <InlineLinkButton type="button" onClick={() => void handleCreateCity()} disabled={isSavingCity}>
                              {isSavingCity ? 'Salvando...' : 'Salvar'}
                            </InlineLinkButton>
                            <InlineLinkButton
                              type="button"
                              onClick={() => {
                                setIsAddingCity(false);
                                setNewCityName('');
                              }}
                            >
                              Cancelar
                            </InlineLinkButton>
                          </>
                        )}
                        {selectedCity ? (
                          <InlineLinkButton
                            type="button"
                            onClick={() => void handleDeleteSelectedCity()}
                            disabled={isDeletingCity}
                            title="Excluir cidade selecionada"
                          >
                            {isDeletingCity ? 'Excluindo...' : 'Excluir cidade selecionada'}
                          </InlineLinkButton>
                        ) : null}
                      </InlineActions>
                    ) : null}
                  </UIField>
                </GridField>
              </FieldGrid>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon name="contact" />
                Contato
              </SectionTitle>
              <FieldGrid>
                <GridField>
                  <UIField label="Nome do Contato" htmlFor="contactName">
                    <TextInput
                      id="contactName"
                      name="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Responsavel no local"
                      required
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="Numero do Contato" htmlFor="contactNumber">
                    <TextInput
                      id="contactNumber"
                      name="contactNumber"
                      type="text"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </UIField>
                </GridField>
              </FieldGrid>
            </Section>
          </ModalBody>

          <ModalFooter>
            <FooterButton type="submit" variant="primary">
              {initialData ? 'Atualizar' : 'Cadastrar'}
            </FooterButton>
            <FooterButton type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </FooterButton>
          </ModalFooter>
        </Form>
      </ModalContent>
      {cityFeedback ? (
        <ResultOverlay onClick={() => setCityFeedback(null)}>
          <ResultModal onClick={(event) => event.stopPropagation()}>
            <ResultHeader $tone={cityFeedback.tone}>{cityFeedback.title}</ResultHeader>
            <ResultBody>{cityFeedback.message}</ResultBody>
            <ResultFooter>
              <ResultOkButton type="button" onClick={() => setCityFeedback(null)}>
                OK
              </ResultOkButton>
            </ResultFooter>
          </ResultModal>
        </ResultOverlay>
      ) : null}
    </ModalOverlay>
  );
};

export default ClientForm;
