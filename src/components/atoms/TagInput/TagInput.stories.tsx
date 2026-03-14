import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TagInput } from './TagInput';

const meta = {
  title: 'Atoms/TagInput',
  component: TagInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    tags: [],
    onTagsChange: () => undefined,
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const StatefulTagInput = ({ initialTags = [] }: { initialTags?: string[] }) => {
  const [tags, setTags] = useState(initialTags);

  return <TagInput tags={tags} onTagsChange={setTags} />;
};

export const Empty: Story = {
  render: () => <StatefulTagInput />,
};

export const WithTags: Story = {
  render: () => <StatefulTagInput initialTags={['仕事', '勉強', '振り返り']} />,
};

export const MaxTagsReached: Story = {
  render: () => (
    <StatefulTagInput initialTags={Array.from({ length: 10 }, (_, index) => `tag${index + 1}`)} />
  ),
};
