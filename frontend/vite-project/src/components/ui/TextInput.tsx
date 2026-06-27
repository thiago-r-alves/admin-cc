import React from 'react';
import { cn } from '../../utils/cn';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid = false, startAdornment, endAdornment, className, ...props },
  ref
) {
  return (
    <div
      className={cn(
        'box-border flex min-h-[43px] w-full items-center gap-[0.55rem] rounded-ui-sm border bg-white px-[0.8rem] transition-[border-color,box-shadow] duration-[180ms] ease-in-out focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand-focus',
        invalid ? 'border-red-600' : 'border-gray-300',
        className,
      )}
    >
      {startAdornment ? <span className="inline-flex items-center text-gray-500">{startAdornment}</span> : null}
      <input
        ref={ref}
        className="w-full min-w-0 border-0 bg-transparent text-[0.9rem] text-gray-700 placeholder:text-gray-400 focus:outline-none"
        {...props}
      />
      {endAdornment ? <span className="inline-flex items-center text-gray-500">{endAdornment}</span> : null}
    </div>
  );
});

export default TextInput;
