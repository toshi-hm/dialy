import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // マイグレーション実行時に使用する直接接続 URL（PgBouncer 非経由）
  // Supabase の場合は Session mode (port: 5432) の URL を DIRECT_URL に設定する
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
