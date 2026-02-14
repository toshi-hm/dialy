import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCount } from './CharacterCount';

const meta = {
  title: 'Molecules/CharacterCount',
  component: CharacterCount,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CharacterCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: '今日は設計書を読んで実装を進めた',
  },
};

export const Warning: Story = {
  args: {
    content: 'a'.repeat(9900),
  },
};

export const OverLimit: Story = {
  args: {
    content: 'a'.repeat(10020),
  },
};
