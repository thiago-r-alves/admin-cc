import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CacambaForm from './CacambaForm';

describe('CacambaForm', () => {
  it('solicita a camera traseira ao adicionar a foto', () => {
    render(
      <CacambaForm
        orderId="ord-1"
        orderType="entrega"
        onCacambaAdded={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const imageInput = screen.getByLabelText('Foto da caçamba');
    expect(imageInput).toHaveAttribute('accept', 'image/*');
    expect(imageInput).toHaveAttribute('capture', 'environment');
    expect(imageInput).not.toHaveAttribute('multiple');
  });

  it('libera o botao registrar somente quando todos os campos obrigatorios forem preenchidos', () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
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
    fireEvent.change(screen.getByLabelText(/3 Últimos Dígitos da OS/), { target: { value: '123' } });
    expect(registerButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Foto da caçamba'), {
      target: { files: [new File(['foto'], 'cacamba.jpg', { type: 'image/jpeg' })] },
    });

    expect(registerButton).toBeEnabled();
  });
});
