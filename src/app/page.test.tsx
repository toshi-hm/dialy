import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedDiaryEntry } from '@/app/actions/types';
import HomeContent from './HomeContent';

// Server Actions をモック化
vi.mock('@/app/actions/diary', () => ({
  createDiaryEntry: vi.fn(),
  updateDiaryEntry: vi.fn(),
  deleteDiaryEntry: vi.fn(),
  getDiaryEntry: vi.fn(),
  getEntriesBySameDate: vi.fn(),
}));

// 移行ユーティリティをモック化（テスト中は移行済みと見なす）
vi.mock('@/lib/infrastructure/migrate-local-storage', () => ({
  hasMigrated: vi.fn().mockReturnValue(true),
  markAsMigrated: vi.fn(),
  migrateFromLocalStorage: vi.fn().mockResolvedValue({ migrated: 0, skipped: 0, errors: 0 }),
}));

import {
  createDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntry,
  getEntriesBySameDate,
  updateDiaryEntry,
} from '@/app/actions/diary';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const makeEntry = (overrides: Partial<SerializedDiaryEntry> = {}): SerializedDiaryEntry => {
  const now = new Date();
  const dateIso = now.toISOString();
  return {
    id: VALID_UUID,
    date: dateIso,
    content: '',
    createdAt: dateIso,
    updatedAt: dateIso,
    tags: [],
    ...overrides,
  };
};

const makeActionSuccess = <T,>(data: T) => ({ success: true as const, data });
const emptySuccess = makeActionSuccess<SerializedDiaryEntry | null>(null);
const emptyListSuccess = makeActionSuccess<SerializedDiaryEntry[]>([]);

