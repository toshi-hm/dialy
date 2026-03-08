import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DiaryEditor } from './DiaryEditor';

const meta = {
  title: 'Organisms/DiaryEditor',
  component: DiaryEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DiaryEditor>;

export default meta;
type Story = StoryObj<typeof meta>;
const demoDate = new Date('2026-02-08T00:00:00.000Z');

const StatefulDiaryEditor = () => {
  const [content, setContent] = useState('今日は設計書を更新した。');
  const [tags, setTags] = useState(['設計', 'TDD']);

  return (
    <DiaryEditor
      date={demoDate}
      initialContent={content}
      initialTags={tags}
      onSave={async (value, newTags) => {
        setContent(value);
        setTags(newTags);
      }}
      onRequestDelete={() => {
        setContent('');
        setTags([]);
      }}
    />
  );
};

export const Default: Story = {
  args: {
    date: demoDate,
    onSave: async (_content, _tags) => undefined,
  },
  render: () => <StatefulDiaryEditor />,
};

export const Empty: Story = {
  args: {
    date: demoDate,
    initialContent: '',
    initialTags: [],
    onSave: async (_content, _tags) => undefined,
  },
};
