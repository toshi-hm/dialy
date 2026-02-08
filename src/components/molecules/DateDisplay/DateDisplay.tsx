import { formatDateWithWeekday } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export interface DateDisplayProps {
  date: Date;
  className?: string;
}

export function DateDisplay({ className, date }: DateDisplayProps) {
  return (
    <h2 className={cn('text-center text-2xl font-bold text-gray-900 md:text-3xl', className)}>
      {formatDateWithWeekday(date)}
    </h2>
  );
}
