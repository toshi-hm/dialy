import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth.js 設定
 *
 * 認証フロー:
 * - NEXTAUTH_SECRET が未設定: 認証スキップ（ゲストモード）
 * - NEXTAUTH_SECRET が設定済み: メール/パスワード認証が必要
 *
 * 開発/テスト環境:
 * - NEXTAUTH_SECRET を設定しない場合、認証なしで動作（既存E2Eテストはそのまま通る）
 * - NEXTAUTH_ADMIN_EMAIL / NEXTAUTH_ADMIN_PASSWORD で管理者ユーザーを設定可能
 *
 * 本番環境:
 * - NEXTAUTH_SECRET を必ず設定すること
 * - Supabase Auth やその他のプロバイダーと統合可能
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 環境変数で設定された管理者ユーザーを確認
        const adminEmail = process.env.NEXTAUTH_ADMIN_EMAIL;
        const adminPassword = process.env.NEXTAUTH_ADMIN_PASSWORD;

        if (adminEmail && adminPassword) {
          if (credentials.email === adminEmail && credentials.password === adminPassword) {
            return {
              id: 'admin',
              email: adminEmail,
              name: 'Admin',
            };
          }
        }

        // Supabase Auth での認証（Supabase が設定されている場合）
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseAnonKey);

            const { data, error } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });

            if (error || !data.user) {
              return null;
            }

            return {
              id: data.user.id,
              email: data.user.email ?? credentials.email,
              name: data.user.user_metadata?.name ?? data.user.email,
            };
          } catch {
            return null;
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * 認証が有効かどうかを確認する。
 * NEXTAUTH_SECRET が設定されている場合のみ認証を有効化する。
 */
export const isAuthEnabled = (): boolean => {
  return Boolean(process.env.NEXTAUTH_SECRET);
};
