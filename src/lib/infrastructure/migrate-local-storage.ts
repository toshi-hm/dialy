/**
 * LocalStorage から Supabase へデータを移行するユーティリティ。
 * Phase 2 移行時に、既存のブラウザローカルデータをサーバーに同期する。
 */

import type { ActionResult, SerializedDiaryEntry } from '@/app/actions/types';
import { parseISODate } from '@/lib/utils/date';
import type { StoredDiaryEntry } from '@/types/diary';
import { isStoredDiaryEntry, STORAGE_KEY } from './local-storage-diary-repository';

/** 移行完了フラグのキー */
export const MIGRATION_FLAG_KEY = 'dialy_migrated_to_server';

/** 移行結果 */
export type MigrationResult = {
  migrated: number;
  skipped: number;
  errors: number;
};

/** LocalStorage から全エントリーを読み込む */
export const readLocalStorageEntries = (): StoredDiaryEntry[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    const storage = parsed as Record<string, unknown>;
    if (!Array.isArray(storage.entries)) return [];
    return (storage.entries as unknown[]).filter(isStoredDiaryEntry);
  } catch {
    return [];
  }
};

/** 移行完了済みかどうかを確認する */
export const hasMigrated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
};

/** 移行完了フラグを設定する */
export const markAsMigrated = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
};

/**
 * LocalStorage の全エントリーを Server Action 経由でサーバーに移行する。
 *
 * - 重複日付のエントリーは skipped としてカウントする（既にサーバーに存在する場合）。
 * - 移行完了後に移行フラグを設定する。
 *
 * @param createEntry Server Action: createDiaryEntry と同じシグネチャ
 */
export const migrateFromLocalStorage = async (
  createEntry: (
    date: string,
    content: string,
    tags: string[],
  ) => Promise<ActionResult<SerializedDiaryEntry>>,
): Promise<MigrationResult> => {
  const entries = readLocalStorageEntries();

  if (entries.length === 0) {
    markAsMigrated();
    return { migrated: 0, skipped: 0, errors: 0 };
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of entries) {
    try {
      const tags = Array.isArray(entry.tags)
        ? entry.tags.filter((t): t is string => typeof t === 'string')
        : [];

      // LocalStorage の date フィールドは 'YYYY-MM-DD' 形式（toISODate() で生成）で保存されている。
      // parseISODate() でローカルタイムゾーン（JST +09:00）の深夜0時として復元し、
      // HomeContent.tsx の startOfDay(new Date()).toISOString() と同じ UTC 表現に揃える。
      const result = await createEntry(parseISODate(entry.date).toISOString(), entry.content, tags);

      if (result.success) {
        migrated++;
      } else if (result.error.code === 'DUPLICATE_DATE_ENTRY') {
        skipped++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  markAsMigrated();
  return { migrated, skipped, errors };
};
