import type { Meta, StoryObj } from '@storybook/react';
import { ExportButton } from './ExportButton';

const meta = {
  title: 'Organisms/ExportButton',
  component: ExportButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
