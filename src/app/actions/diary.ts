'use server';

import type { DiaryEntry } from '@/lib/domain/diary-entry';
import { prisma } from '@/lib/infrastructure/prisma';
import { PrismaDiaryRepository } from '@/lib/infrastructure/prisma-diary-repository';
import {
  CreateDiaryEntryUseCase,
  DeleteDiaryEntryUseCase,
  GetDiaryEntryUseCase,
  GetEntriesBySameDateUseCase,
  UpdateDiaryEntryUseCase,
} from '@/lib/use-cases';
import type { AppErrorCode } from '@/types/errors';
import { isAppError } from '@/types/errors';
import type { ActionResult, SerializedDiaryEntry } from './types';

const repository = new PrismaDiaryRepository(prisma);

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
      code: 'SAVE_FAILED' as AppErrorCode,
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
    const useCase = new CreateDiaryEntryUseCase(repository);
    const entry = await useCase.execute({
      date: new Date(date),
      content,
      tags,
    });

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
    const useCase = new UpdateDiaryEntryUseCase(repository);
    const entry = await useCase.execute({ id, content, tags });

    return { success: true, data: serializeEntry(entry) };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteDiaryEntry = async (id: string): Promise<ActionResult<null>> => {
  try {
    const useCase = new DeleteDiaryEntryUseCase(repository);
    await useCase.execute({ id });

    return { success: true, data: null };
  } catch (error) {
    return handleError(error);
  }
};

export const getDiaryEntry = async (
  date: string,
): Promise<ActionResult<SerializedDiaryEntry | null>> => {
  try {
    const useCase = new GetDiaryEntryUseCase(repository);
    const entry = await useCase.execute(new Date(date));

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
    const useCase = new GetEntriesBySameDateUseCase(repository);
    const entries = await useCase.execute(new Date(date), years);

    return {
      success: true,
      data: entries.map(serializeEntry),
    };
  } catch (error) {
    return handleError(error);
  }
};
