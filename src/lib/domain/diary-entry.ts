import { isFutureDate, isSameDate } from '@/lib/utils/date';
import { ContentTooLongError, FutureDateError, ValidationError } from '@/types/errors';

const MAX_CONTENT_LENGTH = 10_000;
const MAX_TAG_LENGTH = 20;
const MAX_TAGS_COUNT = 10;

export class DiaryEntry {
  public readonly tags: readonly string[];

  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    tags: readonly string[],
  ) {
    this.tags = Object.freeze(tags.map((tag) => tag.trim()));
    this.validate();
  }

  static create(date: Date, content: string, tags: string[] = []): DiaryEntry {
    return new DiaryEntry(
      crypto.randomUUID(),
      new Date(date),
      content,
      new Date(),
      new Date(),
      tags,
    );
  }

  static reconstruct(
    id: string,
    date: Date,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    tags: string[] = [],
  ): DiaryEntry {
    return new DiaryEntry(
      id,
      new Date(date),
      content,
      new Date(createdAt),
      new Date(updatedAt),
      tags,
    );
  }

  update(newContent: string): DiaryEntry {
    return new DiaryEntry(this.id, this.date, newContent, this.createdAt, new Date(), this.tags);
  }

  updateTags(newTags: string[]): DiaryEntry {
    return new DiaryEntry(this.id, this.date, this.content, this.createdAt, new Date(), newTags);
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
      throw new ContentTooLongError('Content exceeds maximum length (10,000 characters)');
    }

    if (this.tags.length > MAX_TAGS_COUNT) {
      throw new ValidationError(`Tags must not exceed ${MAX_TAGS_COUNT} items`);
    }

    for (const tag of this.tags) {
      if (!tag) {
        throw new ValidationError('Tag must not be empty');
      }

      if (tag.length > MAX_TAG_LENGTH) {
        throw new ValidationError(`Each tag must not exceed ${MAX_TAG_LENGTH} characters`);
      }
    }
  }
}
