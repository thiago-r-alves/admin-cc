import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IClient } from '../interfaces';
import ClientForm from './ClientForm';

const buildJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

describe('ClientForm', () => {
  beforeEach(() => {
    const store = new Map<string, string>([
      ['token', 'test-token'],
      ['role', 'admin'],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    });
    vi.stubGlobal('fetch', vi.fn(() => buildJsonResponse([{ _id: 'city-1', name: 'Jacarei' }])));
  });

  it('envia e-mail e RG/Inscricao Estadual como campos opcionais', async () => {
    const onSubmit = vi.fn();

    render(<ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome do Cliente'), { target: { value: 'Cliente Teste' } });
    fireEvent.change(screen.getByLabelText('CNPJ/CPF'), { target: { value: '11.222.333/0001-44' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'cliente@example.com' } });
    fireEvent.change(screen.getByLabelText('RG/Inscricao Estadual'), { target: { value: 'IE-123' } });
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '12345-000' } });
    fireEvent.change(screen.getByLabelText('Logradouro'), { target: { value: 'Rua Teste' } });
    fireEvent.change(screen.getByLabelText('Numero'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Referência (opcional)'), { target: { value: '  Ao lado da farmácia  ' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } });
    await screen.findByRole('option', { name: 'Jacarei' });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Jacarei' } });
    fireEvent.change(screen.getByLabelText('Nome do Contato'), { target: { value: 'Contato' } });
    fireEvent.change(screen.getByLabelText('Numero do Contato'), { target: { value: '99999-0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'cliente@example.com',
          rgInscricaoEstadual: 'IE-123',
          reference: 'Ao lado da farmácia',
        }),
      );
    });
  });

  const initialClient: IClient = {
    _id: 'client-1',
    clientName: 'Cliente Teste',
    contactName: 'Contato',
    contactNumber: '99999-0000',
    neighborhood: 'Centro',
    address: 'Rua Teste',
    addressNumber: '10',
    city: 'Jacarei',
  };

  it('permite salvar cliente antigo sem referência', async () => {
    const onSubmit = vi.fn();
    render(<ClientForm initialData={initialClient} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await screen.findByRole('option', { name: 'Jacarei' });
    const referenceInput = screen.getByLabelText('Referência (opcional)');
    expect(referenceInput).toHaveValue('');
    expect(referenceInput).not.toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reference: '' }));
  });

  it.each([
    ['editar', '  Portão azul  ', 'Portão azul'],
    ['apagar', '', ''],
  ])('permite %s a referência cadastrada', async (_action, inputValue, expectedValue) => {
    const onSubmit = vi.fn();
    render(
      <ClientForm
        initialData={{ ...initialClient, reference: 'Ao lado da farmácia' }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await screen.findByRole('option', { name: 'Jacarei' });
    const referenceInput = screen.getByLabelText('Referência (opcional)');
    expect(referenceInput).toHaveValue('Ao lado da farmácia');
    fireEvent.change(referenceInput, { target: { value: inputValue } });
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reference: expectedValue }));
  });
});
