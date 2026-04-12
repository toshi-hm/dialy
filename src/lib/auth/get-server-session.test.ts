import { describe, expect, it, vi } from 'vitest';

const mockGetServerSession = vi.fn();
const mockIsAuthEnabled = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('./auth-options', () => ({
  authOptions: { providers: [] },
  isAuthEnabled: mockIsAuthEnabled,
}));

const { getServerSession, getCurrentUserId } = await import('./get-server-session');

describe('get-server-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServerSession', () => {
    it('認証が無効の場合はnullを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(false);

      const result = await getServerSession();

      expect(result).toBeNull();
      expect(mockGetServerSession).not.toHaveBeenCalled();
    });

    it('認証が有効な場合はnextAuthGetServerSessionを呼び出す', async () => {
      mockIsAuthEnabled.mockReturnValue(true);
      const mockSession = { user: { id: 'user-123', email: 'test@example.com' } };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await getServerSession();

      expect(mockGetServerSession).toHaveBeenCalledOnce();
      expect(result).toBe(mockSession);
    });

    it('認証が有効でセッションがない場合はnullを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(true);
      mockGetServerSession.mockResolvedValue(null);

      const result = await getServerSession();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUserId', () => {
    it('認証が無効の場合はnullを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(false);

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });

    it('セッションが存在する場合はユーザーIDを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(true);
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-456', email: 'user@example.com' },
      });

      const result = await getCurrentUserId();

      expect(result).toBe('user-456');
    });

    it('セッションがない場合はnullを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(true);
      mockGetServerSession.mockResolvedValue(null);

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });

    it('セッションにユーザーIDがない場合はnullを返す', async () => {
      mockIsAuthEnabled.mockReturnValue(true);
      mockGetServerSession.mockResolvedValue({ user: {} });

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });
  });
});
