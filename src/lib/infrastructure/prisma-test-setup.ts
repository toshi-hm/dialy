import { execSync } from 'node:child_process';
import path from 'node:path';
import { createPrismaClient } from './prisma';

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const TEST_DB_PATH = path.join(projectRoot, 'prisma', 'test-prisma-repo.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

export const setupTestDatabase = () => {
  const prismaBin = path.join(projectRoot, 'node_modules', '.bin', 'prisma');
  execSync(`"${prismaBin}" db push --force-reset --url "${TEST_DB_URL}"`, {
    env: {
      ...process.env,
    },
    cwd: projectRoot,
    stdio: 'pipe',
  });
};

export const createTestPrismaClient = () => {
  return createPrismaClient(TEST_DB_URL);
};
