'use client';

import { useMemo, useState } from 'react';
import { DiaryPreview } from '@/components/molecules';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { cn } from '@/lib/utils/cn';

export interface PastEntriesListProps {
  entries: DiaryEntry[];
  className?: string;
}

export function PastEntriesList({ className, entries }: PastEntriesListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const sortedEntries = useMemo(
    () => [...entries].sort((left, right) => right.date.getTime() - left.date.getTime()),
    [entries],
  );

  const toggle = (id: string) => {
    setExpandedIds((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold text-gray-900">過去の同じ日の日記</h2>
      {sortedEntries.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          過去の日記はまだありません
        </p>
      )}
      {sortedEntries.map((entry) => (
        <DiaryPreview
          key={entry.id}
          entry={entry}
          expanded={Boolean(expandedIds[entry.id])}
          onToggle={() => toggle(entry.id)}
        />
      ))}
    </section>
  );
}
