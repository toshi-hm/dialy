import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

/**
 * Supabase 接続に必要な環境変数が設定されているか確認する。
 * dev モードでのフォールバック判定に使用する。
 */
export const isSupabaseConfigured = (): boolean =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

/**
 * Supabase クライアントを返す（レイジー初期化）。
 * モジュール読み込み時ではなく、初めて呼び出された時点で初期化する。
 * 環境変数が未設定の場合は呼び出し時にエラーをスローする。
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (globalForSupabase.supabase) return globalForSupabase.supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required.\n' +
        'See .env.local.example for the Supabase configuration template.',
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);

  if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = client;
  }

  return client;
};
