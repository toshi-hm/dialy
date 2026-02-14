import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CalendarDialog } from './CalendarDialog';

const meta = {
  title: 'Organisms/CalendarDialog',
  component: CalendarDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarDialog>;

export default meta;
type Story = StoryObj<typeof meta>;
const demoDate = new Date('2026-02-08T00:00:00.000Z');

export const Open: Story = {
  args: {
    open: true,
    selectedDate: demoDate,
    maxDate: demoDate,
    onClose: () => undefined,
    onSelect: () => undefined,
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    const [date, setDate] = useState(demoDate);

    return (
      <CalendarDialog
        {...args}
        open={open}
        selectedDate={date}
        onClose={() => setOpen(false)}
        onSelect={setDate}
      />
    );
  },
};
