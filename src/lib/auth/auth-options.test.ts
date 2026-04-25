import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Supabase をモック（動的importで使用される）
const mockSignInWithPassword = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

const { authOptions, isAuthEnabled } = await import('./auth-options');

// authorize関数を取り出す
// next-auth v4のCredentialsProviderはauthorize: () => nullをデフォルト値として返し、
// 実際のauthorize関数はoptions.authorizeに格納される
// biome-ignore lint/suspicious/noExplicitAny: test utility
const authorize = (authOptions.providers[0] as any).options.authorize as (
  credentials: { email: string; password: string } | undefined,
  req: object,
) => Promise<{ id: string; email: string; name: string } | null>;

describe('auth-options', () => {
  describe('isAuthEnabled', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('NEXTAUTH_SECRETが未設定の場合はfalseを返す', () => {
      vi.stubEnv('NEXTAUTH_SECRET', '');
      expect(isAuthEnabled()).toBe(false);
    });

    it('NEXTAUTH_SECRETが設定されている場合はtrueを返す', () => {
      vi.stubEnv('NEXTAUTH_SECRET', 'some-secret');
      expect(isAuthEnabled()).toBe(true);
    });
  });

  describe('authOptions.providers[0].authorize', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.unstubAllEnvs();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('credentialsがundefinedの場合はnullを返す', async () => {
      const result = await authorize(undefined, {});
      expect(result).toBeNull();
    });

    it('emailがない場合はnullを返す', async () => {
      const result = await authorize({ email: '', password: 'pass' }, {});
      expect(result).toBeNull();
    });

    it('passwordがない場合はnullを返す', async () => {
      const result = await authorize({ email: 'test@example.com', password: '' }, {});
      expect(result).toBeNull();
    });

    it('管理者メールとパスワードが一致する場合は管理者ユーザーを返す', async () => {
      vi.stubEnv('NEXTAUTH_ADMIN_EMAIL', 'admin@example.com');
      vi.stubEnv('NEXTAUTH_ADMIN_PASSWORD', 'secret123');

      const result = await authorize({ email: 'admin@example.com', password: 'secret123' }, {});

      expect(result).not.toBeNull();
      expect(result?.id).toBe('admin');
      expect(result?.email).toBe('admin@example.com');
    });

    it('管理者パスワードが一致しない場合はnullを返す（Supabase未設定）', async () => {
      vi.stubEnv('NEXTAUTH_ADMIN_EMAIL', 'admin@example.com');
      vi.stubEnv('NEXTAUTH_ADMIN_PASSWORD', 'secret123');

      const result = await authorize({ email: 'admin@example.com', password: 'wrongpassword' }, {});

      expect(result).toBeNull();
    });

    it('管理者設定もSupabaseも未設定の場合はnullを返す', async () => {
      const result = await authorize({ email: 'user@example.com', password: 'password' }, {});
      expect(result).toBeNull();
    });

    it('Supabaseが設定されていて認証成功の場合はユーザーを返す', async () => {
      vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'supabase-user-id',
            email: 'user@example.com',
            user_metadata: { name: 'Test User' },
          },
        },
        error: null,
      });

      const result = await authorize({ email: 'user@example.com', password: 'password' }, {});

      expect(result).not.toBeNull();
      expect(result?.id).toBe('supabase-user-id');
      expect(result?.email).toBe('user@example.com');
    });

    it('Supabaseが設定されていて認証失敗の場合はnullを返す', async () => {
      vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      });

      const result = await authorize({ email: 'user@example.com', password: 'wrongpass' }, {});

      expect(result).toBeNull();
    });

    it('Supabaseで例外が発生した場合はnullを返す', async () => {
      vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      const result = await authorize({ email: 'user@example.com', password: 'password' }, {});

      expect(result).toBeNull();
    });

    it('Supabase認証でuser_metadataにnameがない場合はemailを名前に使う', async () => {
      vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'supabase-user-id',
            email: 'user@example.com',
            user_metadata: {},
          },
        },
        error: null,
      });

      const result = await authorize({ email: 'user@example.com', password: 'password' }, {});

      expect(result?.name).toBe('user@example.com');
    });
  });

  describe('authOptions.callbacks', () => {
    it('jwt callback: userが存在する場合にtokenにuserIdとemailをセットする', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      if (!jwtCallback) throw new Error('jwt callback not found');

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const token = {} as any;
      const user = { id: 'user-123', email: 'test@example.com', name: 'Test' };

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const result = await (jwtCallback as any)({ token, user });

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('jwt callback: userがない場合にtokenをそのまま返す', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      if (!jwtCallback) throw new Error('jwt callback not found');

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const token = { sub: 'existing-sub' } as any;

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const result = await (jwtCallback as any)({ token });

      expect(result).toBe(token);
    });

    it('session callback: token存在時にsession.user.idにuserIdをセットする', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      if (!sessionCallback) throw new Error('session callback not found');

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const token = { userId: 'user-456' } as any;
      const session = {
        user: { name: 'Test', email: 'test@example.com', image: null },
        expires: '',
      };

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const result = await (sessionCallback as any)({ session, token });

      expect((result.user as { id?: string }).id).toBe('user-456');
    });

    it('session callback: token.userIdがない場合はtoken.subをsession.user.idにセットする', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      if (!sessionCallback) throw new Error('session callback not found');

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const token = { sub: 'sub-user-789' } as any;
      const session = {
        user: { name: 'Test', email: 'test@example.com', image: null },
        expires: '',
      };

      // biome-ignore lint/suspicious/noExplicitAny: test utility
      const result = await (sessionCallback as any)({ session, token });

      expect((result.user as { id?: string }).id).toBe('sub-user-789');
    });
  });
});
