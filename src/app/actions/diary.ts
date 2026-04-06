'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import type { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
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
  GetEntriesBySameDateSchema,
  ServerActionDateSchema,
  UpdateDiaryEntrySchema,
} from '@/lib/validations/diary';
import { isAppError, ValidationError } from '@/types/errors';
import type { ActionResult, SerializedDiaryEntry } from './types';

const DIARY_ENTRIES_TAG = 'diary-entries';

let _repository: DiaryRepository | null = null;

/**
 * サーバー側リポジトリを返す（レイジー初期化）。
 * SUPABASE_URL / SUPABASE_ANON_KEY が未設定の場合:
 *   - development: InMemoryDiaryRepository（モックデータ）にフォールバック
 *   - production:  エラーをスロー
 */
const getRepository = async (): Promise<DiaryRepository> => {
  if (_repository) return _repository;

  const { isSupabaseConfigured } = await import('@/lib/infrastructure/supabase-client');

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required in production.\n' +
          'See .env.local.example for the Supabase configuration template.',
      );
    }
    const { InMemoryDiaryRepository } = await import(
      '@/lib/infrastructure/in-memory-diary-repository'
    );
    console.warn(
      '[Dev] SUPABASE_URL / SUPABASE_ANON_KEY が未設定です。InMemoryDiaryRepository（モックデータ）を使用します。\n' +
        '.env.local に SUPABASE_URL と SUPABASE_ANON_KEY を設定すると実際の Supabase に接続します。',
    );
    _repository = new InMemoryDiaryRepository();
    return _repository;
  }

  const { getSupabaseClient } = await import('@/lib/infrastructure/supabase-client');
  const { SupabaseDiaryRepository } = await import(
    '@/lib/infrastructure/supabase-diary-repository'
  );
  _repository = new SupabaseDiaryRepository(getSupabaseClient());
  return _repository;
};

const getDiaryEntryCached = unstable_cache(
  async (dateIso: string) => {
    const useCase = new GetDiaryEntryUseCase(await getRepository());
    return useCase.execute(new Date(dateIso));
  },
  ['diary-entry-by-date'],
  { tags: [DIARY_ENTRIES_TAG], revalidate: 3600 },
);

const getEntriesBySameDateCached = unstable_cache(
  async (dateIso: string, years: number) => {
    const useCase = new GetEntriesBySameDateUseCase(await getRepository());
    return useCase.execute(new Date(dateIso), years);
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

    const useCase = new CreateDiaryEntryUseCase(await getRepository());
    const entry = await useCase.execute(parsed.data);

    revalidatePath('/');
    revalidateTag(DIARY_ENTRIES_TAG, 'max');
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

    const entry = await getDiaryEntryCached(parsed.data.toISOString());

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

    const entries = await getEntriesBySameDateCached(
      parsed.data.date.toISOString(),
      parsed.data.years,
    );

    return {
      success: true,
      data: entries.map(serializeEntry),
    };
  } catch (error) {
    return handleError(error);
  }
};
