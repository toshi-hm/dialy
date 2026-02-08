import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '文字数: 120',
  },
};

export const Success: Story = {
  args: {
    children: '保存完了',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: '9,900 / 10,000',
    variant: 'warning',
  },
};

export const ErrorState: Story = {
  args: {
    children: '上限超過',
    variant: 'error',
  },
};
