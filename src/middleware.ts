import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 認証ミドルウェア
 *
 * NEXTAUTH_SECRET が設定されている場合のみ認証を適用する。
 * 未設定の場合はゲストモードとしてすべてのリクエストを通過させる。
 */
export const middleware = async (request: NextRequest) => {
  // 認証が無効な場合はスキップ（ゲストモード）
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // 認証不要なパス（/api/test はE2Eテスト用リセットエンドポイントを含む）
  const publicPaths = ['/login', '/api/auth', '/api/test'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // JWTトークンの確認
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
