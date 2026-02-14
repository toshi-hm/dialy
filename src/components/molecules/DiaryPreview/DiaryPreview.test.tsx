import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { DiaryPreview } from './DiaryPreview';

const createEntry = (content: string): DiaryEntry => {
  return DiaryEntry.reconstruct(
    '550e8400-e29b-41d4-a716-446655440000',
    new Date('2025-02-08T00:00:00.000Z'),
    content,
    new Date('2025-02-08T00:00:00.000Z'),
    new Date('2025-02-08T00:00:00.000Z'),
  );
};

describe('DiaryPreview', () => {
  it('shows year, preview text and character count', () => {
    const entry = createEntry('a'.repeat(120));
    render(<DiaryPreview entry={entry} />);

    expect(screen.getByText('2025年')).toBeInTheDocument();
    expect(screen.getByText(/文字数: 120/)).toBeInTheDocument();
    expect(screen.getByText(/a{100}\.\.\./)).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', () => {
    const entry = createEntry('content');
    const handleToggle = vi.fn();
    render(<DiaryPreview entry={entry} onToggle={handleToggle} />);

    fireEvent.click(screen.getByRole('button', { name: '展開' }));

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('shows full content when expanded', () => {
    const entry = createEntry('full content');
    render(<DiaryPreview entry={entry} expanded onToggle={() => {}} />);

    expect(screen.getByText('full content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });
});
