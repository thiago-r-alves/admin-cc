import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientOrdersFooter from './ClientOrdersFooter';

describe('ClientOrdersFooter', () => {
  it('desabilita botão quando disabled=true', () => {
    render(
      <ClientOrdersFooter
        onDownload={vi.fn(async () => undefined)}
        disabled
        isSubmittingPayment={false}
        closureMode
      />,
    );

    expect(screen.getByTestId('client-orders-download')).toBeDisabled();
  });

  it('mostra Processando durante submissão', () => {
    render(
      <ClientOrdersFooter
        onDownload={vi.fn(async () => undefined)}
        disabled={false}
        isSubmittingPayment
        closureMode
      />,
    );

    expect(screen.getByText('Processando...')).toBeInTheDocument();
  });
});
