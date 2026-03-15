import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

const createSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required.\n' +
        'See .env.local.example for the Supabase configuration template.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = globalForSupabase.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}
