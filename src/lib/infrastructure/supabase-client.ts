import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

const createSupabaseClient = (): SupabaseClient => {
  // Server Actions（サーバーサイド）でのみ使用するため NEXT_PUBLIC_ プレフィックスは不要。
  // ブラウザバンドルに含める場合は NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を使用すること。
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required.\n' +
        'See .env.local.example for the Supabase configuration template.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = globalForSupabase.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}
