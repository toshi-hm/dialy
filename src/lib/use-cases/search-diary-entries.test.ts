import { describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { FetchFailedError, ValidationError } from '@/types/errors';
import { SearchDiaryEntriesUseCase } from './search-diary-entries';

const createRepositoryMock = (): DiaryRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByDate: vi.fn(),
  findBySameDate: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  search: vi.fn(),
});

const makeEntry = (id: string = 'entry-1'): DiaryEntry =>
  DiaryEntry.reconstruct(
    id,
    new Date('2026-02-08T00:00:00.000Z'),
    '日記の内容',
    new Date('2026-02-08T09:00:00.000Z'),
    new Date('2026-02-08T09:00:00.000Z'),
    ['タグ'],
  );

describe('SearchDiaryEntriesUseCase', () => {
  describe('execute', () => {
    it('空クエリに対して空配列を返す', async () => {
      const repo = createRepositoryMock();
      const useCase = new SearchDiaryEntriesUseCase(repo);

      const result = await useCase.execute('');

      expect(result).toEqual([]);
      expect(repo.search).not.toHaveBeenCalled();
    });

    it('空白のみのクエリに対して空配列を返す', async () => {
      const repo = createRepositoryMock();
      const useCase = new SearchDiaryEntriesUseCase(repo);

      const result = await useCase.execute('   ');

      expect(result).toEqual([]);
      expect(repo.search).not.toHaveBeenCalled();
    });

    it('200文字を超えるクエリに対してValidationErrorをスローする', async () => {
      const repo = createRepositoryMock();
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await expect(useCase.execute('a'.repeat(201))).rejects.toThrow(ValidationError);
    });

    it('200文字ちょうどのクエリは有効で検索を実行する', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockResolvedValue([]);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await useCase.execute('a'.repeat(200));

      expect(repo.search).toHaveBeenCalledOnce();
    });

    it('トリムされたクエリでrepository.searchを呼び出す', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockResolvedValue([]);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await useCase.execute('  hello world  ');

      expect(repo.search).toHaveBeenCalledWith('hello world', null);
    });

    it('userIdをrepository.searchに渡す', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockResolvedValue([]);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await useCase.execute('hello', 'user-123');

      expect(repo.search).toHaveBeenCalledWith('hello', 'user-123');
    });

    it('userIdを省略した場合にnullを渡す', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockResolvedValue([]);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await useCase.execute('hello');

      expect(repo.search).toHaveBeenCalledWith('hello', null);
    });

    it('リポジトリからの結果を返す', async () => {
      const repo = createRepositoryMock();
      const entries = [makeEntry('1'), makeEntry('2')];
      vi.mocked(repo.search).mockResolvedValue(entries);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      const result = await useCase.execute('日記');

      expect(result).toBe(entries);
      expect(result).toHaveLength(2);
    });

    it('リポジトリがエラーをスローした場合にFetchFailedErrorをスローする', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockRejectedValue(new Error('DB connection failed'));
      const useCase = new SearchDiaryEntriesUseCase(repo);

      await expect(useCase.execute('hello')).rejects.toThrow(FetchFailedError);
    });

    it('空の結果配列を返すことができる', async () => {
      const repo = createRepositoryMock();
      vi.mocked(repo.search).mockResolvedValue([]);
      const useCase = new SearchDiaryEntriesUseCase(repo);

      const result = await useCase.execute('存在しないキーワード');

      expect(result).toEqual([]);
    });
  });
});
