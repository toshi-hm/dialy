import { Icon } from '@/components/atoms/Icon';
import { cn } from '@/lib/utils/cn';
import type { SaveStatus } from '@/types/diary';

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
  errorMessage?: string;
  className?: string;
}

export function SaveStatusIndicator({
  className,
  errorMessage = '保存に失敗しました',
  status,
}: SaveStatusIndicatorProps) {
  const contentByStatus: Record<SaveStatus, JSX.Element | null> = {
    idle: null,
    saving: (
      <span className="inline-flex items-center gap-1 text-gray-600">
        <Icon name="clock" label="保存中" size={14} />
        保存中...
      </span>
    ),
    saved: (
      <span className="inline-flex items-center gap-1 text-green-700">
        <Icon name="check" label="保存完了" size={14} />✓ 保存しました
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-1 text-red-600">
        <Icon name="alert" label="保存エラー" size={14} />⚠ {errorMessage}
      </span>
    ),
  };

  return (
    <output aria-live="polite" className={cn('min-h-5 text-sm', className)}>
      {contentByStatus[status]}
    </output>
  );
}
