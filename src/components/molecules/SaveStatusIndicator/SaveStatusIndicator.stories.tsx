import type { Meta, StoryObj } from '@storybook/react';
import { SaveStatusIndicator } from './SaveStatusIndicator';

const meta = {
  title: 'Molecules/SaveStatusIndicator',
  component: SaveStatusIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SaveStatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: 'idle',
  },
};

export const Saving: Story = {
  args: {
    status: 'saving',
  },
};

export const Saved: Story = {
  args: {
    status: 'saved',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    errorMessage: '保存に失敗しました',
  },
};
