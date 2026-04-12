import { getServerSession as nextAuthGetServerSession } from 'next-auth';
import { authOptions, isAuthEnabled } from './auth-options';

/**
 * サーバーコンポーネント / Server Actions からセッションを取得する。
 *
 * 認証が無効（NEXTAUTH_SECRET 未設定）の場合は null を返す（ゲストモード）。
 */
export const getServerSession = async () => {
  if (!isAuthEnabled()) {
    return null;
  }

  return nextAuthGetServerSession(authOptions);
};

/**
 * 現在のユーザーIDを取得する。
 *
 * 認証が無効な場合: null（ゲストモード）
 * 認証済みの場合: ユーザーID
 * 未認証の場合: null
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getServerSession();
  return session?.user?.id ?? null;
};
