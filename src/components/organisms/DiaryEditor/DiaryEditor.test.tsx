import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentTooLongError } from '@/types/errors';
import { DiaryEditor } from './DiaryEditor';

describe('DiaryEditor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto saves content after debounce', async () => {
    vi.useFakeTimers();
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent=""
        onSave={handleSave}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '日記本文' }), {
      target: { value: 'new content' },
    });

    expect(handleSave).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(handleSave).toHaveBeenCalledWith('new content');
  });

  it('triggers save immediately with cmd/ctrl+s', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent=""
        onSave={handleSave}
      />,
    );

    const textarea = screen.getByRole('textbox', { name: '日記本文' });
    fireEvent.change(textarea, { target: { value: 'shortcut' } });
    fireEvent.keyDown(textarea, { key: 's', ctrlKey: true });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('shortcut');
    });
  });

  it('calls onRequestDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent="existing"
        onSave={vi.fn().mockResolvedValue(undefined)}
        onRequestDelete={handleDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('shows specific message when AppError is thrown on save', async () => {
    const handleSave = vi.fn().mockRejectedValue(new ContentTooLongError());

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent=""
        onSave={handleSave}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '日記本文' }), {
      target: { value: 'new content' },
    });
    fireEvent.keyDown(screen.getByRole('textbox', { name: '日記本文' }), {
      key: 's',
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(screen.getByText('⚠ 文字数が上限を超えています')).toBeInTheDocument();
    });
  });
});
