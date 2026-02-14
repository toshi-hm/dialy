import type { Meta, StoryObj } from '@storybook/react';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { PastEntriesList } from './PastEntriesList';

const entries = [
  DiaryEntry.reconstruct(
    '1',
    new Date('2025-02-08T00:00:00.000Z'),
    '1年前の今日は新しいプロジェクトを始めた。',
    new Date('2025-02-08T00:00:00.000Z'),
    new Date('2025-02-08T00:00:00.000Z'),
  ),
  DiaryEntry.reconstruct(
    '2',
    new Date('2024-02-08T00:00:00.000Z'),
    '2年前は東京に旅行へ行った。',
    new Date('2024-02-08T00:00:00.000Z'),
    new Date('2024-02-08T00:00:00.000Z'),
  ),
];

const meta = {
  title: 'Organisms/PastEntriesList',
  component: PastEntriesList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PastEntriesList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entries,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
