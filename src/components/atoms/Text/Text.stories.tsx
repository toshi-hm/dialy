import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'select',
      options: ['p', 'span', 'small', 'strong', 'label'],
    },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'bold'],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '2月8日（日）',
  },
};

export const Muted: Story = {
  args: {
    children: '保存中...',
    tone: 'muted',
  },
};

export const Danger: Story = {
  args: {
    children: '保存に失敗しました',
    tone: 'danger',
    weight: 'medium',
  },
};

export const LargeBold: Story = {
  args: {
    children: '過去の同じ日の日記',
    size: 'lg',
    weight: 'bold',
  },
};
