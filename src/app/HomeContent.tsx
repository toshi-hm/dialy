'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import {
  createDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntry,
  getEntriesBySameDate,
  updateDiaryEntry,
} from '@/app/actions/diary';
import type { SerializedDiaryEntry } from '@/app/actions/types';
import { DateDisplay } from '@/components/molecules';
import { Dial, DiaryEditor, PastEntriesList } from '@/components/organisms';
import { MainLayout } from '@/components/templates';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { hasMigrated, migrateFromLocalStorage } from '@/lib/infrastructure/migrate-local-storage';
import { startOfDay } from '@/lib/utils/date';
import { reportWebVitals } from '@/lib/utils/performance';
import {
  ContentTooLongError,
  DuplicateDateEntryError,
  FutureDateError,
  SaveFailedError,
  ValidationError,
} from '@/types/errors';

const deserializeEntry = (entry: SerializedDiaryEntry): DiaryEntry =>
  DiaryEntry.reconstruct(
    entry.id,
    new Date(entry.date),
    entry.content,
    new Date(entry.createdAt),
    new Date(entry.updatedAt),
    entry.tags,
  );

const throwFromActionError = (code: string, message: string): never => {
  switch (code) {
    case 'VALIDATION_ERROR':
      throw new ValidationError(message);
    case 'FUTURE_DATE_NOT_ALLOWED':
      throw new FutureDateError(message);
    case 'DUPLICATE_DATE_ENTRY':
      throw new DuplicateDateEntryError(message);
    case 'CONTENT_TOO_LONG':
      throw new ContentTooLongError(message);
    default:
      throw new SaveFailedError(message);
  }
};

// Dynamic imports for dialogs (only loaded when needed)
const CalendarDialog = dynamic(() =>
  import('@/components/organisms/CalendarDialog').then((mod) => ({
    default: mod.CalendarDialog,
  })),
);

const DeleteConfirmDialog = dynamic(() =>
  import('@/components/organisms/DeleteConfirmDialog').then((mod) => ({
    default: mod.DeleteConfirmDialog,
  })),
);

const RETRY_DELAYS_MS = [250, 500, 1000];
const EMPTY_TAGS: readonly string[] = [];

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const detectDialSize = (width: number): number => {
  if (width < 768) {
    return 80;
  }

  if (width < 1024) {
    return 150;
  }

  return 180;
};

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [pastEntries, setPastEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [dialSize, setDialSize] = useState(180);

  useEffect(() => {
    return reportWebVitals();
  }, []);

  useEffect(() => {
    const applyDialSize = () => {
      setDialSize(detectDialSize(window.innerWidth));
    };

    applyDialSize();
    window.addEventListener('resize', applyDialSize);

    return () => {
      window.removeEventListener('resize', applyDialSize);
    };
  }, []);

  // Phase 2 移行: LocalStorage データをサーバーに移行する（初回のみ）
  useEffect(() => {
    if (!hasMigrated()) {
      void migrateFromLocalStorage(createDiaryEntry);
    }
  }, []);

  const loadEntriesByDate = useCallback(async (date: Date) => {
    setIsLoading(true);
    setPageError(null);

    try {
      const dateIso = date.toISOString();
      const [entryResult, sameDateResult] = await Promise.all([
        getDiaryEntry(dateIso),
        getEntriesBySameDate(dateIso, 5),
      ]);

      const entry =
        entryResult.success && entryResult.data ? deserializeEntry(entryResult.data) : null;
      const pastEntriesList = sameDateResult.success
        ? sameDateResult.data.map(deserializeEntry)
        : [];

      setCurrentEntry(entry);
      setPastEntries(pastEntriesList);
    } catch {
      setPageError('データの読み込みに失敗しました');
      setCurrentEntry(null);
      setPastEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntriesByDate(selectedDate);
  }, [loadEntriesByDate, selectedDate]);

  const saveContent = useCallback(
    async (content: string, tags: string[] = []) => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const result = currentEntry
            ? await updateDiaryEntry(currentEntry.id, content, tags)
            : await createDiaryEntry(selectedDate.toISOString(), content, tags);

          if (!result.success) {
            throwFromActionError(result.error.code, result.error.message);
          }

          const savedEntry = deserializeEntry(result.data);
          setCurrentEntry(savedEntry);

          const sameDateResult = await getEntriesBySameDate(selectedDate.toISOString(), 5);
          if (sameDateResult.success) {
            setPastEntries(sameDateResult.data.map(deserializeEntry));
          }
          return;
        } catch (error) {
          if (
            error instanceof ValidationError ||
            error instanceof FutureDateError ||
            error instanceof DuplicateDateEntryError ||
            error instanceof ContentTooLongError
          ) {
            throw error;
          }

          if (!(error instanceof SaveFailedError)) {
            throw error;
          }

          if (attempt >= RETRY_DELAYS_MS.length) {
            throw error;
          }
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    },
    [currentEntry, selectedDate],
  );

  const deleteEntry = useCallback(async () => {
    if (!currentEntry) {
      setIsDeleteDialogOpen(false);
      return;
    }

    const result = await deleteDiaryEntry(currentEntry.id);
    if (!result.success) {
      setPageError('削除に失敗しました');
      return;
    }

    setIsDeleteDialogOpen(false);
    setCurrentEntry(null);

    const sameDateResult = await getEntriesBySameDate(selectedDate.toISOString(), 5);
    if (sameDateResult.success) {
      setPastEntries(sameDateResult.data.map(deserializeEntry));
    }
  }, [currentEntry, selectedDate]);

  const handleFutureDateAttempt = () => {
    setPageError('未来の日付は選択できません');
  };

  return (
    <MainLayout
      sidebar={
        <div className="space-y-3">
          <Dial
            size={dialSize}
            selectedDate={selectedDate}
            onDateChange={(date) => setSelectedDate(startOfDay(date))}
            maxDate={startOfDay(new Date())}
            onFutureDateAttempt={handleFutureDateAttempt}
            onOpenCalendar={() => setIsCalendarOpen(true)}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <DateDisplay date={selectedDate} />

        {pageError && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {pageError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">読み込み中...</p>
        ) : (
          <>
            <DiaryEditor
              date={selectedDate}
              initialContent={currentEntry?.content ?? ''}
              initialTags={currentEntry?.tags ?? EMPTY_TAGS}
              onSave={saveContent}
              onRequestDelete={currentEntry ? () => setIsDeleteDialogOpen(true) : undefined}
            />

            <PastEntriesList entries={pastEntries} />
          </>
        )}
      </div>

      <CalendarDialog
        open={isCalendarOpen}
        selectedDate={selectedDate}
        maxDate={startOfDay(new Date())}
        onSelect={(date) => setSelectedDate(startOfDay(date))}
        onClose={() => setIsCalendarOpen(false)}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteEntry}
      />
    </MainLayout>
  );
};

export default Home;
