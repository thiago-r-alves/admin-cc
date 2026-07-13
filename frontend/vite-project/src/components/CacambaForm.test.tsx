import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CacambaForm from './CacambaForm';

describe('CacambaForm', () => {
  it('permite selecionar uma imagem para upload', () => {
    render(
      <CacambaForm
        orderId="ord-1"
        orderType="entrega"
        onCacambaAdded={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const imageInput = screen.getByLabelText(/Foto da caçamba/);
    expect(imageInput).toHaveAttribute('accept', 'image/*');
    expect(imageInput).not.toHaveAttribute('capture');
    expect(imageInput).not.toHaveAttribute('multiple');
  });

  it('libera o botao registrar somente quando todos os campos obrigatorios forem preenchidos', () => {
    render(
      <CacambaForm
        orderId="ord-1"
        orderType="entrega"
        onCacambaAdded={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const registerButton = screen.getByRole('button', { name: /^Registrar$/ });
    expect(registerButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Número da Caçamba/), { target: { value: '501' } });
    expect(registerButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Foto da caçamba/), {
      target: { files: [new File(['foto'], 'cacamba.jpg', { type: 'image/jpeg' })] },
    });

    expect(registerButton).toBeEnabled();
  });
});
