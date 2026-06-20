import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ActionConfirmModal from './ActionConfirmModal';

describe('ActionConfirmModal', () => {
  it('expoe dialog acessivel e confirma a acao', () => {
    const onConfirm = vi.fn();

    render(
      <ActionConfirmModal
        open
        title="Sair do sistema"
        description="Deseja encerrar a sessao atual?"
        confirmLabel="Sair"
        variant="warning"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Sair do sistema' });
    expect(dialog).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
