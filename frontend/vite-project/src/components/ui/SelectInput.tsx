import React from 'react';
import { cn } from '../../utils/cn';

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid = false, className, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'box-border min-h-[43px] w-full appearance-none rounded-ui-sm border bg-white px-[0.8rem] py-[0.65rem] pr-9 text-[0.9rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus disabled:opacity-100',
        invalid ? 'border-red-600' : 'border-gray-300',
        className,
      )}
      {...props}
    />
  );
});

export default SelectInput;
