import React from 'react';
import { cn } from '../../utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
const fieldBase =
  'box-border min-h-[43px] w-full rounded-ui-lg border border-red-200 bg-white px-[0.65rem] py-[0.58rem] text-[0.88rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';

export const Container: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-4', className)} {...props} />
);

export const Header: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4 max-[900px]:flex-col', className)} {...props} />
);

export const Title: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('m-0 text-[clamp(1.45rem,2vw,2rem)] leading-[1.15] text-gray-800', className)} {...props} />
);

export const Subtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('m-0 mt-[0.35rem] text-[0.9rem] text-gray-500', className)} {...props} />
);

export const Toolbar: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'grid grid-cols-[160px_160px_180px_minmax(240px,1fr)] items-end gap-[0.8rem] max-[980px]:grid-cols-2 max-[640px]:grid-cols-1',
      className,
    )}
    {...props}
  />
);

export const Field: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0', className)} {...props} />;

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('mb-[0.3rem] block text-[0.72rem] font-black uppercase tracking-[0.04em] text-gray-500', className)} {...props} />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn(fieldBase, className)} {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => (
  <select className={cn(fieldBase, className)} {...props} />
);

export const SearchWrap: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('relative', className)} {...props} />;

export const SearchIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span
    className={cn('pointer-events-none absolute left-[0.9rem] top-[calc(50%+0.65rem)] inline-flex -translate-y-1/2 text-gray-400', className)}
    {...props}
  />
);

export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn(fieldBase, 'pl-[2.45rem]', className)} {...props} />
);

export const ClientsWrap: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('w-full overflow-hidden rounded-ui-lg border border-red-200 bg-white', className)} {...props} />
);

export const ClientRow: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'box-border flex w-full items-start justify-between gap-4 border-b border-red-100 bg-white px-[1.1rem] py-[0.95rem] text-left last:border-b-0 hover:bg-[#fffafa] max-[980px]:flex-col max-[980px]:items-stretch max-[640px]:items-start',
      className,
    )}
    {...props}
  />
);

export const ClientInfo: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('min-w-0 flex-[1_1_340px]', className)} {...props} />
);

export const ClientName: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block break-words text-base font-black uppercase leading-[1.3] text-gray-800', className)} {...props} />
);

export const ClientAddress: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('mt-1 block break-words text-[0.82rem] font-semibold leading-[1.4] text-gray-500', className)} {...props} />
);

export const ActionButtons: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'box-border flex min-w-[min(100%,420px)] flex-none flex-wrap items-start justify-end gap-[0.7rem] max-[980px]:w-full max-[980px]:min-w-0 max-[980px]:justify-start',
      className,
    )}
    {...props}
  />
);

export const ClientActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={cn(
      'box-border inline-flex min-h-[38px] max-w-full flex-none cursor-pointer items-center justify-center gap-[0.42rem] rounded-ui-md border border-brand-border bg-white px-[0.95rem] py-[0.6rem] text-center text-[0.76rem] font-black uppercase leading-[1.2] text-[#6b1f1f] transition-[background,border-color,color,opacity] duration-[180ms] hover:border-brand hover:bg-brand-soft hover:text-red-900 disabled:cursor-wait disabled:opacity-70 disabled:hover:border-brand-border disabled:hover:bg-white disabled:hover:text-[#6b1f1f] max-[640px]:w-full',
      className,
    )}
    {...props}
  />
);

export const EmptyState: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-dashed border-red-200 bg-[#fffafa] p-[1.2rem] text-gray-500', className)} {...props} />
);
