import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportButton } from './ExportButton';

const mockExportDiaryEntries = vi.fn();

vi.mock('@/app/actions/export', () => ({
  exportDiaryEntries: (...args: unknown[]) => mockExportDiaryEntries(...args),
}));

// URLオブジェクトのモック（jsdomはcreateObjectURLを実装していない）
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:fake-url');
const mockRevokeObjectURL = vi.fn();

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: mockCreateObjectURL,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
    writable: true,
    configurable: true,
  });

  // HTMLAnchorElement.prototype.click をモック（ブラウザダウンロードをシミュレート）
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('エクスポートボタンが表示される', () => {
    render(<ExportButton />);
    expect(screen.getByRole('button', { name: '日記をエクスポート' })).toBeInTheDocument();
    expect(screen.getByText('エクスポート')).toBeInTheDocument();
  });

  it('初期状態ではメニューが非表示', () => {
    render(<ExportButton />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ボタンをクリックするとメニューが表示される', () => {
    render(<ExportButton />);
    const button = screen.getByRole('button', { name: '日記をエクスポート' });

    fireEvent.click(button);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('JSON でエクスポート')).toBeInTheDocument();
    expect(screen.getByText('Markdown でエクスポート')).toBeInTheDocument();
  });

  it('再度ボタンをクリックするとメニューが閉じる', () => {
    render(<ExportButton />);
    const button = screen.getByRole('button', { name: '日記をエクスポート' });

    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('JSON でエクスポートをクリックするとexportDiaryEntriesが呼ばれる', async () => {
    mockExportDiaryEntries.mockResolvedValue({ success: true, data: '{"entries":[]}' });
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    fireEvent.click(screen.getByText('JSON でエクスポート'));

    await waitFor(() => {
      expect(mockExportDiaryEntries).toHaveBeenCalledWith('json');
    });
  });

  it('Markdown でエクスポートをクリックするとexportDiaryEntriesが呼ばれる', async () => {
    mockExportDiaryEntries.mockResolvedValue({ success: true, data: '# Dialy' });
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    fireEvent.click(screen.getByText('Markdown でエクスポート'));

    await waitFor(() => {
      expect(mockExportDiaryEntries).toHaveBeenCalledWith('markdown');
    });
  });

  it('エクスポート成功後にダウンロードリンクがクリックされる', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockExportDiaryEntries.mockResolvedValue({
      success: true,
      data: '{"version":1,"entries":[]}',
    });
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    fireEvent.click(screen.getByText('JSON でエクスポート'));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    clickSpy.mockRestore();
  });

  it('エクスポート中はボタンが無効化されてエクスポート中テキストが表示される', async () => {
    let resolveExport!: (value: unknown) => void;
    mockExportDiaryEntries.mockReturnValue(
      new Promise((resolve) => {
        resolveExport = resolve;
      }),
    );

    render(<ExportButton />);
    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    fireEvent.click(screen.getByText('JSON でエクスポート'));

    await waitFor(() => {
      expect(screen.getByText('エクスポート中...')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '日記をエクスポート' })).toBeDisabled();

    resolveExport({ success: true, data: '{}' });
    await waitFor(() => {
      expect(screen.getByText('エクスポート')).toBeInTheDocument();
    });
  });

  it('エクスポート失敗時にエラーメッセージが表示されダウンロードは実行されない', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockExportDiaryEntries.mockResolvedValue({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Export failed' },
    });
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    fireEvent.click(screen.getByText('JSON でエクスポート'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed');
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('classNameプロパティが適用される', () => {
    const { container } = render(<ExportButton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('エクスポートするとメニューが即座に閉じる', async () => {
    mockExportDiaryEntries.mockResolvedValue({ success: true, data: '{}' });
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: '日記をエクスポート' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('JSON でエクスポート'));

    // メニューはすぐに閉じる
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
