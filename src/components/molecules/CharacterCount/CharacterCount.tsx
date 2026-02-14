import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/lib/utils/cn';

export type CharacterCountProps = {
  content: string;
  maxLength?: number;
  warningThreshold?: number;
  className?: string;
};

export const CharacterCount = ({
  className,
  content,
  maxLength = 10_000,
  warningThreshold = 0.95,
}: CharacterCountProps) => {
  const count = content.length;
  const ratio = count / maxLength;
  const isOverLimit = count > maxLength;
  const isWarning = !isOverLimit && ratio >= warningThreshold;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          'text-gray-600',
          isWarning && 'text-yellow-700',
          isOverLimit && 'text-red-600',
        )}
      >
        文字数: {count.toLocaleString()} / {maxLength.toLocaleString()}
      </span>
      {isOverLimit && <Badge variant="error">上限超過</Badge>}
    </div>
  );
};
