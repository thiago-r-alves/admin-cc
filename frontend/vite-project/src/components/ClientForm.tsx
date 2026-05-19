import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IClient } from '../interfaces';
import { Button as UIButton, Field as UIField, SelectInput, TextInput } from '../components/ui';

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
  width: min(860px, 94vw);
  max-height: min(90dvh, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
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
  padding: 1.15rem 2rem;
  border-bottom: 1px solid #fecaca;
  background: #ffffff;

  @media (max-width: 560px) {
    padding: 1rem 1.25rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 900;
`;

const CloseButton = styled(UIButton)`
  width: 34px;
  height: 34px;
  min-height: 34px;
  min-width: 34px;
  padding: 0;
  border-radius: 6px;
  font-size: 1.55rem;
  line-height: 1;
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
  padding: 1.75rem 2rem;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 560px) {
    padding: 1.25rem;
  }
`;

const Section = styled.section`
  padding-bottom: 1.35rem;
  margin-bottom: 1.35rem;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.1rem;
  color: #e30613;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const GridField = styled.div<{ $span?: 1 | 2 }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};

  @media (max-width: 680px) {
    grid-column: span 1;
  }
`;

const FetchingHint = styled.small`
  display: block;
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.75rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 0.75rem;
  flex: 0 0 auto;
  padding: 1rem 2rem;
  border-top: 1px solid #fecaca;
  background: #ffffff;

  @media (max-width: 560px) {
    flex-direction: column;
    padding: 1rem 1.25rem;
  }
`;

const FooterButton = styled(UIButton)`
  min-width: 150px;

  @media (max-width: 560px) {
    width: 100%;
  }
`;

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
  const [formData, setFormData] = useState({
    clientName: '',
    cnpjCpf: '',
    city: '',
    cep: '',
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
  });

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastCepRef = useRef<string>('');

  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const maskCep = (digits: string) =>
    digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5, 8)}` : digits;

  const fetchCep = async (cepDigits: string) => {
    if (!cepDigits || cepDigits.length !== 8) return;
    if (lastCepRef.current === cepDigits) return;
    lastCepRef.current = cepDigits;

    try {
      setIsFetchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();

      if (data && !data.erro) {
        setFormData(prev => ({
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
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value).slice(0, 8);
    setFormData(prev => ({ ...prev, cep: maskCep(digits) }));
    if (digits.length === 8) fetchCep(digits);
  };

  useEffect(() => {
    if (!initialData) return;

    setFormData(prev => ({
      ...prev,
      clientName: initialData.clientName || '',
      cnpjCpf: initialData.cnpjCpf || '',
      city: initialData.city || '',
      cep: initialData.cep || '',
      contactName: initialData.contactName || '',
      contactNumber: initialData.contactNumber || '',
      neighborhood: initialData.neighborhood || '',
      address: initialData.address || '',
      addressNumber: initialData.addressNumber || '',
    }));

    const digits = onlyDigits(initialData.cep || '');
    if (digits.length === 8) fetchCep(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Gerenciamento de Clientes</Title>
          <CloseButton type="button" variant="ghost" aria-label="Fechar modal" onClick={onCancel}>
            ×
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
                      placeholder="Razão Social ou Nome Completo"
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
              </FieldGrid>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon name="pin" />
                Localização
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
                  {isFetchingCep && <FetchingHint>Buscando endereço...</FetchingHint>}
                </GridField>

                <GridField>
                  <UIField label="Logradouro" htmlFor="address">
                    <TextInput
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, Avenida, Praça..."
                      required
                    />
                  </UIField>
                </GridField>

                <GridField $span={2}>
                  <UIField label="Número" htmlFor="addressNumber">
                    <TextInput
                      id="addressNumber"
                      name="addressNumber"
                      type="text"
                      value={formData.addressNumber}
                      onChange={handleChange}
                      placeholder="Número, Bloco, Sala"
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
                      <option value="São José dos Campos">São José dos Campos</option>
                      <option value="Jacareí">Jacareí</option>
                      <option value="Caçapava">Caçapava</option>
                      <option value="Jambeiro">Jambeiro</option>
                      <option value="Monteiro Lobato">Monteiro Lobato</option>
                    </SelectInput>
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
                      placeholder="Responsável no local"
                      required
                    />
                  </UIField>
                </GridField>

                <GridField>
                  <UIField label="Número do Contato" htmlFor="contactNumber">
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
    </ModalOverlay>
  );
};

export default ClientForm;
