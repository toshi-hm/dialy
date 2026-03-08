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
    expect(handleSave).toHaveBeenCalledWith('new content', []);
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
      expect(handleSave).toHaveBeenCalledWith('shortcut', []);
    });
  });

  it('saves with tags when tags are changed', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent="hello"
        initialTags={['仕事']}
        onSave={handleSave}
      />,
    );

    const tagInput = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(tagInput, { target: { value: '勉強' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('hello', ['仕事', '勉強']);
    });
  });

  it('saves with remaining tags when tag is removed', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent="hello"
        initialTags={['仕事', '勉強']}
        onSave={handleSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '仕事を削除' }));

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('hello', ['勉強']);
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
      expect(screen.getByText('文字数が上限を超えています')).toBeInTheDocument();
    });
  });

  it('shows fallback message when non-AppError is thrown on save', async () => {
    const handleSave = vi.fn().mockRejectedValue(new Error('network failure'));

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
      expect(screen.getByText('保存に失敗しました')).toBeInTheDocument();
    });
  });

  it('shows error when content exceeds maxLength without calling onSave', async () => {
    vi.useFakeTimers();
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <DiaryEditor
        date={new Date('2026-02-08T00:00:00.000Z')}
        initialContent=""
        onSave={handleSave}
        maxLength={10}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '日記本文' }), {
      target: { value: '12345678901' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(handleSave).not.toHaveBeenCalled();
    expect(screen.getByText('文字数が上限を超えています')).toBeInTheDocument();
  });
});
