'use client';

import { useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { addDays, formatDateWithWeekday, isFutureDate, startOfDay } from '@/lib/utils/date';

const ROTATION_STEP_DEGREE = 24;

export interface DialProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  onFutureDateAttempt?: () => void;
  onOpenCalendar?: () => void;
  className?: string;
  size?: number;
}

export function Dial({
  className,
  maxDate = new Date(),
  minDate,
  onDateChange,
  onFutureDateAttempt,
  onOpenCalendar,
  selectedDate,
  size = 180,
}: DialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; lastAngle: number; pointerId: number | null }>({
    active: false,
    lastAngle: 0,
    pointerId: null,
  });

  const ariaValueNow = useMemo(
    () => Math.floor(startOfDay(selectedDate).getTime() / 86400000),
    [selectedDate],
  );

  const canMoveToDate = useCallback(
    (candidate: Date) => {
      const normalizedCandidate = startOfDay(candidate);
      if (isFutureDate(normalizedCandidate, maxDate)) {
        onFutureDateAttempt?.();
        return false;
      }

      if (minDate && normalizedCandidate.getTime() < startOfDay(minDate).getTime()) {
        return false;
      }

      return true;
    },
    [maxDate, minDate, onFutureDateAttempt],
  );

  const moveDate = useCallback(
    (step: number) => {
      const next = startOfDay(addDays(selectedDate, step));
      if (!canMoveToDate(next)) {
        return;
      }

      onDateChange(next);
    },
    [canMoveToDate, onDateChange, selectedDate],
  );

  const calculateAngle = useCallback((x: number, y: number): number => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radian = Math.atan2(y - centerY, x - centerX);
    return (radian * 180) / Math.PI;
  }, []);

  const normalizeDelta = (delta: number): number => {
    if (delta > 180) {
      return delta - 360;
    }
    if (delta < -180) {
      return delta + 360;
    }
    return delta;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      lastAngle: calculateAngle(event.clientX, event.clientY),
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const currentAngle = calculateAngle(event.clientX, event.clientY);
    const delta = normalizeDelta(currentAngle - dragRef.current.lastAngle);

    if (Math.abs(delta) < ROTATION_STEP_DEGREE) {
      return;
    }

    const direction = delta > 0 ? 1 : -1;
    const steps = Math.floor(Math.abs(delta) / ROTATION_STEP_DEGREE);
    for (let index = 0; index < steps; index += 1) {
      moveDate(direction);
    }

    dragRef.current.lastAngle = currentAngle;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveDate(-1);
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveDate(1);
    }
  };

  const handleClick = () => {
    onOpenCalendar?.();
  };

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="日付選択"
        aria-valuemin={0}
        aria-valuemax={365000}
        aria-valuenow={ariaValueNow}
        aria-valuetext={formatDateWithWeekday(selectedDate)}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative select-none rounded-full border-4 border-blue-600 bg-blue-50 text-blue-700',
          'flex items-center justify-center shadow-sm outline-none transition-transform duration-100',
          'focus:ring-2 focus:ring-blue-400',
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold">{selectedDate.getDate()}</span>
        <span className="absolute top-2 text-xs font-medium">12</span>
        <span className="absolute right-2 text-xs font-medium">3</span>
        <span className="absolute bottom-2 text-xs font-medium">6</span>
        <span className="absolute left-2 text-xs font-medium">9</span>
      </div>
    </div>
  );
}
