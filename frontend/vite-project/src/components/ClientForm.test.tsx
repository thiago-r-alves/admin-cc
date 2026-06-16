import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
        }),
      );
    });
  });
});
