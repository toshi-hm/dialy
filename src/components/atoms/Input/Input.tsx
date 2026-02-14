import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = ({ className, hasError = false, ...props }: InputProps) => {
  const ariaInvalid = hasError ? true : props['aria-invalid'];

  return (
    <input
      {...props}
      aria-invalid={ariaInvalid}
      className={cn(
        'w-full rounded-md border px-3 py-2 text-gray-900 transition-colors outline-none',
        'focus:ring-2 focus:ring-blue-500',
        hasError ? 'border-red-600 focus:ring-red-500' : 'border-gray-300',
        className,
      )}
    />
  );
};
