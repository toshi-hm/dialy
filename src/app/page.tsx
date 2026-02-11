'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DateDisplay } from '@/components/molecules';
import {
  CalendarDialog,
  DeleteConfirmDialog,
  Dial,
  DiaryEditor,
  PastEntriesList,
} from '@/components/organisms';
import { MainLayout } from '@/components/templates';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { LocalStorageDiaryRepository } from '@/lib/infrastructure/local-storage-diary-repository';
import {
  CreateDiaryEntryUseCase,
  DeleteDiaryEntryUseCase,
  GetDiaryEntryUseCase,
  GetEntriesBySameDateUseCase,
  UpdateDiaryEntryUseCase,
} from '@/lib/use-cases';
import { startOfDay } from '@/lib/utils/date';
import {
  ContentTooLongError,
  DuplicateDateEntryError,
  FetchFailedError,
  FutureDateError,
  ValidationError,
} from '@/types/errors';

const RETRY_DELAYS_MS = [250, 500, 1000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function detectDialSize(width: number): number {
  if (width < 768) {
    return 80;
  }

  if (width < 1024) {
    return 150;
  }

  return 180;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [pastEntries, setPastEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [dialSize, setDialSize] = useState(180);

  const repository = useMemo(() => new LocalStorageDiaryRepository(), []);
  const createDiaryEntryUseCase = useMemo(
    () => new CreateDiaryEntryUseCase(repository),
    [repository],
  );
  const updateDiaryEntryUseCase = useMemo(
    () => new UpdateDiaryEntryUseCase(repository),
    [repository],
  );
  const deleteDiaryEntryUseCase = useMemo(
    () => new DeleteDiaryEntryUseCase(repository),
    [repository],
  );
  const getDiaryEntryUseCase = useMemo(() => new GetDiaryEntryUseCase(repository), [repository]);
  const getEntriesBySameDateUseCase = useMemo(
    () => new GetEntriesBySameDateUseCase(repository),
    [repository],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const applyDialSize = () => {
      setDialSize(detectDialSize(window.innerWidth));
    };

    applyDialSize();
    window.addEventListener('resize', applyDialSize);

    return () => {
      window.removeEventListener('resize', applyDialSize);
    };
  }, []);

  const loadEntriesByDate = useCallback(
    async (date: Date) => {
      setIsLoading(true);
      setPageError(null);

      try {
        const [entry, sameDateEntries] = await Promise.all([
          getDiaryEntryUseCase.execute(date),
          getEntriesBySameDateUseCase.execute(date, 5),
        ]);

        setCurrentEntry(entry);
        setPastEntries(sameDateEntries);
      } catch {
        setPageError('データの読み込みに失敗しました');
        setCurrentEntry(null);
        setPastEntries([]);
      } finally {
        setIsLoading(false);
      }
    },
    [getDiaryEntryUseCase, getEntriesBySameDateUseCase],
  );

  useEffect(() => {
    void loadEntriesByDate(selectedDate);
  }, [loadEntriesByDate, selectedDate]);

  const saveContent = useCallback(
    async (content: string) => {
      let lastError: unknown;

      for (let attempt = 0; ; attempt += 1) {
        try {
          const savedEntry = currentEntry
            ? await updateDiaryEntryUseCase.execute({ id: currentEntry.id, content })
            : await createDiaryEntryUseCase.execute({ date: selectedDate, content });

          setCurrentEntry(savedEntry);
          const sameDateEntries = await getEntriesBySameDateUseCase.execute(selectedDate, 5);
          setPastEntries(sameDateEntries);
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

          lastError = error;
          if (attempt >= RETRY_DELAYS_MS.length) {
            break;
          }
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }

      if (lastError instanceof FetchFailedError) {
        throw lastError;
      }

      throw new Error('Failed to save diary entry');
    },
    [
      createDiaryEntryUseCase,
      currentEntry,
      getEntriesBySameDateUseCase,
      selectedDate,
      updateDiaryEntryUseCase,
    ],
  );

  const deleteEntry = useCallback(async () => {
    if (!currentEntry) {
      setIsDeleteDialogOpen(false);
      return;
    }

    await deleteDiaryEntryUseCase.execute({ id: currentEntry.id });
    setIsDeleteDialogOpen(false);
    setCurrentEntry(null);
    const sameDateEntries = await getEntriesBySameDateUseCase.execute(selectedDate, 5);
    setPastEntries(sameDateEntries);
  }, [currentEntry, deleteDiaryEntryUseCase, getEntriesBySameDateUseCase, selectedDate]);

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
}
