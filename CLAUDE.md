# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dialy is a diary application built with Next.js 16 and React 19 that allows users to view past entries for the same day at a glance. The project follows the Atomic Design pattern and uses modern tooling with TypeScript.

## Essential Commands

### Development
```bash
pnpm dev          # Start Next.js development server (localhost:3000)
pnpm build        # Build production bundle
pnpm start        # Start production server
```

### Testing
```bash
pnpm test                # Run Vitest tests in watch mode
pnpm test:ui             # Run tests with Vitest UI
pnpm test:coverage       # Generate coverage report
pnpm test -- <pattern>   # Run specific test files (e.g., pnpm test Button)
```

### Code Quality
```bash
pnpm lint          # Run Biome linter
pnpm format        # Auto-format with Biome
pnpm format:check  # Check formatting without writing
```

### Component Development
```bash
pnpm storybook        # Start Storybook dev server (localhost:6006)
pnpm build-storybook  # Build static Storybook
```

### Visual Regression Testing
```bash
npx reg-suit run  # Run visual regression tests (requires baseline)
```

## Development Principles

このプロジェクトでは、品質の高いコードを維持するために以下の開発原則を採用しています。

### Test Driven Development (TDD)
テスト駆動開発に従い、Red-Green-Refactorサイクルで開発を進めます。

詳細は @.claude/rules/tdd.md を参照してください。

### Domain Driven Development (DDD)
ビジネスロジックをドメイン層に集約し、関心の分離を実現します。

詳細は @.claude/rules/ddd.md を参照してください。

## Architecture

このプロジェクトは、保守性と拡張性を重視した階層化アーキテクチャを採用しています。

### Atomic Design
コンポーネントは厳格なAtomic Design階層に従います:
- **atoms/** → **molecules/** → **organisms/** → **templates/** → **app/**

各階層は下位階層のコンポーネントのみをインポート可能です。

詳細は @.claude/rules/atomic-design.md を参照してください。

### Clean Architecture
ドメイン駆動設計とクリーンアーキテクチャの原則に従い、ビジネスロジックをフレームワークから独立させます。

依存関係ルール: **Presentation → Application → Domain**

詳細は @.claude/rules/clean-architecture.md を参照してください。

### Key Conventions

1. **Path Aliases**: Use `@/` for all src imports (configured in tsconfig.json and vitest.config.ts)
   ```typescript
   import { Button } from '@/components/atoms/Button';
   ```

2. **Component Structure**: Each component should have:
   - `ComponentName.tsx` - Main component file
   - `ComponentName.stories.tsx` - Storybook stories
   - `ComponentName.test.tsx` - Vitest tests
   - `index.ts` - Re-export (optional)

3. **Validation**: Use Zod schemas in `src/lib/validations/` for data validation

4. **Styling**: Tailwind CSS v4.1 is configured. Use utility classes directly.

5. **Code Style**: Biome enforces:
   - Single quotes for TS
   - Double quotes for TSX
   - 2-space indentation
   - 100-character line width
   - Trailing commas
   - Semicolons required

## Testing Strategy

- **Unit Tests**: Vitest with jsdom and @testing-library/react
- **Visual Tests**: Storybook + reg-suit for visual regression
- **CI Pipeline**: GitHub Actions runs lint, format check, tests, and VRT on PRs

Test files must be colocated with components using `.test.tsx` suffix.

## Skills

このプロジェクトでは、開発を効率化するためのカスタムスキルを提供しています。

利用可能なスキル:
- **react-component**: React/Next.jsコンポーネントの作成
- **unit-test**: Vitestユニットテストの作成
- **storybook-story**: Storybookストーリーの作成
- **e2e-test**: E2Eテストの作成

各スキルの詳細は @.claude/skills/ ディレクトリを参照してください。

## Rules

コードの品質と一貫性を保つため、以下のルールが定義されています:

- **@.claude/rules/tdd.md**: テスト駆動開発のガイドライン
- **@.claude/rules/ddd.md**: ドメイン駆動開発の原則
- **@.claude/rules/atomic-design.md**: Atomic Design階層構造のルール
- **@.claude/rules/clean-architecture.md**: クリーンアーキテクチャの原則
- **@.claude/rules/react-nextjs.md**: React/Next.js固有のベストプラクティス
- **@.claude/rules/design.md**: デザインシステムとスタイルガイド

## Package Manager

**Always use pnpm** (version 10 specified in packageManager field). The project requires:
- Node.js ≥ 22
- pnpm ≥ 10

Do not use npm or yarn.

## CI/CD

Pull requests to `main` or `develop` branches trigger automated checks:
1. Biome lint and format validation
2. Vitest unit tests
3. Storybook build for VRT

All checks must pass before merging.
