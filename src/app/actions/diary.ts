'use server';

import { revalidatePath } from 'next/cache';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { supabase } from '@/lib/infrastructure/supabase-client';
import { SupabaseDiaryRepository } from '@/lib/infrastructure/supabase-diary-repository';
import {
  CreateDiaryEntryUseCase,
  DeleteDiaryEntryUseCase,
  GetDiaryEntryUseCase,
  GetEntriesBySameDateUseCase,
  UpdateDiaryEntryUseCase,
} from '@/lib/use-cases';
import {
  CreateDiaryEntrySchema,
  DeleteDiaryEntrySchema,
  ServerActionDateSchema,
  UpdateDiaryEntrySchema,
} from '@/lib/validations/diary';
import type { AppErrorCode } from '@/types/errors';
import { isAppError, ValidationError } from '@/types/errors';
import type { ActionResult, SerializedDiaryEntry } from './types';

const repository = new SupabaseDiaryRepository(supabase);

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
      code: 'INTERNAL_ERROR' as AppErrorCode,
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
    const parsed = CreateDiaryEntrySchema.safeParse({
      date: new Date(date),
      content,
      tags,
    });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const useCase = new CreateDiaryEntryUseCase(repository);
    const entry = await useCase.execute(parsed.data);

    revalidatePath('/');
    return { success: true, data: serializeEntry(entry) };
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

    const useCase = new UpdateDiaryEntryUseCase(repository);
    const entry = await useCase.execute(parsed.data);

    revalidatePath('/');
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

    const useCase = new DeleteDiaryEntryUseCase(repository);
    await useCase.execute(parsed.data);

    revalidatePath('/');
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

    const useCase = new GetDiaryEntryUseCase(repository);
    const entry = await useCase.execute(parsed.data);

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
    const parsed = ServerActionDateSchema.safeParse(date);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid date format');
    }

    const useCase = new GetEntriesBySameDateUseCase(repository);
    const entries = await useCase.execute(parsed.data, years);

    return {
      success: true,
      data: entries.map(serializeEntry),
    };
  } catch (error) {
    return handleError(error);
  }
};
