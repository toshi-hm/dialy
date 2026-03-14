import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { LocalStorageDiaryRepository } from './local-storage-diary-repository';

/**
 * クライアント側で使用するリポジトリを生成する。
 * サーバー側（Prisma）は Server Actions 経由でのみ使用されるため、
 * このファクトリは常に LocalStorageDiaryRepository を返す。
 * サーバー側のリポジトリが必要な場合は createServerDiaryRepository() を使用する。
 */
export const createDiaryRepository = (): DiaryRepository => {
  return new LocalStorageDiaryRepository();
};

/**
 * サーバー側で使用するリポジトリを生成する。
 * Server Actions や API Routes など、Node.js 環境でのみ呼び出すこと。
 */
export const createServerDiaryRepository = async (): Promise<DiaryRepository> => {
  const { PrismaDiaryRepository } = await import('./prisma-diary-repository');
  const { prisma } = await import('./prisma');
  return new PrismaDiaryRepository(prisma);
};
