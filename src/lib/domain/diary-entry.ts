import { isFutureDate, isSameDate } from '@/lib/utils/date';
import { FutureDateError, ValidationError } from '@/types/errors';

const MAX_CONTENT_LENGTH = 10_000;

export class DiaryEntry {
  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  static create(date: Date, content: string): DiaryEntry {
    return new DiaryEntry(crypto.randomUUID(), new Date(date), content, new Date(), new Date());
  }

  static reconstruct(
    id: string,
    date: Date,
    content: string,
    createdAt: Date,
    updatedAt: Date,
  ): DiaryEntry {
    return new DiaryEntry(id, new Date(date), content, new Date(createdAt), new Date(updatedAt));
  }

  update(newContent: string): DiaryEntry {
    return new DiaryEntry(this.id, this.date, newContent, this.createdAt, new Date());
  }

  isSameDate(other: Date): boolean {
    return isSameDate(this.date, other);
  }

  getYear(): number {
    return this.date.getFullYear();
  }

  getPreviewText(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }

    return `${this.content.slice(0, maxLength)}...`;
  }

  getCharacterCount(): number {
    return this.content.length;
  }

  private validate(): void {
    if (!this.id.trim()) {
      throw new ValidationError('ID is required');
    }

    if (Number.isNaN(this.date.getTime())) {
      throw new ValidationError('Invalid date');
    }

    if (Number.isNaN(this.createdAt.getTime())) {
      throw new ValidationError('Invalid createdAt');
    }

    if (Number.isNaN(this.updatedAt.getTime())) {
      throw new ValidationError('Invalid updatedAt');
    }

    if (isFutureDate(this.date)) {
      throw new FutureDateError();
    }

    if (this.content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError('Content exceeds maximum length (10,000 characters)');
    }
  }
}
