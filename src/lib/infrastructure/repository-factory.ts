import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { LocalStorageDiaryRepository } from './local-storage-diary-repository';

/**
 * クライアント側で使用するリポジトリを生成する。
 * サーバー側（Supabase）は Server Actions 経由でのみ使用されるため、
 * このファクトリは常に LocalStorageDiaryRepository を返す。
 * サーバー側のリポジトリが必要な場合は createServerDiaryRepository() を使用する。
 */
export const createDiaryRepository = (): DiaryRepository => {
  return new LocalStorageDiaryRepository();
};

/**
 * サーバー側で使用するリポジトリを生成する。
 * Server Actions や API Routes など、Node.js 環境でのみ呼び出すこと。
 * 環境変数 SUPABASE_URL と SUPABASE_ANON_KEY が必要（.env.local.example 参照）。
 */
export const createServerDiaryRepository = async (): Promise<DiaryRepository> => {
  const { SupabaseDiaryRepository } = await import('./supabase-diary-repository');
  const { supabase } = await import('./supabase-client');
  return new SupabaseDiaryRepository(supabase);
};
