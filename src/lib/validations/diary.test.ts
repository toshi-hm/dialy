import { describe, expect, it } from 'vitest';
import { CreateDiaryEntrySchema, DeleteDiaryEntrySchema, UpdateDiaryEntrySchema } from './diary';

describe('diary validation schemas', () => {
  it('rejects future date for create schema', () => {
    expect(() => {
      CreateDiaryEntrySchema.parse({
        date: new Date('2999-01-01T00:00:00.000Z'),
        content: 'future',
      });
    }).toThrow('Future date is not allowed');
  });

  it('rejects content that exceeds max length', () => {
    expect(() => {
      CreateDiaryEntrySchema.parse({
        date: new Date('2026-02-08T00:00:00.000Z'),
        content: 'a'.repeat(10001),
      });
    }).toThrow('Content exceeds maximum length (10,000 characters)');
  });

  it('rejects invalid id format in update schema', () => {
    expect(() => {
      UpdateDiaryEntrySchema.parse({
        id: 'invalid-id',
        content: 'ok',
      });
    }).toThrow('Invalid ID format');
  });

  it('rejects invalid id format in delete schema', () => {
    expect(() => {
      DeleteDiaryEntrySchema.parse({
        id: 'invalid-id',
      });
    }).toThrow('Invalid ID format');
  });
});
