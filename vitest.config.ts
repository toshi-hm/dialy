import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', 'e2e', '.next', 'storybook-static'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '.storybook/',
        'storybook-static/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/types/**',
        '**/index.ts', // re-export files
      ],
      thresholds: {
        // Global thresholds (based on PLANS.md MVP-TEST-02 requirements)
        // Note: Vitest v8 provider doesn't support per-directory thresholds natively.
        // Layer-specific goals (see scripts/check-coverage-thresholds.mjs for current values):
        //   - Domain layer (lib/domain): Target 100%
        //   - Application layer (lib/use-cases): Target 90%
        //   - Presentation layer (components): Target 60%
        // Global thresholds set to ensure minimum quality across all layers
        lines: 85,
        functions: 80,
        branches: 75,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
