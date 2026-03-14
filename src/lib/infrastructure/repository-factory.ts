import type { DiaryRepository } from '@/lib/domain/interfaces/diary-repository';
import { LocalStorageDiaryRepository } from './local-storage-diary-repository';

export type RepositoryType = 'localStorage' | 'prisma';

export const createDiaryRepository = (type?: RepositoryType): DiaryRepository => {
  const repositoryType = type ?? getDefaultRepositoryType();

  switch (repositoryType) {
    case 'prisma':
      throw new Error(
        'Prisma repository should be used via Server Actions on the server side. ' +
          'Use createServerDiaryRepository() on the server instead.',
      );
    default:
      return new LocalStorageDiaryRepository();
  }
};

export const createServerDiaryRepository = async (): Promise<DiaryRepository> => {
  const { PrismaDiaryRepository } = await import('./prisma-diary-repository');
  const { prisma } = await import('./prisma');
  return new PrismaDiaryRepository(prisma);
};

const getDefaultRepositoryType = (): RepositoryType => {
  if (typeof window === 'undefined') {
    return 'prisma';
  }
  return 'localStorage';
};
