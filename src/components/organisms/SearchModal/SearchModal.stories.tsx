import type { Meta, StoryObj } from '@storybook/react';
import { SearchModal } from './SearchModal';

const meta = {
  title: 'Organisms/SearchModal',
  component: SearchModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: () => {},
    onSelectDate: () => {},
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => {},
    onSelectDate: () => {},
  },
};
