'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

export type TagInputProps = {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
};

export const TagInput = ({ className, onTagsChange, tags }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || tags.length >= MAX_TAGS || tags.includes(trimmed)) {
      return;
    }
    if (trimmed.length > MAX_TAG_LENGTH) {
      return;
    }
    onTagsChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
        >
          {tag}
          <button
            type="button"
            aria-label={`${tag}を削除`}
            onClick={() => removeTag(tag)}
            className="ml-0.5 text-blue-600 hover:text-blue-900"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        aria-label="タグを追加"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="タグを追加..."
        disabled={tags.length >= MAX_TAGS}
        className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-0.5 text-xs outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        maxLength={MAX_TAG_LENGTH}
      />
    </div>
  );
};
