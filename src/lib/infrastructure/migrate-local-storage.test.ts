import { describe, expect, it, vi } from 'vitest';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { DuplicateDateEntryError, ValidationError } from '@/types/errors';
import { migrateFromLocalStorage } from './migrate-local-storage';

const makeRepository = () => {
  const save = vi.fn<DiaryRepository['save']>();
  const repository = {
    save,
  } as unknown as DiaryRepository;
  return { repository, save };
};

const validRaw = JSON.stringify({
  version: '1.0.0',
  entries: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      date: '2026-02-08T00:00:00.000Z',
      content: 'first',
      createdAt: '2026-02-08T00:00:00.000Z',
      updatedAt: '2026-02-08T00:00:00.000Z',
      tags: ['仕事'],
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-02-09T00:00:00.000Z',
      content: 'second',
      createdAt: '2026-02-09T00:00:00.000Z',
      updatedAt: '2026-02-09T00:00:00.000Z',
    },
  ],
});

describe('migrateFromLocalStorage', () => {
  it('raw が null の場合は何もしない', async () => {
    const { repository, save } = makeRepository();

    const result = await migrateFromLocalStorage(null, repository);

    expect(result).toEqual({ migrated: 0, skipped: 0 });
    expect(save).not.toHaveBeenCalled();
  });

  it('不正なJSONはスキップする', async () => {
    const { repository, save } = makeRepository();

    const result = await migrateFromLocalStorage('{invalid json}', repository);

    expect(result).toEqual({ migrated: 0, skipped: 0 });
    expect(save).not.toHaveBeenCalled();
  });

  it('正常なデータを全件移行する', async () => {
    const { repository, save } = makeRepository();
    save.mockResolvedValue(undefined);

    const result = await migrateFromLocalStorage(validRaw, repository);

    expect(result).toEqual({ migrated: 2, skipped: 0 });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2026-02-08T00:00:00.000Z'),
        content: 'first',
        createdAt: new Date('2026-02-08T00:00:00.000Z'),
        updatedAt: new Date('2026-02-08T00:00:00.000Z'),
        tags: ['仕事'],
      }),
    );
    expect(save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440001',
        date: new Date('2026-02-09T00:00:00.000Z'),
        content: 'second',
        createdAt: new Date('2026-02-09T00:00:00.000Z'),
        updatedAt: new Date('2026-02-09T00:00:00.000Z'),
        tags: [],
      }),
    );
  });

  it('重複エラーのエントリーはスキップして継続する', async () => {
    const { repository, save } = makeRepository();
    save
      .mockRejectedValueOnce(new DuplicateDateEntryError('An entry for this date already exists'))
      .mockResolvedValueOnce(undefined);

    const result = await migrateFromLocalStorage(validRaw, repository);

    expect(result).toEqual({ migrated: 1, skipped: 1 });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('バリデーションエラーのエントリーはスキップして継続する', async () => {
    const { repository, save } = makeRepository();
    save
      .mockRejectedValueOnce(new ValidationError('Invalid date'))
      .mockResolvedValueOnce(undefined);

    const result = await migrateFromLocalStorage(validRaw, repository);

    expect(result).toEqual({ migrated: 1, skipped: 1 });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('未知のエラーは再throwする', async () => {
    const { repository, save } = makeRepository();
    save.mockRejectedValueOnce(new Error('DB unavailable'));

    await expect(migrateFromLocalStorage(validRaw, repository)).rejects.toThrow('DB unavailable');
  });

  it('不正な日付文字列のエントリーはスキップして継続する', async () => {
    const { repository, save } = makeRepository();
    save.mockResolvedValue(undefined);
    const rawWithInvalidDate = JSON.stringify({
      version: '1.0.0',
      entries: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: 'invalid-date',
          content: 'invalid',
          createdAt: '2026-02-08T00:00:00.000Z',
          updatedAt: '2026-02-08T00:00:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: '2026-02-09T00:00:00.000Z',
          content: 'valid',
          createdAt: '2026-02-09T00:00:00.000Z',
          updatedAt: '2026-02-09T00:00:00.000Z',
        },
      ],
    });

    const result = await migrateFromLocalStorage(rawWithInvalidDate, repository);

    expect(result).toEqual({ migrated: 1, skipped: 1 });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
