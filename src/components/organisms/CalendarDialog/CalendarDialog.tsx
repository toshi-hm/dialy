'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils/cn';
import { parseISODate, toISODate } from '@/lib/utils/date';

export type CalendarDialogProps = {
  open: boolean;
  selectedDate: Date;
  maxDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  className?: string;
};

export const CalendarDialog = ({
  className,
  maxDate,
  onClose,
  onSelect,
  open,
  selectedDate,
}: CalendarDialogProps) => {
  const [value, setValue] = useState<string>(toISODate(selectedDate));

  useEffect(() => {
    setValue(toISODate(selectedDate));
  }, [selectedDate]);

  if (!open) {
    return null;
  }

  const handleApply = () => {
    onSelect(parseISODate(value));
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4',
        className,
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="日付を選択"
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg"
      >
        <div className="mb-4">
          <label htmlFor="calendar-input" className="mb-1 block text-sm font-medium text-gray-700">
            日付
          </label>
          <input
            id="calendar-input"
            aria-label="日付"
            type="date"
            value={value}
            max={toISODate(maxDate)}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" onClick={handleApply}>
            適用
          </Button>
        </div>
      </div>
    </div>
  );
};
