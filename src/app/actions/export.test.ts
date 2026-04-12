import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

vi.mock('@/lib/auth/get-server-session', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue(null),
}));

const mockRepository: DiaryRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByDate: vi.fn(),
  findBySameDate: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  search: vi.fn(),
};

vi.mock('@/lib/infrastructure/supabase-client', () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({}),
}));

vi.mock('@/lib/infrastructure/supabase-diary-repository', () => ({
  SupabaseDiaryRepository: class {
    save = mockRepository.save;
    findById = mockRepository.findById;
    findByDate = mockRepository.findByDate;
    findBySameDate = mockRepository.findBySameDate;
    delete = mockRepository.delete;
    findAll = mockRepository.findAll;
    search = mockRepository.search;
  },
}));

const { exportDiaryEntries } = await import('./export');

const makeEntry = (id: string, date: string, content: string, tags: string[] = []): DiaryEntry => {
  const d = new Date(date);
  return DiaryEntry.reconstruct(id, d, content, d, d, tags);
};

describe('exportDiaryEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JSON形式', () => {
    it('エントリーをJSON形式でエクスポートする', async () => {
      const entries = [
        makeEntry('id-1', '2026-01-15T00:00:00.000Z', '1月の日記', ['日常']),
        makeEntry('id-2', '2026-02-08T00:00:00.000Z', '2月の日記', []),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(entries);

      const result = await exportDiaryEntries('json');

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data);
        expect(parsed.version).toBe(1);
        expect(parsed.exportedAt).toBeDefined();
        expect(parsed.entries).toHaveLength(2);
        expect(parsed.entries[0].id).toBe('id-1');
        expect(parsed.entries[0].content).toBe('1月の日記');
        expect(parsed.entries[0].tags).toEqual(['日常']);
        expect(parsed.entries[1].id).toBe('id-2');
      }
    });

    it('デフォルトフォーマット（引数なし）はJSONを返す', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      const result = await exportDiaryEntries();

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data);
        expect(parsed.version).toBe(1);
        expect(parsed.entries).toEqual([]);
      }
    });

    it('エントリーが空の場合でもJSON形式でエクスポートできる', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      const result = await exportDiaryEntries('json');

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data);
        expect(parsed.entries).toEqual([]);
      }
    });
  });

  describe('Markdown形式', () => {
    it('エントリーをMarkdown形式でエクスポートする', async () => {
      const entries = [
        makeEntry('id-1', '2026-01-15T00:00:00.000Z', '1月の日記内容', ['タグA']),
        makeEntry('id-2', '2026-02-08T00:00:00.000Z', '2月の日記内容', []),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(entries);

      const result = await exportDiaryEntries('markdown');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('# Dialy エクスポート');
        expect(result.data).toContain('## 2026-01-15');
        expect(result.data).toContain('1月の日記内容');
        expect(result.data).toContain('タグ: `タグA`');
        expect(result.data).toContain('## 2026-02-08');
        expect(result.data).toContain('2月の日記内容');
      }
    });

    it('タグなしのエントリーにはタグ行を含めない', async () => {
      const entries = [makeEntry('id-1', '2026-01-15T00:00:00.000Z', '日記内容', [])];
      vi.mocked(mockRepository.findAll).mockResolvedValue(entries);

      const result = await exportDiaryEntries('markdown');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toContain('タグ:');
      }
    });

    it('複数タグを持つエントリーのMarkdownフォーマット', async () => {
      const entries = [
        makeEntry('id-1', '2026-01-15T00:00:00.000Z', '日記内容', ['仕事', '勉強', '日常']),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(entries);

      const result = await exportDiaryEntries('markdown');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('`仕事`');
        expect(result.data).toContain('`勉強`');
        expect(result.data).toContain('`日常`');
      }
    });

    it('エントリーが日付順にソートされる', async () => {
      const entries = [
        makeEntry('id-2', '2026-03-01T00:00:00.000Z', '3月の日記', []),
        makeEntry('id-1', '2026-01-15T00:00:00.000Z', '1月の日記', []),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(entries);

      const result = await exportDiaryEntries('markdown');

      expect(result.success).toBe(true);
      if (result.success) {
        const idx1 = result.data.indexOf('2026-01-15');
        const idx3 = result.data.indexOf('2026-03-01');
        expect(idx1).toBeLessThan(idx3);
      }
    });
  });

  describe('エラーハンドリング', () => {
    it('リポジトリエラー時にfailureを返す', async () => {
      vi.mocked(mockRepository.findAll).mockRejectedValue(new Error('DB Error'));

      const result = await exportDiaryEntries('json');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
        expect(result.error.message).toBe('Export failed');
      }
    });
  });
});
