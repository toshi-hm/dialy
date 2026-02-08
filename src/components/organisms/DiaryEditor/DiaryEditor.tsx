'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { CharacterCount, SaveStatusIndicator } from '@/components/molecules';
import { cn } from '@/lib/utils/cn';
import { debounce } from '@/lib/utils/debounce';
import type { SaveStatus } from '@/types/diary';

export type DiaryEditorProps = {
  date: Date;
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  onRequestDelete?: () => void;
  maxLength?: number;
  className?: string;
};

export function DiaryEditor({
  className,
  date,
  initialContent = '',
  maxLength = 10_000,
  onRequestDelete,
  onSave,
}: DiaryEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const lastSavedContentRef = useRef(initialContent);
  const resetStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateKey = date.getTime();

  const clearResetStatusTimer = useCallback(() => {
    if (!resetStatusTimeoutRef.current) {
      return;
    }

    clearTimeout(resetStatusTimeoutRef.current);
    resetStatusTimeoutRef.current = null;
  }, []);

  const saveNow = useCallback(
    async (value: string) => {
      if (value.length > maxLength) {
        setSaveStatus('error');
        setErrorMessage('文字数が上限を超えています');
        return;
      }

      setSaveStatus('saving');
      setErrorMessage(undefined);

      try {
        await onSave(value);
        lastSavedContentRef.current = value;
        setSaveStatus('saved');
        clearResetStatusTimer();
        resetStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch {
        setSaveStatus('error');
        setErrorMessage('保存に失敗しました');
      }
    },
    [clearResetStatusTimer, maxLength, onSave],
  );

  const debouncedSave = useMemo(
    () =>
      debounce((value: string) => {
        void saveNow(value);
      }, 1000),
    [saveNow],
  );

  useEffect(() => {
    if (Number.isNaN(dateKey)) {
      return;
    }

    setContent(initialContent);
    lastSavedContentRef.current = initialContent;
    setSaveStatus('idle');
    setErrorMessage(undefined);
    debouncedSave.cancel();
  }, [dateKey, initialContent, debouncedSave]);

  useEffect(() => {
    if (content === lastSavedContentRef.current) {
      return;
    }

    debouncedSave(content);
  }, [content, debouncedSave]);

  useEffect(
    () => () => {
      debouncedSave.cancel();
      clearResetStatusTimer();
    },
    [clearResetStatusTimer, debouncedSave],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      debouncedSave.cancel();
      void saveNow(content);
    }
  };

  return (
    <section className={cn('space-y-3', className)}>
      <textarea
        aria-label="日記本文"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="今日の日記を書く..."
        className="h-[300px] w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 md:h-[350px] lg:h-[400px]"
      />
      <div className="flex items-center justify-between gap-3">
        <CharacterCount content={content} maxLength={maxLength} />
        {onRequestDelete && (
          <Button type="button" variant="outline" onClick={onRequestDelete}>
            削除
          </Button>
        )}
      </div>
      <SaveStatusIndicator status={saveStatus} errorMessage={errorMessage} />
    </section>
  );
}
