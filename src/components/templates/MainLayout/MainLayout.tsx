import type { ReactNode } from 'react';
import { Header } from '@/components/organisms/Header';
import { cn } from '@/lib/utils/cn';

export type MainLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
};

export const MainLayout = ({ children, className, headerActions, sidebar }: MainLayoutProps) => {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100', className)}>
      <Header actions={headerActions} />
      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          {sidebar ? <aside>{sidebar}</aside> : null}
          <section>{children}</section>
        </div>
      </main>
    </div>
  );
};
