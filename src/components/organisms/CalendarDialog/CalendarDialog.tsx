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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(toISODate(selectedDate));
    setErrorMessage(null);
  }, [selectedDate]);

  if (!open) {
    return null;
  }

  const handleApply = () => {
    if (!value) {
      setErrorMessage('日付を選択してください');
      return;
    }

    try {
      onSelect(parseISODate(value));
      onClose();
    } catch {
      setErrorMessage('有効な日付を選択してください');
    }
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
            onChange={(event) => {
              setValue(event.target.value);
              setErrorMessage(null);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errorMessage && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" onClick={handleApply} disabled={!value}>
            適用
          </Button>
        </div>
      </div>
    </div>
  );
};
