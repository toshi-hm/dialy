'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-server-session';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { getRepository } from '@/lib/infrastructure/server-repository';
import {
  CreateDiaryEntryUseCase,
  DeleteDiaryEntryUseCase,
  GetDiaryEntryUseCase,
  GetEntriesBySameDateUseCase,
  SearchDiaryEntriesUseCase,
  UpdateDiaryEntryUseCase,
} from '@/lib/use-cases';
import {
  CreateDiaryEntrySchema,
  DeleteDiaryEntrySchema,
  GetEntriesBySameDateSchema,
  ServerActionDateSchema,
  UpdateDiaryEntrySchema,
} from '@/lib/validations/diary';
import { DuplicateDateEntryError, isAppError, ValidationError } from '@/types/errors';
import type { ActionResult, SerializedDiaryEntry } from './types';

const DIARY_ENTRIES_TAG = 'diary-entries';

const getDiaryEntryCached = unstable_cache(
  async (dateIso: string, userId: string | null) => {
    const useCase = new GetDiaryEntryUseCase(await getRepository());
    return useCase.execute(new Date(dateIso), userId);
  },
  ['diary-entry-by-date'],
  { tags: [DIARY_ENTRIES_TAG], revalidate: 3600 },
);

const getEntriesBySameDateCached = unstable_cache(
  async (dateIso: string, years: number, userId: string | null) => {
    const useCase = new GetEntriesBySameDateUseCase(await getRepository());
    return useCase.execute(new Date(dateIso), years, userId);
  },
  ['diary-entries-by-same-date'],
  { tags: [DIARY_ENTRIES_TAG], revalidate: 3600 },
);

const serializeEntry = (entry: DiaryEntry): SerializedDiaryEntry => ({
  id: entry.id,
  date: entry.date.toISOString(),
  content: entry.content,
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
  tags: [...entry.tags],
});

const handleError = (error: unknown): ActionResult<never> => {
  if (isAppError(error)) {
    return {
      success: false,
      error: { code: error.code, message: error.message },
    };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
};

export const createDiaryEntry = async (
  date: string,
  content: string,
  tags: string[] = [],
): Promise<ActionResult<SerializedDiaryEntry>> => {
  try {
    const dateResult = ServerActionDateSchema.safeParse(date);
    if (!dateResult.success) {
      throw new ValidationError(dateResult.error.issues[0]?.message ?? 'Invalid date format');
    }

    const parsed = CreateDiaryEntrySchema.safeParse({
      date: dateResult.data,
      content,
      tags,
    });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const userId = await getCurrentUserId();
    const repository = await getRepository();

    try {
      const useCase = new CreateDiaryEntryUseCase(repository);
      const entry = await useCase.execute(parsed.data, userId);
      revalidatePath('/');
      revalidateTag(DIARY_ENTRIES_TAG, 'max');
      return { success: true, data: serializeEntry(entry) };
    } catch (createError) {
      if (createError instanceof DuplicateDateEntryError) {
        // クライアントのキャッシュが stale でエントリが既に存在する場合、
        // 既存エントリを新しい内容で上書きする（アップサート）。
        const existing = await repository.findByDate(parsed.data.date, userId);
        if (existing) {
          const updated = existing.update(parsed.data.content).updateTags(parsed.data.tags ?? []);
          await repository.save(updated);
          revalidatePath('/');
          revalidateTag(DIARY_ENTRIES_TAG, 'max');
          return { success: true, data: serializeEntry(updated) };
        }
      }
      throw createError;
    }
  } catch (error) {
    return handleError(error);
  }
};

export const updateDiaryEntry = async (
  id: string,
  content: string,
  tags?: string[],
): Promise<ActionResult<SerializedDiaryEntry>> => {
  try {
    const parsed = UpdateDiaryEntrySchema.safeParse({ id, content, tags });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const useCase = new UpdateDiaryEntryUseCase(await getRepository());
    const entry = await useCase.execute(parsed.data);

    revalidatePath('/');
    revalidateTag(DIARY_ENTRIES_TAG, 'max');
    return { success: true, data: serializeEntry(entry) };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteDiaryEntry = async (id: string): Promise<ActionResult<null>> => {
  try {
    const parsed = DeleteDiaryEntrySchema.safeParse({ id });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const useCase = new DeleteDiaryEntryUseCase(await getRepository());
    await useCase.execute(parsed.data);

    revalidatePath('/');
    revalidateTag(DIARY_ENTRIES_TAG, 'max');
    return { success: true, data: null };
  } catch (error) {
    return handleError(error);
  }
};

export const getDiaryEntry = async (
  date: string,
): Promise<ActionResult<SerializedDiaryEntry | null>> => {
  try {
    const parsed = ServerActionDateSchema.safeParse(date);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid date format');
    }

    const userId = await getCurrentUserId();
    const entry = await getDiaryEntryCached(parsed.data.toISOString(), userId);

    return {
      success: true,
      data: entry ? serializeEntry(entry) : null,
    };
  } catch (error) {
    return handleError(error);
  }
};

export const getEntriesBySameDate = async (
  date: string,
  years: number = 5,
): Promise<ActionResult<SerializedDiaryEntry[]>> => {
  try {
    const dateResult = ServerActionDateSchema.safeParse(date);
    if (!dateResult.success) {
      throw new ValidationError(dateResult.error.issues[0]?.message ?? 'Invalid date format');
    }

    const parsed = GetEntriesBySameDateSchema.safeParse({ date: dateResult.data, years });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const userId = await getCurrentUserId();
    const entries = await getEntriesBySameDateCached(
      parsed.data.date.toISOString(),
      parsed.data.years,
      userId,
    );

    return {
      success: true,
      data: entries.map(serializeEntry),
    };
  } catch (error) {
    return handleError(error);
  }
};

export const searchDiaryEntries = async (
  query: string,
): Promise<ActionResult<SerializedDiaryEntry[]>> => {
  try {
    const userId = await getCurrentUserId();
    const useCase = new SearchDiaryEntriesUseCase(await getRepository());
    const entries = await useCase.execute(query, userId);

    return {
      success: true,
      data: entries.map(serializeEntry),
    };
  } catch (error) {
    return handleError(error);
  }
};
