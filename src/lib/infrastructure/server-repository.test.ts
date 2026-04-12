import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('server-repository', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getRepository', () => {
    it('Supabaseが未設定の場合はInMemoryDiaryRepositoryを返す', async () => {
      const mockClearAll = vi.fn();
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => false,
        getSupabaseClient: () => ({}),
      }));
      vi.doMock('@/lib/infrastructure/in-memory-diary-repository', () => {
        class InMemoryDiaryRepository {
          clearAll = mockClearAll;
        }
        return { InMemoryDiaryRepository };
      });

      const { getRepository } = await import('./server-repository');
      const repo = await getRepository();

      expect(repo).toBeDefined();
      expect(typeof (repo as { clearAll?: unknown }).clearAll).toBe('function');
    });

    it('同じリポジトリインスタンスをキャッシュして返す', async () => {
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => false,
        getSupabaseClient: () => ({}),
      }));
      vi.doMock('@/lib/infrastructure/in-memory-diary-repository', () => {
        class InMemoryDiaryRepository {
          clearAll = vi.fn();
        }
        return { InMemoryDiaryRepository };
      });

      const { getRepository } = await import('./server-repository');
      const repo1 = await getRepository();
      const repo2 = await getRepository();

      expect(repo1).toBe(repo2);
    });

    it('Supabaseが設定されている場合はSupabaseDiaryRepositoryを返す', async () => {
      const mockFindAll = vi.fn();
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => true,
        getSupabaseClient: () => ({}),
      }));
      vi.doMock('@/lib/infrastructure/supabase-diary-repository', () => {
        class SupabaseDiaryRepository {
          findAll = mockFindAll;
        }
        return { SupabaseDiaryRepository };
      });

      const { getRepository } = await import('./server-repository');
      const repo = await getRepository();

      expect(repo).toBeDefined();
      expect(typeof (repo as { findAll?: unknown }).findAll).toBe('function');
    });
  });

  describe('clearRepositoryForTesting', () => {
    it('リポジトリが未初期化の場合は何もしない', async () => {
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => false,
      }));

      const { clearRepositoryForTesting } = await import('./server-repository');

      // リポジトリ未初期化状態でclearを呼んでも例外が出ない
      expect(() => clearRepositoryForTesting()).not.toThrow();
    });

    it('clearAllを持つリポジトリに対してclearAllを呼び出す', async () => {
      const mockClearAll = vi.fn();
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => false,
        getSupabaseClient: () => ({}),
      }));
      vi.doMock('@/lib/infrastructure/in-memory-diary-repository', () => {
        class InMemoryDiaryRepository {
          clearAll = mockClearAll;
        }
        return { InMemoryDiaryRepository };
      });

      const { getRepository, clearRepositoryForTesting } = await import('./server-repository');
      await getRepository(); // リポジトリを初期化

      clearRepositoryForTesting();

      expect(mockClearAll).toHaveBeenCalledOnce();
    });

    it('clearAllを持たないリポジトリに対しては何もしない', async () => {
      vi.doMock('@/lib/infrastructure/supabase-client', () => ({
        isSupabaseConfigured: () => true,
        getSupabaseClient: () => ({}),
      }));
      vi.doMock('@/lib/infrastructure/supabase-diary-repository', () => {
        class SupabaseDiaryRepository {
          findAll = vi.fn();
          // clearAll を持たない
        }
        return { SupabaseDiaryRepository };
      });

      const { getRepository, clearRepositoryForTesting } = await import('./server-repository');
      await getRepository();

      // clearAllがなくても例外が出ない
      expect(() => clearRepositoryForTesting()).not.toThrow();
    });
  });
});
