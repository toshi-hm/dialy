import type { ISODateString } from '@/types/date';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

export const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const isSameDate = (left: Date, right: Date): boolean => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

export const isFutureDate = (date: Date, now: Date = new Date()): boolean => {
  return startOfDay(date).getTime() > startOfDay(now).getTime();
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const toISODate = (date: Date): ISODateString => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as ISODateString;
};

export const parseISODate = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('Invalid ISO date format');
  }

  const [, yearStr, monthStr, dayStr] = match;
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid ISO date');
  }

  return date;
};

export const formatDateWithWeekday = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS_JA[date.getDay()];

  return `${month}月${day}日（${weekday}）`;
};
