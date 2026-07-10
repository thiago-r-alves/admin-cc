import { render, screen } from '@testing-library/react';
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
});
