import type { Meta, StoryObj } from '@storybook/react';
import { MainLayout } from './MainLayout';

const meta = {
  title: 'Templates/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sidebar: <div className="rounded-md border border-gray-200 bg-white p-4">Dial</div>,
    children: <div className="rounded-md border border-gray-200 bg-white p-6">Main Content</div>,
  },
};
