'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchDiaryEntries } from '@/app/actions/diary';
import type { SerializedDiaryEntry } from '@/app/actions/types';
import { cn } from '@/lib/utils/cn';
import { debounce } from '@/lib/utils/debounce';

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

type HighlightedTextProps = {
  text: string;
  query: string;
};

const HighlightedText = ({ text, query }: HighlightedTextProps) => {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        // split の結果はキャプチャグループを含む場合、奇数インデックスが一致部分になる
        index % 2 === 1 ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: highlight parts, no stable key available
          <mark key={index} className="rounded bg-yellow-100 px-0.5 text-yellow-900">
            {part}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: highlight parts, no stable key available
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
};

export const SearchModal = ({ open, onClose, onSelectDate }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SerializedDiaryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchDiaryEntries(q);
      if (result.success) {
        setResults(result.data);
      } else {
        setResults([]);
      }
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      void doSearch(q);
    }, 400),
    [doSearch],
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    debouncedSearch(q);
  };

  const handleSelectEntry = (entry: SerializedDiaryEntry) => {
    onSelectDate(new Date(entry.date));
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="日記を検索"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="検索を閉じる"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-gray-200 px-4">
          <svg
            className="h-5 w-5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="日記を検索..."
            aria-label="検索キーワード"
            maxLength={200}
            className="w-full py-4 pl-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
          />
          {isSearching && (
            <span className="shrink-0 text-xs text-gray-400" aria-live="polite">
              検索中...
            </span>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 && (
            <ul aria-label="検索結果" className="divide-y divide-gray-100">
              {results.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectEntry(entry)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      'focus:bg-gray-50 focus:outline-none',
                    )}
                  >
                    <p className="mb-1 text-sm font-medium text-gray-900">
                      {formatDate(entry.date)}
                    </p>
                    <p className="line-clamp-2 text-sm text-gray-600">
                      <HighlightedText text={entry.content.slice(0, 150)} query={query} />
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                          >
                            <HighlightedText text={tag} query={query} />
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasSearched && results.length === 0 && !isSearching && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              「{query}」に一致する日記はありません
            </p>
          )}

          {!hasSearched && !isSearching && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">キーワードを入力して検索</p>
          )}
        </div>
      </div>
    </div>
  );
};
