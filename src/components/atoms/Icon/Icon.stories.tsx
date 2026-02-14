import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: ['calendar', 'clock', 'check', 'alert', 'trash'],
    },
    size: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Calendar: Story = {
  args: {
    name: 'calendar',
    label: 'カレンダー',
    size: 20,
  },
};

export const Check: Story = {
  args: {
    name: 'check',
    label: '保存完了',
    className: 'text-green-600',
    size: 20,
  },
};

export const Alert: Story = {
  args: {
    name: 'alert',
    label: 'エラー',
    className: 'text-red-600',
    size: 20,
  },
};
