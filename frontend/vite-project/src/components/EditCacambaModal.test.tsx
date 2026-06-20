import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ICacamba } from '../interfaces';
import EditCacambaModal from './EditCacambaModal';

const baseCacamba: ICacamba = {
  _id: 'cac-1',
  numero: '401',
  tipo: 'retirada',
  orderId: 'ord-1',
  createdAt: '2026-05-01T10:00:00.000Z',
  horaServicoDigitos: '123',
  local: 'via_publica',
};

const submitForm = () => {
  const button = screen.getByRole('button', { name: 'Salvar Alterações' });
  const form = button.closest('form');
  if (!form) throw new Error('Edit form not found.');
  fireEvent.submit(form);
};

describe('EditCacambaModal', () => {
  it('valida numero obrigatorio', async () => {
    const onUpdate = vi.fn();
    render(<EditCacambaModal cacamba={{ ...baseCacamba, contentType: 'Entulho limpo' }} onClose={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '   ' } });
    submitForm();

    expect(await screen.findByText('Número da caçamba é obrigatório.')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('valida ordem de servico com tres digitos', async () => {
    const onUpdate = vi.fn();
    render(<EditCacambaModal cacamba={{ ...baseCacamba, contentType: 'Entulho limpo' }} onClose={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '12' } });
    submitForm();

    expect(await screen.findByText('Ordem de serviço deve conter exatamente 3 dígitos.')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('exige tipo de conteudo para retirada', async () => {
    const onUpdate = vi.fn();
    render(<EditCacambaModal cacamba={baseCacamba} orderType="retirada" onClose={vi.fn()} onUpdate={onUpdate} />);

    submitForm();

    expect(await screen.findByText('Tipo de conteúdo é obrigatório para retirada.')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('salva dados normalizados quando formulario e valido', async () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<EditCacambaModal cacamba={{ ...baseCacamba, contentType: 'Entulho limpo' }} onClose={onClose} onUpdate={onUpdate} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: ' 402 ' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '456' } });
    submitForm();

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        numero: '402',
        horaServicoDigitos: '456',
        tipo: 'retirada',
        contentType: 'Entulho limpo',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
