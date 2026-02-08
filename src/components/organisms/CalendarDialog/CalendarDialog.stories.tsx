import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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

export const Open: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [date, setDate] = useState(new Date('2026-02-08T00:00:00.000Z'));

    return (
      <CalendarDialog
        open={open}
        selectedDate={date}
        maxDate={new Date('2026-02-08T00:00:00.000Z')}
        onClose={() => setOpen(false)}
        onSelect={setDate}
      />
    );
  },
};
