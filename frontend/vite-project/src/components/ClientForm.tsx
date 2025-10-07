import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  > div { flex: 1 1 260px; }
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &.primary {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }

  &.secondary {
    background: #e5e7eb;
    color: #374151;
    &:hover { background: #d1d5db; }
  }
`;

import type { IClient } from '../interfaces';

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

  // Auto-preenchimento por CEP
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
      // silencioso
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = onlyDigits(raw).slice(0, 8);
    const masked = maskCep(digits);
    setFormData(prev => ({ ...prev, cep: masked }));
    if (digits.length === 8) fetchCep(digits);
  };

  useEffect(() => {
    if (initialData) {
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
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData); // envia também city e cep
  };

  return (
    <FormContainer>
      <Form onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup>
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input
              id="clientName"
              name="clientName"
              type="text"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
            <Input
              id="cnpjCpf"
              name="cnpjCpf"
              type="text"
              value={formData.cnpjCpf}
              onChange={handleChange}
              placeholder="00.000.000/0000-00 ou 000.000.000-00"
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              name="cep"
              type="text"
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={9}
              inputMode="numeric"
            />
            {isFetchingCep && (
              <small style={{ color: '#6b7280' }}>Buscando endereço…</small>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="address">Logradouro</Label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="addressNumber">Número</Label>
            <Input
              id="addressNumber"
              name="addressNumber"
              type="text"
              value={formData.addressNumber}
              onChange={handleChange}
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              type="text"
              value={formData.neighborhood}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="city">Cidade</Label>
            <Select
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
            </Select>
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label htmlFor="contactName">Nome do Contato</Label>
            <Input
              id="contactName"
              name="contactName"
              type="text"
              value={formData.contactName}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="contactNumber">Número do Contato</Label>
            <Input
              id="contactNumber"
              name="contactNumber"
              type="text"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </FormRow>

        <ButtonGroup>
          <Button type="submit" className="primary">
            {initialData ? 'Atualizar' : 'Cadastrar'}
          </Button>
          <Button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default ClientForm;
