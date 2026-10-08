import { useId, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { BillingIcon } from './BillingIcon';
import {
  CardHeader,
  CardSubtitle,
  CardTitle,
  EmptyState,
  TableCard,
  TableWrap,
} from './billing.styles';

type RankingTableProps = {
  title: string;
  subtitle: string;
  headers: string[];
  rows: Array<Array<ReactNode>>;
  controls?: ReactNode;
  emptyMessage?: string;
};

export const RankingTable = ({
  title,
  subtitle,
  headers,
  rows,
  controls,
  emptyMessage = 'Nenhum dado disponível para este recorte.',
}: RankingTableProps) => {
  const titleId = useId();
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, 5);

  return (
    <TableCard aria-labelledby={titleId}>
      <CardHeader>
        <div>
          <CardTitle id={titleId}>{title}</CardTitle>
          <CardSubtitle>{subtitle}</CardSubtitle>
        </div>
        <span className="shrink-0 rounded-ui-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold tabular-nums text-slate-500">
          {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
        </span>
      </CardHeader>

      {controls}

      {rows.length ? (
        <>
          <TableWrap tabIndex={0} aria-label={`Rolagem do ranking: ${title}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus-strong">
            <table id={tableId} className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {headers.map((header, index) => (
                    <th
                      key={header}
                      scope="col"
                      className={cn('px-3 py-3 text-xs font-semibold text-slate-500', index === 0 ? 'text-left' : 'whitespace-nowrap text-right')}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn('px-3 py-3.5 text-slate-700', cellIndex === 0 ? 'min-w-[180px] max-w-[360px]' : 'whitespace-nowrap text-right font-medium tabular-nums')}
                      >
                        {cellIndex === 0 ? (
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-ui-md bg-slate-100 text-[11px] font-semibold tabular-nums text-slate-500" aria-hidden>
                              {rowIndex + 1}
                            </span>
                            <span className="min-w-0 break-words font-medium leading-5">{cell}</span>
                          </div>
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500">Exibindo {visibleRows.length} de {rows.length} registros</span>
            {rows.length > 5 && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={tableId}
                aria-label={`${expanded ? 'Ver menos' : `Ver todos os ${rows.length} itens`}: ${title}`}
                onClick={() => setExpanded((current) => !current)}
                className="inline-flex min-h-11 items-center gap-2 rounded-ui-md px-3 text-xs font-semibold text-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus-strong"
              >
                {expanded ? 'Ver menos' : `Ver todos (${rows.length})`}
                <BillingIcon name="chevron-down" className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
              </button>
            )}
          </div>
        </>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </TableCard>
  );
};
