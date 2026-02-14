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
const demoDate = new Date('2026-02-08T00:00:00.000Z');

const StatefulDial = () => {
  const [selectedDate, setSelectedDate] = useState(demoDate);

  return (
    <Dial
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      maxDate={new Date('2026-02-10T00:00:00.000Z')}
    />
  );
};

export const Default: Story = {
  args: {
    selectedDate: demoDate,
    onDateChange: () => undefined,
  },
  render: () => <StatefulDial />,
};

export const Small: Story = {
  args: {
    selectedDate: demoDate,
    onDateChange: () => undefined,
  },
  render: () => {
    const [selectedDate, setSelectedDate] = useState(demoDate);
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
