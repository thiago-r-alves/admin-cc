import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CacambaList from './CacambaList';
import type { ICacamba } from '../interfaces';

vi.mock('../utils/image', () => ({
  resizeImage: vi.fn(async (url: string) => `thumb:${url}`),
}));

const baseCacamba: ICacamba = {
  _id: 'cac-1',
  numero: '415',
  tipo: 'entrega',
  local: 'via_publica',
  orderId: 'ord-1',
  createdAt: '2026-05-16T12:00:00.000Z',
};

describe('CacambaList', () => {
  it('renderiza estado vazio sem executar hooks condicionalmente', () => {
    render(<CacambaList cacambas={[]} />);

    expect(screen.getByText('Nenhuma caçamba registrada ainda')).toBeInTheDocument();
  });

  it('renderiza imagem com carregamento lazy e abre imagem ampliada', async () => {
    const onImageClick = vi.fn();
    render(
      <CacambaList
        cacambas={[{ ...baseCacamba, imageUrl: 'https://example.test/cacamba.jpg' }]}
        showTitle={false}
        onImageClick={onImageClick}
      />,
    );

    const image = screen.getByAltText('Foto da caçamba');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');

    await waitFor(() => expect(image).toHaveAttribute('src', 'thumb:https://example.test/cacamba.jpg'));
    fireEvent.click(image);

    await waitFor(() => expect(onImageClick).toHaveBeenCalledWith('thumb:https://example.test/cacamba.jpg'));
  });

  it('oculta a badge de tipo quando showTypeBadge=false', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} showTypeBadge={false} />);

    expect(screen.queryByText('Entrega')).not.toBeInTheDocument();
    expect(screen.getByText('#415')).toBeInTheDocument();
  });

  it('destaca o numero da caçamba em vermelho', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} />);

    expect(getComputedStyle(screen.getByText('#415')).color).toBe('rgb(227, 6, 19)');
  });

  it('mantem a badge de tipo visivel por padrao', () => {
    render(<CacambaList cacambas={[baseCacamba]} showTitle={false} />);

    expect(screen.getByText('Entrega')).toBeInTheDocument();
  });

  it('exibe motorista e placa responsaveis pela caçamba', () => {
    render(
      <CacambaList
        cacambas={[baseCacamba]}
        showTitle={false}
        responsibility={{ driverName: 'Joao Motorista', placa: 'abc1d23' }}
      />,
    );

    expect(screen.getByText(/Joao Motorista/)).toBeInTheDocument();
    expect(screen.getByText(/ABC1D23/)).toBeInTheDocument();
  });

  it('prioriza metadados da movimentacao da caçamba para motorista e placa', () => {
    const retiradaCacamba: ICacamba = {
      ...baseCacamba,
      tipo: 'retirada',
      closureWithdrawal: {
        date: '2026-05-16T12:00:00.000Z',
        driverName: 'Retirador Certo',
        placa: 'ret1a23',
        orderNumber: 20,
      },
    };

    render(
      <CacambaList
        cacambas={[retiradaCacamba]}
        showTitle={false}
        responsibility={{ driverName: 'Motorista Fallback', placa: 'abc1d23' }}
      />,
    );

    expect(screen.getByText(/Retirador Certo/)).toBeInTheDocument();
    expect(screen.getByText(/RET1A23/)).toBeInTheDocument();
    expect(screen.queryByText(/Motorista Fallback/)).not.toBeInTheDocument();
  });

  it('usa label customizado na acao de edicao', () => {
    const onEdit = vi.fn();
    render(
      <CacambaList
        cacambas={[baseCacamba]}
        showTitle={false}
        onEdit={onEdit}
        editLabel="Editar caçamba"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));

    expect(onEdit).toHaveBeenCalledWith(baseCacamba);
  });

  it('exibe acao de edicao em lista selecionavel de fechamento', () => {
    const onEdit = vi.fn();
    render(
      <CacambaList
        cacambas={[{ ...baseCacamba, paymentStatus: 'pendente', price: 180 }]}
        showTitle={false}
        selectable
        selectedCacambaIds={[]}
        onToggleSelect={vi.fn()}
        onEdit={onEdit}
        editLabel="Editar caçamba"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: 'cac-1' }));
  });

  it('exibe acao para voltar caçamba para pendente quando callback é informado', () => {
    const onReturnToPending = vi.fn();
    const paidCacamba: ICacamba = {
      ...baseCacamba,
      tipo: 'retirada',
      paymentStatus: 'paga',
    };

    render(
      <CacambaList
        cacambas={[paidCacamba]}
        showTitle={false}
        onReturnToPending={onReturnToPending}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para pendente' }));

    expect(onReturnToPending).toHaveBeenCalledWith(paidCacamba);
  });

  it('exibe edicao junto da acao de voltar para pendente em grupos de fechamento', () => {
    const onEdit = vi.fn();
    const onReturnToPending = vi.fn();
    const paidCacamba: ICacamba = {
      ...baseCacamba,
      tipo: 'retirada',
      paymentStatus: 'paga',
    };

    render(
      <CacambaList
        cacambas={[paidCacamba]}
        showTitle={false}
        onEdit={onEdit}
        editLabel="Editar caçamba"
        onReturnToPending={onReturnToPending}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para pendente' }));

    expect(onEdit).toHaveBeenCalledWith(paidCacamba);
    expect(onReturnToPending).toHaveBeenCalledWith(paidCacamba);
  });

  it('exibe data de entrega da retirada apenas quando habilitado', () => {
    const retiradaCacamba: ICacamba = {
      ...baseCacamba,
      tipo: 'retirada',
      closureDelivery: {
        date: '2026-05-01T10:00:00.000Z',
        driverName: 'Motorista',
        placa: 'ABC1D23',
        orderNumber: 10,
      },
    };

    const { rerender } = render(<CacambaList cacambas={[retiradaCacamba]} showTitle={false} />);

    expect(screen.queryByText(/Entregue em:/)).not.toBeInTheDocument();

    rerender(
      <CacambaList
        cacambas={[retiradaCacamba]}
        showTitle={false}
        showDeliveryDateForRetirada
      />,
    );

    expect(screen.getByText(/Entregue em:/)).toBeInTheDocument();
    expect(screen.getByText(/Retirada em:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Entregue em:/).compareDocumentPosition(screen.getByText(/Retirada em:/)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
