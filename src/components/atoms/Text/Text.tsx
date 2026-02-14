import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  tone?: 'default' | 'muted' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'bold';
};

const toneClasses = {
  default: 'text-gray-900',
  muted: 'text-gray-600',
  danger: 'text-red-600',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
};

export const Text = ({
  as: Component = 'p',
  children,
  className,
  tone = 'default',
  size = 'md',
  weight = 'normal',
  ...props
}: TextProps) => {
  return (
    <Component
      {...props}
      className={cn(toneClasses[tone], sizeClasses[size], weightClasses[weight], className)}
    >
      {children}
    </Component>
  );
};