describe('Home page integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getDiaryEntry).mockResolvedValue(emptySuccess);
    vi.mocked(getEntriesBySameDate).mockResolvedValue(emptyListSuccess);
    vi.mocked(createDiaryEntry).mockResolvedValue(makeActionSuccess(makeEntry()));
    vi.mocked(updateDiaryEntry).mockResolvedValue(makeActionSuccess(makeEntry()));
    vi.mocked(deleteDiaryEntry).mockResolvedValue(makeActionSuccess(null));
  });

  it('shows today date by default', async () => {
    render(<HomeContent />);

    expect(await screen.findByText(/\d+月\d+日（[日月火水木金土]）/)).toBeInTheDocument();
  });

  it('auto saves content via Server Action after 1 second debounce', async () => {
    const savedEntry = makeEntry({ content: '今日は統合テストを書いた' });
    vi.mocked(createDiaryEntry).mockResolvedValue(makeActionSuccess(savedEntry));

    render(<HomeContent />);

    const textarea = await screen.findByRole('textbox', { name: '日記本文' });
    fireEvent.change(textarea, { target: { value: '今日は統合テストを書いた' } });

    await waitFor(
      () => {
        expect(createDiaryEntry).toHaveBeenCalledWith(
          expect.any(String),
          '今日は統合テストを書いた',
          expect.any(Array),
        );
      },
      { timeout: 2500 },
    );
  });

  it('saves tags and restores them after remount', async () => {
    const entryWithTag = makeEntry({ tags: ['仕事'] });
    vi.mocked(createDiaryEntry).mockResolvedValue(makeActionSuccess(entryWithTag));

    const { unmount } = render(<HomeContent />);

    const tagInput = await screen.findByPlaceholderText('タグを追加...');
    fireEvent.change(tagInput, { target: { value: '仕事' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    await waitFor(
      () => {
        expect(createDiaryEntry).toHaveBeenCalledWith(expect.any(String), expect.any(String), [
          '仕事',
        ]);
      },
      { timeout: 2500 },
    );

    // リマウント後 getDiaryEntry はタグ付きエントリーを返す
    vi.mocked(getDiaryEntry).mockResolvedValue(makeActionSuccess(entryWithTag));

    unmount();
    render(<HomeContent />);

    expect(await screen.findByRole('button', { name: '仕事を削除' })).toBeInTheDocument();
  });

  it('shows error when trying to move dial to future date', async () => {
    render(<HomeContent />);

    const dial = await screen.findByRole('slider', { name: '日付選択' });
    fireEvent.keyDown(dial, { key: 'ArrowRight' });

    expect(await screen.findByRole('alert')).toHaveTextContent('未来の日付は選択できません');
  });

  it('shows same-date past entries list', async () => {
    const now = new Date();
    const previousYear = now.getFullYear() - 1;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const pastDate = `${previousYear}-${month}-${day}T00:00:00.000Z`;

    const pastEntry = makeEntry({
      id: '550e8400-e29b-41d4-a716-446655440001',
      date: pastDate,
      content: '1年前の記録',
      createdAt: pastDate,
      updatedAt: pastDate,
    });

    vi.mocked(getEntriesBySameDate).mockResolvedValue(makeActionSuccess([pastEntry]));

    render(<HomeContent />);

    expect(await screen.findByText(`${previousYear}年`)).toBeInTheDocument();
    expect(screen.getByText('過去の同じ日の日記')).toBeInTheDocument();
  });

  it('deletes entry via delete confirm dialog', async () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateIso = `${now.getFullYear()}-${month}-${day}T00:00:00.000Z`;
    const todayEntry = makeEntry({ date: dateIso, content: '削除する日記' });

    vi.mocked(getDiaryEntry).mockResolvedValue(makeActionSuccess(todayEntry));
    vi.mocked(deleteDiaryEntry).mockResolvedValue(makeActionSuccess(null));

    render(<HomeContent />);

    const textarea = await screen.findByRole('textbox', { name: '日記本文' });
    expect(textarea).toHaveValue('削除する日記');

    const deleteButton = await screen.findByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: '削除する' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '日記本文' })).toHaveValue('');
    });
  });

  it('adjusts dial size on window resize', async () => {
    render(<HomeContent />);

    await screen.findByRole('slider', { name: '日付選択' });

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    const dial = screen.getByRole('slider', { name: '日付選択' });
    expect(dial).toBeInTheDocument();
  });

  it('shows error message when getDiaryEntry fails', async () => {
    vi.mocked(getDiaryEntry).mockRejectedValue(new Error('network error'));

    render(<HomeContent />);

    expect(await screen.findByRole('alert')).toHaveTextContent('データの読み込みに失敗しました');
  });

  it('shows delete error when deleteDiaryEntry returns failure', async () => {
    const todayEntry = makeEntry({ content: '削除テスト' });
    vi.mocked(getDiaryEntry).mockResolvedValue(makeActionSuccess(todayEntry));
    vi.mocked(deleteDiaryEntry).mockResolvedValue({
      success: false as const,
      error: { code: 'NOT_FOUND', message: 'not found' },
    });

    render(<HomeContent />);

    const deleteButton = await screen.findByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: '削除する' });
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('削除に失敗しました');
  });

  it(
    'shows save error when createDiaryEntry returns SaveFailed',
    async () => {
      vi.mocked(createDiaryEntry).mockResolvedValue({
        success: false as const,
        error: { code: 'SAVE_FAILED', message: 'save failed' },
      });

      render(<HomeContent />);

      const textarea = await screen.findByRole('textbox', { name: '日記本文' });
      fireEvent.change(textarea, { target: { value: '保存失敗テスト' } });

      // 1秒のデバウンス後に最初の呼び出し、その後3回のリトライ（250+500+1000ms）が行われる。
      // タイムアウトはデバウンス+リトライ総計（約2750ms）を超える値を設定する。
      await waitFor(
        () => {
          expect(createDiaryEntry).toHaveBeenCalledTimes(4); // 初回 + 3回リトライ
        },
        { timeout: 4000 },
      );

      // リトライ後にエラーメッセージが SaveStatusIndicator 経由で表示される
      expect(screen.getByText('保存に失敗しました。再度お試しください。')).toBeInTheDocument();
    },
    10_000, // リトライ待機のためテストタイムアウトを延長
  );
});
