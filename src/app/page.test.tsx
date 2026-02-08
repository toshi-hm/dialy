import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Home from './page';

const STORAGE_KEY = 'dialy_entries';

describe('Home page integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows today date by default', async () => {
    render(<Home />);

    expect(await screen.findByText(/\d+月\d+日（[日月火水木金土]）/)).toBeInTheDocument();
  });

  it('auto saves content to localStorage after 1 second debounce', async () => {
    render(<Home />);

    const textarea = await screen.findByRole('textbox', { name: '日記本文' });
    fireEvent.change(textarea, { target: { value: '今日は統合テストを書いた' } });

    await waitFor(
      () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toContain('今日は統合テストを書いた');
      },
      { timeout: 2500 },
    );
  });

  it('shows error when trying to move dial to future date', async () => {
    render(<Home />);

    const dial = await screen.findByRole('slider', { name: '日付選択' });
    fireEvent.keyDown(dial, { key: 'ArrowRight' });

    expect(await screen.findByRole('alert')).toHaveTextContent('未来の日付は選択できません');
  });

  it('shows same-date past entries list', async () => {
    const now = new Date();
    const previousYear = now.getFullYear() - 1;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const date = `${previousYear}-${month}-${day}`;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        entries: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            date,
            content: '1年前の記録',
            createdAt: `${date}T00:00:00.000Z`,
            updatedAt: `${date}T00:00:00.000Z`,
          },
        ],
      }),
    );

    render(<Home />);

    expect(await screen.findByText(`${previousYear}年`)).toBeInTheDocument();
    expect(screen.getByText('過去の同じ日の日記')).toBeInTheDocument();
  });
});
