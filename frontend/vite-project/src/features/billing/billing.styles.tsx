import React from 'react';
import { cn } from '../../utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const fieldClass =
  'box-border min-h-11 w-full min-w-0 rounded-xl border border-[#f3c2ca] bg-white px-[0.78rem] py-[0.68rem] text-[0.9rem] text-gray-800 transition-[border-color,box-shadow,transform] duration-[180ms] ease-in-out focus:-translate-y-px focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';

const filterButtonClass =
  'min-h-11 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-xl text-[0.86rem] font-black uppercase tracking-[0.04em] transition-[background,transform,opacity] duration-[180ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none';

export const Page: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden box-border', className)} {...props} />
);

export const SectionCard: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <section
    className={cn(
      'box-border min-w-0 max-w-full overflow-hidden rounded-[22px] border border-[#f1d3d8] bg-[linear-gradient(180deg,rgba(255,245,247,0.7)_0%,rgba(255,255,255,0.98)_100%),#ffffff] p-[1.2rem] shadow-[0_18px_40px_rgba(15,23,42,0.05)] max-[640px]:p-4',
      className,
    )}
    {...props}
  />
);

type FiltersGridProps =
  | ({ as?: 'div' } & React.HTMLAttributes<HTMLDivElement>)
  | ({ as: 'form' } & React.FormHTMLAttributes<HTMLFormElement>);

export const FiltersGrid: React.FC<FiltersGridProps> = ({ as = 'div', className, ...props }) => {
  const classes = cn('grid grid-cols-5 items-end gap-[0.85rem] max-[1200px]:grid-cols-2 max-[720px]:grid-cols-1', className);

  if (as === 'form') {
    return <form className={classes} {...(props as React.FormHTMLAttributes<HTMLFormElement>)} />;
  }

  return <div className={classes} {...(props as React.HTMLAttributes<HTMLDivElement>)} />;
};

export const Field: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0', className)} {...props} />;

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('mb-[0.35rem] block text-[0.72rem] font-black uppercase tracking-[0.05em] text-gray-500', className)} {...props} />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn(fieldClass, className)} {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => (
  <select className={cn(fieldClass, className)} {...props} />
);

export const ApplyFilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(filterButtonClass, 'border-0 bg-brand text-white hover:bg-brand-hover', className)} {...props} />
);

export const ClearFilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(filterButtonClass, 'border border-[#f3c2ca] bg-white text-red-900 hover:bg-[#fff7f8]', className)} {...props} />
);

export const FilterActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('col-span-full grid grid-cols-[repeat(2,minmax(0,180px))] justify-start gap-[0.65rem] max-[720px]:grid-cols-1', className)} {...props} />
);

export const KpiGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid min-w-0 grid-cols-4 gap-[0.9rem] max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1', className)} {...props} />
);

export const KpiCard: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'relative min-w-0 overflow-hidden rounded-[18px] border border-[#f5d5db] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-4 after:absolute after:bottom-[-40px] after:right-[-40px] after:h-[120px] after:w-[120px] after:rounded-full after:bg-[rgba(227,6,19,0.07)] after:content-[""]',
      className,
    )}
    {...props}
  />
);

export const KpiLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-gray-500', className)} {...props} />
);

export const KpiValue: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <strong className={cn('mt-[0.6rem] block [overflow-wrap:anywhere] text-[clamp(1.45rem,2vw,2rem)] leading-[1.05] text-gray-950', className)} {...props} />
);

export const KpiFootnote: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('mt-[0.45rem] block text-[0.82rem] font-bold text-red-900', className)} {...props} />
);

export const CardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 flex min-w-0 items-start justify-between gap-4 [&>div]:min-w-0 max-[640px]:flex-col', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 [overflow-wrap:anywhere] text-[1.08rem] text-gray-950', className)} {...props} />
);

export const CardSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('m-0 mt-[0.3rem] [overflow-wrap:anywhere] text-[0.88rem] leading-[1.45] text-gray-500', className)} {...props} />
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
  <div className={cn('min-w-0 rounded-[18px] border border-[#f2d6da] bg-white p-4', className)} {...props} />
);

export const InsightLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-[0.72rem] font-black uppercase tracking-[0.06em] text-gray-500', className)} {...props} />
);

export const InsightValue: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <strong className={cn('mt-[0.55rem] block [overflow-wrap:anywhere] text-[1.02rem] leading-[1.35] text-gray-950', className)} {...props} />
);

export const TablesGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid min-w-0 grid-cols-2 gap-4 max-[980px]:grid-cols-1', className)} {...props} />
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
      'w-full min-w-[520px] border-collapse [&_td]:border-b [&_td]:border-[#f4e0e4] [&_td]:px-[0.3rem] [&_td]:py-[0.8rem] [&_td]:text-left [&_td]:text-[0.88rem] [&_td]:font-semibold [&_td]:text-gray-800 [&_td]:[overflow-wrap:anywhere] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-[#f4e0e4] [&_th]:px-[0.3rem] [&_th]:py-[0.8rem] [&_th]:text-left [&_th]:text-[0.73rem] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.06em] [&_th]:text-gray-500 [&_tbody_tr:last-child_td]:border-b-0',
      className,
    )}
    {...props}
  />
);

export const EmptyState: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('rounded-2xl border border-dashed border-[#efb2bb] bg-[#fffafa] p-5 text-gray-500', className)} {...props} />
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
