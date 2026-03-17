import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { parseISODate } from '@/lib/utils/date';
import { DuplicateDateEntryError, NotFoundError } from '@/types/errors';
import { SupabaseDiaryRepository } from './supabase-diary-repository';

// Supabase クライアントのチェーン可能なクエリビルダーモック
type QueryResult<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

const createQueryBuilder = <T>(result: QueryResult<T>) => {
  // Promise をベースにすることで、チェーン自体が await 可能になる
  // （Supabase クエリビルダーの thenable 動作を再現）
  const builder = Promise.resolve(result) as Promise<QueryResult<T>> & Record<string, unknown>;
  const chainMethods = ['select', 'eq', 'neq', 'gte', 'lte', 'in', 'order', 'update', 'delete'];
  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder.insert = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  return builder;
};

const reconstructEntry = (
  id: string,
  date: string,
  content: string,
  tags: string[] = [],
): DiaryEntry =>
  DiaryEntry.reconstruct(
    id,
    parseISODate(date),
    content,
    parseISODate('2026-02-08'),
    parseISODate('2026-02-08'),
    tags,
  );

const makeDbEntry = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  date: '2026-02-08T00:00:00.000Z',
  content: 'test content',
  created_at: '2026-02-08T00:00:00.000Z',
  updated_at: '2026-02-08T00:00:00.000Z',
  user_id: null,
  diary_entry_tags: [],
  ...overrides,
});

