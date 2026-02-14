import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type HeaderProps = {
  actions?: ReactNode;
  className?: string;
};

export const Header = ({ actions, className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6',
        className,
      )}
    >
      <h1 className="text-2xl font-bold text-gray-900">Dialy</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
};
