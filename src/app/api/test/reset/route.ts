import { NextResponse } from 'next/server';
import { clearRepositoryForTesting } from '@/lib/infrastructure/server-repository';

/**
 * テスト用エンドポイント: インメモリリポジトリをリセットする。
 * CI 環境（process.env.CI が設定されている場合）のみ有効。
 */
export const POST = (): NextResponse => {
  if (!process.env.CI) {
    return NextResponse.json({ error: 'Not available outside CI' }, { status: 403 });
  }

  clearRepositoryForTesting();
  return NextResponse.json({ success: true });
};
