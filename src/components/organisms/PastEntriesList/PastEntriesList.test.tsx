import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { PastEntriesList } from './PastEntriesList';

const entry = (id: string, date: string, content: string, tags: string[] = []): DiaryEntry => {
  return DiaryEntry.reconstruct(
    id,
    new Date(`${date}T00:00:00.000Z`),
    content,
    new Date(`${date}T00:00:00.000Z`),
    new Date(`${date}T00:00:00.000Z`),
    tags,
  );
};

describe('PastEntriesList', () => {
  it('renders empty message when no entries', () => {
    render(<PastEntriesList entries={[]} />);

    expect(screen.getByText('過去の日記はまだありません')).toBeInTheDocument();
  });

  it('renders entries and toggles expansion', () => {
    const entries = [entry('1', '2025-02-08', 'one'), entry('2', '2024-02-08', 'two')];
    render(<PastEntriesList entries={entries} />);

    expect(screen.getByText('2025年')).toBeInTheDocument();
    expect(screen.getByText('2024年')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '展開' })[0]);

    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });

  it('renders tags in each preview', () => {
    const entries = [entry('1', '2025-02-08', 'one', ['仕事', '勉強'])];
    render(<PastEntriesList entries={entries} />);

    expect(screen.getByText('#仕事')).toBeInTheDocument();
    expect(screen.getByText('#勉強')).toBeInTheDocument();
  });
});
