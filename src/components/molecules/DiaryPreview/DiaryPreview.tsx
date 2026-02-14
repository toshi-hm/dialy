import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { cn } from '@/lib/utils/cn';

export type DiaryPreviewProps = {
  entry: DiaryEntry;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
};

export const DiaryPreview = ({
  className,
  entry,
  expanded = false,
  onToggle,
}: DiaryPreviewProps) => {
  const text = expanded ? entry.content : entry.getPreviewText(100);
  const toggleLabel = expanded ? '閉じる' : '展開';

  return (
    <article className={cn('rounded-md border border-gray-200 bg-white p-4 shadow-sm', className)}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{entry.getYear()}年</h3>
        {onToggle && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            {toggleLabel}
          </Button>
        )}
      </header>
      <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
        {text}
      </p>
      <Badge variant="default">文字数: {entry.getCharacterCount().toLocaleString()}</Badge>
    </article>
  );
};
