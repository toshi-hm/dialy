import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchModal } from './SearchModal';

const mockSearchDiaryEntries = vi.fn();

vi.mock('@/app/actions/diary', () => ({
  searchDiaryEntries: (...args: unknown[]) => mockSearchDiaryEntries(...args),
}));

// debounceをそのまま同期実行するモック（テストで遅延なし）
vi.mock('@/lib/utils/debounce', () => ({
  debounce: (fn: (...args: unknown[]) => unknown) => fn,
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSelectDate: vi.fn(),
};

const makeMockEntry = (id: string, date: string, content: string, tags: string[] = []) => ({
  id,
  date,
  content,
  tags,
  createdAt: date,
  updatedAt: date,
});

describe('SearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示制御', () => {
    it('open=falseの場合は何も表示しない', () => {
      render(<SearchModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('open=trueの場合はダイアログが表示される', () => {
      render(<SearchModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('検索入力フィールドが表示される', () => {
      render(<SearchModal {...defaultProps} />);

      expect(screen.getByRole('searchbox', { name: '検索キーワード' })).toBeInTheDocument();
    });

    it('初期状態でプレースホルダーテキストが表示される', () => {
      render(<SearchModal {...defaultProps} />);

      expect(screen.getByText('キーワードを入力して検索')).toBeInTheDocument();
    });
  });

  describe('キーボード操作', () => {
    it('Escapeキーを押すとonCloseが呼ばれる', () => {
      const onClose = vi.fn();
      render(<SearchModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('open=falseの時はEscapeキーでonCloseが呼ばれない', () => {
      const onClose = vi.fn();
      render(<SearchModal {...defaultProps} open={false} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('バックドロップ', () => {
    it('バックドロップをクリックするとonCloseが呼ばれる', () => {
      const onClose = vi.fn();
      render(<SearchModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByRole('button', { name: '検索を閉じる' });
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('検索機能', () => {
    it('テキスト入力で検索が実行される', async () => {
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: [] });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(mockSearchDiaryEntries).toHaveBeenCalledWith('日記');
      });
    });

    it('検索結果が表示される', async () => {
      const entries = [
        makeMockEntry('id-1', '2026-02-08T00:00:00.000Z', '今日の日記内容', ['タグ1']),
      ];
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: entries });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(screen.getByText('2026年2月8日')).toBeInTheDocument();
      });
    });

    it('検索結果にコンテンツが表示される', async () => {
      const entries = [makeMockEntry('id-1', '2026-02-08T00:00:00.000Z', '今日の日記内容です', [])];
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: entries });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(screen.getByText('今日の', { exact: false })).toBeInTheDocument();
      });
    });

    it('検索結果にタグが表示される', async () => {
      const entries = [
        makeMockEntry('id-1', '2026-02-08T00:00:00.000Z', '日記内容', ['仕事', '勉強']),
      ];
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: entries });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(screen.getByText('仕事')).toBeInTheDocument();
        expect(screen.getByText('勉強')).toBeInTheDocument();
      });
    });

    it('検索結果なしの場合にメッセージが表示される', async () => {
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: [] });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '存在しないキーワード' } });

      await waitFor(() => {
        expect(
          screen.getByText(/「存在しないキーワード」に一致する日記はありません/),
        ).toBeInTheDocument();
      });
    });

    it('検索結果のエントリーをクリックするとonSelectDateとonCloseが呼ばれる', async () => {
      const onSelectDate = vi.fn();
      const onClose = vi.fn();
      const entries = [makeMockEntry('id-1', '2026-02-08T00:00:00.000Z', '日記内容', [])];
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: entries });
      render(<SearchModal {...defaultProps} onSelectDate={onSelectDate} onClose={onClose} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(screen.getByText('2026年2月8日')).toBeInTheDocument();
      });

      const entryButton = screen.getByText('2026年2月8日').closest('button');
      if (!entryButton) throw new Error('Entry button not found');
      fireEvent.click(entryButton);

      expect(onSelectDate).toHaveBeenCalledWith(new Date('2026-02-08T00:00:00.000Z'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('検索失敗時は結果を空にする', async () => {
      mockSearchDiaryEntries.mockResolvedValue({
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed' },
      });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        expect(screen.getByText(/に一致する日記はありません/)).toBeInTheDocument();
      });
    });

    it('空文字に戻した場合は結果がクリアされる', async () => {
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: [] });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      // 一度検索
      fireEvent.change(input, { target: { value: '日記' } });
      await waitFor(() => expect(mockSearchDiaryEntries).toHaveBeenCalled());

      // 空にする
      fireEvent.change(input, { target: { value: '' } });

      // プレースホルダーテキストに戻る
      await waitFor(() => {
        expect(screen.getByText('キーワードを入力して検索')).toBeInTheDocument();
      });
    });
  });

  describe('ハイライト表示', () => {
    it('検索キーワードがハイライトされる', async () => {
      const entries = [makeMockEntry('id-1', '2026-02-08T00:00:00.000Z', '今日は日記を書いた', [])];
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: entries });
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '日記' } });

      await waitFor(() => {
        const marks = document.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
        expect(marks[0].textContent).toContain('日記');
      });
    });
  });

  describe('openの変化', () => {
    it('openがtrueになった時にクエリがリセットされる', async () => {
      mockSearchDiaryEntries.mockResolvedValue({ success: true, data: [] });
      const { rerender } = render(<SearchModal {...defaultProps} open={false} />);

      rerender(<SearchModal {...defaultProps} open={true} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });
});
