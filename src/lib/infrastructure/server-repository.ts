import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';

let _repository: DiaryRepository | null = null;

/**
 * サーバー側リポジトリを返す（レイジー初期化）。
 * SUPABASE_URL / SUPABASE_ANON_KEY が未設定の場合:
 *   - development / CI: InMemoryDiaryRepository（モックデータ）にフォールバック
 *   - production (non-CI): エラーをスロー
 */
export const getRepository = async (): Promise<DiaryRepository> => {
  if (_repository) return _repository;

  const { isSupabaseConfigured } = await import('@/lib/infrastructure/supabase-client');

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production' && !process.env.CI) {
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

/**
 * テスト用: インメモリリポジトリのデータをクリアする。
 * CI 環境でのみ使用可能。
 */
export const clearRepositoryForTesting = (): void => {
  if (!_repository) return;
  if (
    'clearAll' in _repository &&
    typeof (_repository as { clearAll: () => void }).clearAll === 'function'
  ) {
    (_repository as { clearAll: () => void }).clearAll();
  }
};
