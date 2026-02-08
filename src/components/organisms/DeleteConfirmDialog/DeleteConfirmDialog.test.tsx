import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('renders dialog when open', () => {
    render(
      <DeleteConfirmDialog
        open
        onCancel={() => {}}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole('dialog', { name: '日記を削除' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const handleCancel = vi.fn();
    render(
      <DeleteConfirmDialog
        open
        onCancel={handleCancel}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteConfirmDialog open onCancel={() => {}} onConfirm={handleConfirm} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '削除する' }));
    });
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
