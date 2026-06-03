import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CacambaList from './CacambaList';
import type { ICacamba } from '../interfaces';

const baseCacamba: ICacamba = {
  _id: 'cac-1',
  numero: '415',
  tipo: 'entrega',
  local: 'via_publica',
  orderId: 'ord-1',
  createdAt: '2026-05-16T12:00:00.000Z',
};

describe('CacambaList', () => {
  it('oculta a badge de tipo quando showTypeBadge=false', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} showTypeBadge={false} />);

    expect(screen.queryByText('Entrega')).not.toBeInTheDocument();
    expect(screen.getByText('#415')).toBeInTheDocument();
  });

  it('mantem a badge de tipo visivel por padrao', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} />);

    expect(screen.getByText('Entrega')).toBeInTheDocument();
  });
});
