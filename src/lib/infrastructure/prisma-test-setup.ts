import { execSync } from 'node:child_process';
import { createPrismaClient } from './prisma';

const TEST_DB_URL = 'file:./prisma/test-prisma-repo.db';

export const setupTestDatabase = () => {
  execSync(`npx prisma db push --force-reset --url "${TEST_DB_URL}"`, {
    env: {
      ...process.env,
    },
    stdio: 'pipe',
  });
};

export const createTestPrismaClient = () => {
  return createPrismaClient(TEST_DB_URL);
};
