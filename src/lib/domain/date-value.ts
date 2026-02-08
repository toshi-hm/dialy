import { formatDateWithWeekday, toISODate } from '@/lib/utils/date';
import { ValidationError } from '@/types/errors';

export class DateValue {
  private constructor(private readonly value: Date) {
    this.validate();
  }

  static create(date: Date): DateValue {
    return new DateValue(new Date(date));
  }

  static today(): DateValue {
    return new DateValue(new Date());
  }

  isSameMonthAndDay(other: DateValue): boolean {
    return (
      this.value.getMonth() === other.value.getMonth() &&
      this.value.getDate() === other.value.getDate()
    );
  }

  getSameDatesInPastYears(years: number): DateValue[] {
    const dates: DateValue[] = [];
    const currentYear = this.value.getFullYear();

    for (let index = 1; index <= years; index += 1) {
      const past = new Date(this.value);
      past.setFullYear(currentYear - index);
      dates.push(new DateValue(past));
    }

    return dates;
  }

  formatWithWeekday(): string {
    return formatDateWithWeekday(this.value);
  }

  formatISO(): string {
    return toISODate(this.value);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: DateValue): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  private validate(): void {
    if (Number.isNaN(this.value.getTime())) {
      throw new ValidationError('Invalid date');
    }
  }
}
