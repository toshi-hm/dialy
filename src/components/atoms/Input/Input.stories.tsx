import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    hasError: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: '今日の日記を書く...',
  },
};

export const WithValue: Story = {
  args: {
    value: '今日は設計書を更新した',
    readOnly: true,
  },
};

export const Error: Story = {
  args: {
    placeholder: '文字数が上限を超えています',
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '入力不可',
    disabled: true,
  },
};
