# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js (App Router) + TypeScript app using Atomic Design.

- `src/app/`: routes, layouts, and global styles (`globals.css`).
- `src/components/`: UI components by layer (`atoms/`, later `molecules/`, `organisms/`, `templates/`).
- `src/lib/`: shared logic such as Zod schemas (`src/lib/validations/diary.ts`).
- `public/`: static assets served directly.
- `.storybook/`: Storybook configuration.
- `docs/`: requirements, architecture, and design notes.
- `.github/workflows/ci.yml`: CI checks run on pull requests.

Keep tests and stories close to components (for example `Button.test.tsx`, `Button.stories.tsx` next to `Button.tsx`).

## Build, Test, and Development Commands
Use Node `>=20` and pnpm `>=9` (`packageManager` is pnpm 10.x).

- `pnpm dev`: start local development server (`http://localhost:3000`).
- `pnpm build`: production build.
- `pnpm start`: run the built app.
- `pnpm lint`: run Biome lint rules.
- `pnpm format`: auto-format code with Biome.
- `pnpm format:check`: check formatting without writing.
- `pnpm test`: run Vitest unit tests.
- `pnpm test:coverage`: generate coverage report.
- `pnpm storybook`: run Storybook locally.
- `pnpm build-storybook`: build Storybook (also used in CI/VRT step).

## Coding Style & Naming Conventions
- Formatting is enforced by Biome: 2 spaces, single quotes (TS), semicolons, trailing commas, max line width 100.
- Use strict TypeScript and prefer explicit exported types for shared APIs.
- Use path alias `@/*` for imports from `src`.
- Component file pattern: `Component.tsx`, `Component.test.tsx`, `Component.stories.tsx`, `index.ts`.
- Keep component and story names in PascalCase; variables/functions in camelCase.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (`jsdom` environment, `vitest.setup.ts`).
- Test files should be named `*.test.ts` or `*.test.tsx` and colocated with source.
- Prefer user-facing assertions (`screen.getByRole`, visible text) over implementation details.
- Run `pnpm test`, and use `pnpm test:coverage` for larger feature or refactor work.

## Commit & Pull Request Guidelines
- Follow existing history style: `Add: ...`, `Fix: ...`, `Update: ...`, `Delete: ...` (capitalized type + concise summary).
- Keep commits focused and logically grouped; avoid mixing refactors and feature changes.
- PRs should include: clear description, testing performed, and screenshots for UI changes (app and/or Storybook).
- Ensure CI passes before requesting review: lint, format check, unit tests, and Storybook build.
