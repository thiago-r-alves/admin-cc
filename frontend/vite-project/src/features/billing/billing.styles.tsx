import React from 'react';
import { cn } from '../../utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const fieldClass =
  'box-border min-h-11 w-full min-w-0 rounded-ui-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus disabled:bg-slate-50 disabled:text-slate-500';

const filterButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-ui-md px-4 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-60';

export const Page: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('box-border grid w-full min-w-0 max-w-full gap-6', className)} {...props} />
);

export const SectionCard: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <section
    className={cn(
      'box-border min-w-0 max-w-full rounded-ui-lg border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.025)] max-[640px]:p-4',
      className,
    )}
    {...props}
  />
);

type FiltersGridProps =
  | ({ as?: 'div' } & React.HTMLAttributes<HTMLDivElement>)
  | ({ as: 'form' } & React.FormHTMLAttributes<HTMLFormElement>);

export const FiltersGrid: React.FC<FiltersGridProps> = ({ as = 'div', className, ...props }) => {
  const classes = cn('grid min-w-0 grid-cols-3 items-end gap-4 max-[1000px]:grid-cols-1', className);

  if (as === 'form') {
    return <form className={classes} {...(props as React.FormHTMLAttributes<HTMLFormElement>)} />;
  }

  return <div className={classes} {...(props as React.HTMLAttributes<HTMLDivElement>)} />;
};

export const Field: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0', className)} {...props} />;

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('mb-2 block text-xs font-bold text-slate-600', className)} {...props} />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn(fieldClass, className)} {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => (
  <select className={cn(fieldClass, className)} {...props} />
);

export const ApplyFilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(filterButtonClass, 'border border-brand bg-brand text-white hover:bg-brand-hover', className)} {...props} />
);

export const ClearFilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(filterButtonClass, 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50', className)} {...props} />
);

export const FilterActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-wrap items-center gap-2 max-[560px]:grid max-[560px]:w-full max-[560px]:grid-cols-2', className)} {...props} />
);

export const KpiGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid min-w-0 grid-cols-4 gap-[0.9rem] max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1', className)} {...props} />
);

export const KpiCard: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'relative min-w-0 rounded-ui-lg border border-slate-200 bg-white p-5',
      className,
    )}
    {...props}
  />
);

export const KpiLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-sm font-semibold text-slate-500', className)} {...props} />
);

export const KpiValue: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <strong className={cn('mt-3 block break-words text-[clamp(1.5rem,2.1vw,2rem)] font-bold leading-tight tracking-tight text-slate-950 tabular-nums', className)} {...props} />
);

export const KpiFootnote: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('mt-2 block text-xs leading-relaxed text-slate-500', className)} {...props} />
);

export const CardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 flex min-w-0 items-start justify-between gap-4 [&>div]:min-w-0 max-[640px]:flex-col', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 break-words text-base font-bold tracking-tight text-slate-950', className)} {...props} />
);

export const CardSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('m-0 mt-1 break-words text-sm leading-relaxed text-slate-500', className)} {...props} />
);

export const TrendChartWrap: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid w-full min-w-0 max-w-full gap-[0.9rem] overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [contain:inline-size]', className)} {...props} />
);

export const TrendChartSvg: React.FC<React.SVGAttributes<SVGSVGElement>> = ({ className, ...props }) => (
  <svg className={cn('block h-[280px] w-auto flex-none', className)} {...props} />
);

export const TrendAxisLabel: React.FC<React.SVGAttributes<SVGTextElement>> = ({ className, ...props }) => (
  <text className={cn('fill-gray-500 text-[11px] font-bold', className)} {...props} />
);

export const LegendRow: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex min-w-0 flex-wrap items-center justify-between gap-[0.9rem]', className)} {...props} />
);

export const LegendPill: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, children, ...props }) => (
  <span className={cn('inline-flex items-center gap-[0.45rem] rounded-full border border-[#f0c8cf] px-[0.7rem] py-[0.45rem] text-[0.76rem] font-extrabold text-gray-500', className)} {...props}>
    <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(180deg,#ef4444_0%,#b91c1c_100%)]" />
    {children}
  </span>
);

export const InsightsGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid grid-cols-3 gap-[0.9rem] max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1', className)} {...props} />
);

export const InsightCard: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('min-w-0 rounded-ui-lg border border-slate-200 bg-white p-4', className)} {...props} />
);

export const InsightLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-xs font-semibold text-slate-500', className)} {...props} />
);

export const InsightValue: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <strong className={cn('mt-2 block break-words text-lg font-bold leading-snug text-slate-950', className)} {...props} />
);

export const TablesGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid min-w-0 grid-cols-1 gap-4 min-[1800px]:grid-cols-2', className)} {...props} />
);

export const TableCard: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <SectionCard className={cn('p-4', className)} {...props} />
);

export const TableWrap: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('box-border w-full min-w-0 max-w-full overflow-auto [-webkit-overflow-scrolling:touch] [contain:inline-size]', className)} {...props} />
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <table
    className={cn(
      'w-full min-w-[520px] border-collapse [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:tabular-nums [&_td:first-child]:text-left [&_td:not(:first-child)]:text-right [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-slate-500 [&_th:first-child]:text-left [&_th:not(:first-child)]:text-right [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-50 [&_tbody_tr:last-child_td]:border-b-0',
      className,
    )}
    {...props}
  />
);

export const EmptyState: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('rounded-ui-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500', className)} {...props} />
);

export const LoadingState: React.FC<DivProps> = ({ className, ...props }) => (
  <EmptyState className={cn('text-red-900', className)} {...props} />
);

export const FilterHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 flex min-w-0 flex-wrap items-center justify-between gap-4 [&>div]:min-w-0 max-[640px]:flex-col max-[640px]:items-stretch', className)} {...props} />
);

export const FilterTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 text-base text-gray-950', className)} {...props} />
);
