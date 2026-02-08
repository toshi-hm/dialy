import type { Meta, StoryObj } from '@storybook/react';
import { DateDisplay } from './DateDisplay';

const meta = {
  title: 'Molecules/DateDisplay',
  component: DateDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DateDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {
  args: {
    date: new Date('2026-02-08T00:00:00.000Z'),
  },
};

export const LeapDay: Story = {
  args: {
    date: new Date('2024-02-29T00:00:00.000Z'),
  },
};
