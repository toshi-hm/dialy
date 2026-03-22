import { DiaryEntry } from '@/lib/domain/diary-entry';
import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import type { StoredDiaryEntry } from '@/types/diary';
import { DuplicateDateEntryError, ValidationError } from '@/types/errors';

type LocalStoragePayload = {
  version: string;
  entries: StoredDiaryEntry[];
};

export type MigrationResult = {
  migrated: number;
  skipped: number;
};

const isStoredDiaryEntry = (value: unknown): value is StoredDiaryEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredDiaryEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    (candidate.tags === undefined ||
      (Array.isArray(candidate.tags) && candidate.tags.every((tag) => typeof tag === 'string')))
  );
};

const isLocalStoragePayload = (value: unknown): value is LocalStoragePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LocalStoragePayload>;
  return (
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every((entry) => isStoredDiaryEntry(entry))
  );
};

const parseDateOrThrowValidationError = (value: string, fieldName: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${fieldName} が不正な日付形式です（期待形式: ISO 8601）`);
  }
  return parsed;
};

/**
 * LocalStorage 互換データを Repository（Prisma など）へ移行する。
 * データ破損・重複・バリデーション違反のエントリーはスキップし、可能な分だけ移行する。
 *
 * @param raw LocalStorage から取得した JSON 文字列（`dialy_entries` の値）
 * @param repository 移行先リポジトリ（PrismaDiaryRepository など）
 * @returns 移行件数とスキップ件数
 */
export const migrateFromLocalStorage = async (
  raw: string | null,
  repository: DiaryRepository,
): Promise<MigrationResult> => {
  if (!raw) {
    return { migrated: 0, skipped: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { migrated: 0, skipped: 0 };
  }

  if (!isLocalStoragePayload(parsed)) {
    return { migrated: 0, skipped: 0 };
  }

  let migrated = 0;
  let skipped = 0;

  for (const entry of parsed.entries) {
    try {
      const domainEntry = DiaryEntry.reconstruct(
        entry.id,
        parseDateOrThrowValidationError(entry.date, 'エントリー日付（date）'),
        entry.content,
        parseDateOrThrowValidationError(entry.createdAt, '作成日時（createdAt）'),
        parseDateOrThrowValidationError(entry.updatedAt, '更新日時（updatedAt）'),
        entry.tags ?? [],
      );
      await repository.save(domainEntry);
      migrated += 1;
    } catch (error) {
      if (error instanceof DuplicateDateEntryError || error instanceof ValidationError) {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  return { migrated, skipped };
};
