import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { NotFoundError } from '@/types/errors';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockRepository: DiaryRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByDate: vi.fn(),
  findBySameDate: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
};

vi.mock('@/lib/infrastructure/supabase-client', () => ({
  supabase: {},
}));

vi.mock('@/lib/infrastructure/supabase-diary-repository', () => ({
  SupabaseDiaryRepository: class {
    save = mockRepository.save;
    findById = mockRepository.findById;
    findByDate = mockRepository.findByDate;
    findBySameDate = mockRepository.findBySameDate;
    delete = mockRepository.delete;
    findAll = mockRepository.findAll;
  },
}));

const {
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntry,
  getEntriesBySameDate,
  DIARY_ENTRIES_TAG,
} = await import('./diary');
const { revalidatePath, revalidateTag } = await import('next/cache');

const VALID_DATE = '2026-02-08T00:00:00.000Z';
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const reconstructEntry = (
  id: string = VALID_UUID,
  date: string = VALID_DATE,
  content: string = 'test content',
  tags: string[] = [],
): DiaryEntry => {
  return DiaryEntry.reconstruct(id, new Date(date), content, new Date(date), new Date(date), tags);
};

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDiaryEntry', () => {
    it('returns success with serialized entry on valid input', async () => {
      vi.mocked(mockRepository.findByDate).mockResolvedValue(null);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await createDiaryEntry(VALID_DATE, 'Hello world', ['日常']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Hello world');
        expect(result.data.tags).toEqual(['日常']);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidateTag).toHaveBeenCalledWith(DIARY_ENTRIES_TAG);
    });

    it('returns failure with VALIDATION_ERROR for invalid date', async () => {
      const result = await createDiaryEntry('not-a-date', 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with VALIDATION_ERROR for content exceeding max length', async () => {
      const result = await createDiaryEntry(VALID_DATE, 'a'.repeat(10_001));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with DUPLICATE_DATE_ENTRY for duplicate date', async () => {
      const existing = reconstructEntry();
      vi.mocked(mockRepository.findByDate).mockResolvedValue(existing);

      const result = await createDiaryEntry(VALID_DATE, 'duplicate');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DUPLICATE_DATE_ENTRY');
      }
    });
  });

  describe('updateDiaryEntry', () => {
    it('returns success with updated entry on valid input', async () => {
      const existing = reconstructEntry();
      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await updateDiaryEntry(VALID_UUID, 'updated content');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('updated content');
      }
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidateTag).toHaveBeenCalledWith(DIARY_ENTRIES_TAG);
    });

    it('returns failure with VALIDATION_ERROR for invalid UUID', async () => {
      const result = await updateDiaryEntry('invalid-id', 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with FETCH_FAILED when entry not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await updateDiaryEntry(VALID_UUID, 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FETCH_FAILED');
      }
    });
  });

  describe('deleteDiaryEntry', () => {
    it('returns success on valid delete', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      const result = await deleteDiaryEntry(VALID_UUID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidateTag).toHaveBeenCalledWith(DIARY_ENTRIES_TAG);
    });

    it('returns failure with VALIDATION_ERROR for invalid UUID', async () => {
      const result = await deleteDiaryEntry('invalid-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with NOT_FOUND when entry does not exist', async () => {
      vi.mocked(mockRepository.delete).mockRejectedValue(
        new NotFoundError('Diary entry not found'),
      );

      const result = await deleteDiaryEntry(VALID_UUID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getDiaryEntry', () => {
    it('returns success with serialized entry when found', async () => {
      const entry = reconstructEntry();
      vi.mocked(mockRepository.findByDate).mockResolvedValue(entry);

      const result = await getDiaryEntry(VALID_DATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.content).toBe('test content');
      }
    });

    it('returns success with null when entry not found', async () => {
      vi.mocked(mockRepository.findByDate).mockResolvedValue(null);

      const result = await getDiaryEntry(VALID_DATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns failure with VALIDATION_ERROR for invalid date string', async () => {
      const result = await getDiaryEntry('not-a-date');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('getEntriesBySameDate', () => {
    it('returns success with serialized entries', async () => {
      const entries = [reconstructEntry(VALID_UUID, '2025-02-08T00:00:00.000Z', 'past entry')];
      vi.mocked(mockRepository.findBySameDate).mockResolvedValue(entries);

      const result = await getEntriesBySameDate(VALID_DATE, 3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].content).toBe('past entry');
      }
    });

    it('returns success with empty array when no entries found', async () => {
      vi.mocked(mockRepository.findBySameDate).mockResolvedValue([]);

      const result = await getEntriesBySameDate(VALID_DATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns failure with VALIDATION_ERROR for invalid date string', async () => {
      const result = await getEntriesBySameDate('invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with VALIDATION_ERROR for years exceeding maximum', async () => {
      const result = await getEntriesBySameDate(VALID_DATE, 51);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns failure with VALIDATION_ERROR for non-positive years', async () => {
      const result = await getEntriesBySameDate(VALID_DATE, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