describe('SupabaseDiaryRepository', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let repository: SupabaseDiaryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom = vi.fn();
    repository = new SupabaseDiaryRepository({ from: mockFrom } as never);
  });

  describe('save() — 新規作成', () => {
    it('既存エントリーなし・重複なしの場合に新規作成する', async () => {
      const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'hello');

      // 1回目: 既存確認 → null
      const existingBuilder = createQueryBuilder({ data: null, error: null });
      // 2回目: 重複確認 → null
      const duplicateBuilder = createQueryBuilder({ data: null, error: null });
      // 3回目: 新規作成 → success
      const insertBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(duplicateBuilder)
        .mockReturnValueOnce(insertBuilder);

      await expect(repository.save(entry)).resolves.not.toThrow();
      expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
    });

    it('タグ付きエントリーを新規作成する', async () => {
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-08',
        'hello',
        ['仕事', '勉強'],
      );

      const existingBuilder = createQueryBuilder({ data: null, error: null });
      const duplicateBuilder = createQueryBuilder({ data: null, error: null });
      const insertEntryBuilder = createQueryBuilder({ data: null, error: null });
      const insertTagsBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(duplicateBuilder)
        .mockReturnValueOnce(insertEntryBuilder)
        .mockReturnValueOnce(insertTagsBuilder);

      await repository.save(entry);

      expect(insertTagsBuilder.insert).toHaveBeenCalledWith([
        { entry_id: '550e8400-e29b-41d4-a716-446655440000', name: '仕事' },
        { entry_id: '550e8400-e29b-41d4-a716-446655440000', name: '勉強' },
      ]);
    });

    it('重複日付エントリーが存在する場合に DuplicateDateEntryError をスローする', async () => {
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440001',
        '2026-02-08',
        'second',
      );

      const existingBuilder = createQueryBuilder({ data: null, error: null });
      const duplicateBuilder = createQueryBuilder({
        data: { id: '550e8400-e29b-41d4-a716-446655440000' },
        error: null,
      });

      mockFrom.mockReturnValueOnce(existingBuilder).mockReturnValueOnce(duplicateBuilder);

      await expect(repository.save(entry)).rejects.toThrow(DuplicateDateEntryError);
    });

    it('PostgreSQL 一意制約違反 (23505) を DuplicateDateEntryError に変換する', async () => {
      const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'hello');

      const existingBuilder = createQueryBuilder({ data: null, error: null });
      const duplicateBuilder = createQueryBuilder({ data: null, error: null });
      const insertBuilder = createQueryBuilder({
        data: null,
        error: { message: 'duplicate key', code: '23505' },
      });

      mockFrom
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(duplicateBuilder)
        .mockReturnValueOnce(insertBuilder);

      await expect(repository.save(entry)).rejects.toThrow(DuplicateDateEntryError);
    });

    it('既存確認クエリがエラーを返した場合に Error をスローする', async () => {
      const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'hello');

      const existingBuilder = createQueryBuilder({
        data: null,
        error: { message: 'connection error' },
      });

      mockFrom.mockReturnValueOnce(existingBuilder);

      await expect(repository.save(entry)).rejects.toThrow('connection error');
    });

    it('重複確認クエリがエラーを返した場合に Error をスローする', async () => {
      const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2026-02-08', 'hello');

      const existingBuilder = createQueryBuilder({ data: null, error: null });
      const duplicateBuilder = createQueryBuilder({
        data: null,
        error: { message: 'permission denied' },
      });

      mockFrom
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(duplicateBuilder);

      await expect(repository.save(entry)).rejects.toThrow('permission denied');
    });
  });

  describe('save() — 更新', () => {
    it('既存エントリーのコンテンツとタグを更新する', async () => {
      const entry = reconstructEntry(
        '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-08',
        'updated',
        ['new-tag'],
      );

      const existingBuilder = createQueryBuilder({
        data: { id: '550e8400-e29b-41d4-a716-446655440000' },
        error: null,
      });
      // update + deleteMany + insertTags それぞれのビルダー
      const updateBuilder = createQueryBuilder({ data: null, error: null });
      const deleteTagsBuilder = createQueryBuilder({ data: null, error: null });
      const insertTagsBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(updateBuilder)
        .mockReturnValueOnce(deleteTagsBuilder)
        .mockReturnValueOnce(insertTagsBuilder);

      await repository.save(entry);

      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'updated' }),
      );
      expect(deleteTagsBuilder.delete).toHaveBeenCalledTimes(1);
      expect(insertTagsBuilder.insert).toHaveBeenCalledWith([
        { entry_id: '550e8400-e29b-41d4-a716-446655440000', name: 'new-tag' },
      ]);
    });
  });

  describe('findById()', () => {
    it('存在する ID のエントリーを返す', async () => {
      const dbEntry = makeDbEntry({
        content: 'found entry',
        diary_entry_tags: [{ name: '仕事' }],
      });
      const builder = createQueryBuilder({ data: dbEntry, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(result).not.toBeNull();
      expect(result?.content).toBe('found entry');
      expect(result?.tags).toEqual(['仕事']);
    });

    it('存在しない ID に対して null を返す', async () => {
      const builder = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByDate()', () => {
    it('指定日付のエントリーを返す', async () => {
      const dbEntry = makeDbEntry({ content: 'found' });
      const builder = createQueryBuilder({ data: dbEntry, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findByDate(parseISODate('2026-02-08'));

      expect(result).not.toBeNull();
      expect(result?.content).toBe('found');
    });

    it('指定日付にエントリーがない場合 null を返す', async () => {
      const builder = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findByDate(parseISODate('2026-01-01'));

      expect(result).toBeNull();
    });
  });

  describe('findBySameDate()', () => {
    it('同じ月日のエントリーを日付降順で返す', async () => {
      const dbEntries = [
        makeDbEntry({
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: '2025-02-08T00:00:00.000Z',
          content: '2025',
        }),
        makeDbEntry({
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: '2024-02-08T00:00:00.000Z',
          content: '2024',
        }),
      ];
      const builder = createQueryBuilder({ data: dbEntries, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 2);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.content)).toEqual(['2025', '2024']);
    });

    it('years が 0 の場合は空配列を返し DB アクセスしない', async () => {
      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 0);

      expect(result).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('該当エントリーがない場合は空配列を返す', async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findBySameDate(parseISODate('2026-02-08'), 3);

      expect(result).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('存在するエントリーを削除する', async () => {
      const builder = createQueryBuilder({
        data: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      await expect(
        repository.delete('550e8400-e29b-41d4-a716-446655440000'),
      ).resolves.not.toThrow();
    });

    it('存在しない ID に対して NotFoundError をスローする', async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      await expect(repository.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findAll()', () => {
    it('全エントリーを日付降順で返す', async () => {
      const dbEntries = [
        makeDbEntry({
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: '2026-02-08T00:00:00.000Z',
          content: 'newer',
        }),
        makeDbEntry({
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: '2026-02-07T00:00:00.000Z',
          content: 'older',
        }),
      ];
      const builder = createQueryBuilder({ data: dbEntries, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('newer');
      expect(result[1].content).toBe('older');
    });

    it('エントリーがない場合は空配列を返す', async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });
});
