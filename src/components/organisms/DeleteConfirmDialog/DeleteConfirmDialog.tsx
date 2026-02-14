'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils/cn';

export type DeleteConfirmDialogProps = {
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  className?: string;
};

export const DeleteConfirmDialog = ({
  className,
  onCancel,
  onConfirm,
  open,
}: DeleteConfirmDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open) {
    return null;
  }

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4',
        className,
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="日記を削除"
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg"
      >
        <h2 className="mb-2 text-lg font-semibold text-gray-900">日記を削除</h2>
        <p className="mb-4 text-sm text-gray-600">この操作は元に戻せません。本当に削除しますか？</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={isDeleting}>
            削除する
          </Button>
        </div>
      </div>
    </div>
  );
};
