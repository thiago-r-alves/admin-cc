import React from 'react';
import { cn } from './cn';

type IntrinsicElement = keyof React.JSX.IntrinsicElements;

type TwProps<T extends IntrinsicElement, P extends object> = React.ComponentPropsWithoutRef<T> &
  P & {
    className?: string;
  };

export function twComponent<T extends IntrinsicElement, P extends object = object>(
  tag: T,
  baseClassName: string,
  dynamicClassName?: (props: P) => string,
) {
  const Component = React.forwardRef<Element, TwProps<T, P>>(function Component({ className, ...props }, ref) {
    const Tag = tag as React.ElementType;
    const dynamic = dynamicClassName ? dynamicClassName(props as P) : undefined;
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !key.startsWith('$')),
    );

    return <Tag ref={ref} className={cn(baseClassName, dynamic, className)} {...domProps} />;
  });

  return Component;
}
