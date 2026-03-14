import { describe, expect, it, vi } from 'vitest';
import { ContentTooLongError, FutureDateError, ValidationError } from '@/types/errors';
import { DiaryEntry } from './diary-entry';

describe('DiaryEntry', () => {
  it('creates a new entry with generated id and timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T10:00:00.000Z'));

    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'hello');

    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(entry.createdAt.toISOString()).toBe('2026-02-08T10:00:00.000Z');
    expect(entry.updatedAt.toISOString()).toBe('2026-02-08T10:00:00.000Z');

    vi.useRealTimers();
  });

  it('throws FutureDateError when date is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T10:00:00.000Z'));

    expect(() => {
      DiaryEntry.create(new Date('2026-02-09T00:00:00.000Z'), 'future');
    }).toThrow(FutureDateError);

    vi.useRealTimers();
  });

  it('throws ContentTooLongError when content exceeds 10000 characters', () => {
    const tooLong = 'a'.repeat(10001);

    expect(() => {
      DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), tooLong);
    }).toThrow(ContentTooLongError);
  });

  it('updates updatedAt when content is updated', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T10:00:00.000Z'));

    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'before');

    vi.setSystemTime(new Date('2026-02-08T12:00:00.000Z'));
    const updated = entry.update('after');

    expect(updated.id).toBe(entry.id);
    expect(updated.content).toBe('after');
    expect(updated.createdAt.toISOString()).toBe(entry.createdAt.toISOString());
    expect(updated.updatedAt.toISOString()).toBe('2026-02-08T12:00:00.000Z');

    vi.useRealTimers();
  });

  it('throws ValidationError when date is invalid (NaN)', () => {
    expect(() => {
      DiaryEntry.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('invalid'),
        'content',
        new Date('2026-02-08T00:00:00.000Z'),
        new Date('2026-02-08T00:00:00.000Z'),
      );
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when createdAt is invalid (NaN)', () => {
    expect(() => {
      DiaryEntry.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2026-02-08T00:00:00.000Z'),
        'content',
        new Date('invalid'),
        new Date('2026-02-08T00:00:00.000Z'),
      );
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when updatedAt is invalid (NaN)', () => {
    expect(() => {
      DiaryEntry.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2026-02-08T00:00:00.000Z'),
        'content',
        new Date('2026-02-08T00:00:00.000Z'),
        new Date('invalid'),
      );
    }).toThrow(ValidationError);
  });

  it('compares same date correctly via isSameDate', () => {
    const entry = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440000',
      new Date('2026-02-08T00:00:00.000Z'),
      'content',
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );

    expect(entry.isSameDate(new Date('2026-02-08T12:00:00.000Z'))).toBe(true);
    expect(entry.isSameDate(new Date('2026-02-09T00:00:00.000Z'))).toBe(false);
  });

  it('throws ValidationError when id is empty', () => {
    expect(() => {
      DiaryEntry.reconstruct(
        '  ',
        new Date('2026-02-08T00:00:00.000Z'),
        'content',
        new Date('2026-02-08T00:00:00.000Z'),
        new Date('2026-02-08T00:00:00.000Z'),
      );
    }).toThrow(ValidationError);
  });

  it('creates entry with tags', () => {
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', [
      '仕事',
      '勉強',
    ]);
    expect(entry.tags).toEqual(['仕事', '勉強']);
  });

  it('normalizes tags by trimming surrounding whitespace', () => {
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', [
      '  仕事  ',
      '\t勉強',
    ]);

    expect(entry.tags).toEqual(['仕事', '勉強']);
  });

  it('creates entry with empty tags by default', () => {
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content');
    expect(entry.tags).toEqual([]);
  });

  it('updates tags while preserving other fields', () => {
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', ['仕事']);
    const updated = entry.updateTags(['勉強', '読書']);
    expect(updated.id).toBe(entry.id);
    expect(updated.content).toBe('content');
    expect(updated.tags).toEqual(['勉強', '読書']);
  });

  it('update() preserves existing tags', () => {
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'before', ['仕事']);
    const updated = entry.update('after');
    expect(updated.tags).toEqual(['仕事']);
  });

  it('throws ValidationError when a tag exceeds 20 characters', () => {
    expect(() => {
      DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', ['a'.repeat(21)]);
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when a tag is empty after trim', () => {
    expect(() => {
      DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', ['   ']);
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when tags exceed 10 items', () => {
    expect(() => {
      DiaryEntry.create(
        new Date('2026-02-08T00:00:00.000Z'),
        'content',
        Array.from({ length: 11 }, (_, i) => `tag${i}`),
      );
    }).toThrow(ValidationError);
  });

  it('does not mutate tags when source array is modified later', () => {
    const sourceTags = ['仕事'];
    const entry = DiaryEntry.create(new Date('2026-02-08T00:00:00.000Z'), 'content', sourceTags);

    sourceTags.push('勉強');

    expect(entry.tags).toEqual(['仕事']);
  });

  it('returns preview text correctly', () => {
    const short = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440000',
      new Date('2026-02-08T00:00:00.000Z'),
      'short text',
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );
    expect(short.getPreviewText()).toBe('short text');

    const longContent = 'a'.repeat(150);
    const long = DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440001',
      new Date('2026-02-08T00:00:00.000Z'),
      longContent,
      new Date('2026-02-08T00:00:00.000Z'),
      new Date('2026-02-08T00:00:00.000Z'),
    );
    expect(long.getPreviewText()).toBe(`${'a'.repeat(100)}...`);
  });
});
