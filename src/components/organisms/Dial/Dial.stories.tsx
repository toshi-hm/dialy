import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dial } from './Dial';

const meta = {
  title: 'Organisms/Dial',
  component: Dial,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dial>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulDial() {
  const [selectedDate, setSelectedDate] = useState(new Date('2026-02-08T00:00:00.000Z'));

  return (
    <Dial
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      maxDate={new Date('2026-02-10T00:00:00.000Z')}
    />
  );
}

export const Default: Story = {
  render: () => <StatefulDial />,
};

export const Small: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState(new Date('2026-02-08T00:00:00.000Z'));
    return (
      <Dial
        size={80}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        maxDate={new Date('2026-02-10T00:00:00.000Z')}
      />
    );
  },
};
