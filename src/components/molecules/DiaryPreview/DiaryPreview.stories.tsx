import type { Meta, StoryObj } from '@storybook/react';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { DiaryPreview } from './DiaryPreview';

const sampleEntry = DiaryEntry.reconstruct(
  '550e8400-e29b-41d4-a716-446655440000',
  new Date('2025-02-08T00:00:00.000Z'),
  '1年前の今日は新しいプロジェクトを始めた。技術スタックはNext.jsとReactで、とても楽しみだ。',
  new Date('2025-02-08T00:00:00.000Z'),
  new Date('2025-02-08T00:00:00.000Z'),
  ['振り返り', '開発'],
);

const meta = {
  title: 'Molecules/DiaryPreview',
  component: DiaryPreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onToggle: { action: 'toggle clicked' },
  },
} satisfies Meta<typeof DiaryPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    entry: sampleEntry,
    expanded: false,
  },
};

export const Expanded: Story = {
  args: {
    entry: sampleEntry,
    expanded: true,
  },
};

export const WithoutTags: Story = {
  args: {
    entry: DiaryEntry.reconstruct(
      '550e8400-e29b-41d4-a716-446655440001',
      new Date('2024-02-08T00:00:00.000Z'),
      'タグなしの日記です。',
      new Date('2024-02-08T00:00:00.000Z'),
      new Date('2024-02-08T00:00:00.000Z'),
    ),
    expanded: false,
  },
};
