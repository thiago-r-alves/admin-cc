import Button from './Button';

export type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

const Pagination = ({ page, totalPages, totalItems, onPageChange, disabled = false }: PaginationProps) => {
  if (totalItems === 0) return null;
  return (
    <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-ui-lg border border-gray-200 bg-white p-3">
      <span className="text-sm font-bold text-gray-600">{totalItems} resultado{totalItems === 1 ? '' : 's'} • Página {page} de {totalPages}</span>
      <div className="flex gap-2">
        <Button type="button" variant="quiet" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
        <Button type="button" variant="quiet" disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)}>Próxima</Button>
      </div>
    </nav>
  );
};

export default Pagination;
