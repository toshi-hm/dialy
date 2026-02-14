import type { Meta, StoryObj } from '@storybook/react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

const meta = {
  title: 'Organisms/DeleteConfirmDialog',
  component: DeleteConfirmDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onCancel: () => {},
    onConfirm: async () => {},
  },
};
