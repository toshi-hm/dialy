---
paths:
  - "src/**/*.{ts,tsx}"
---

# TypeScript Conventions

このプロジェクトのTypeScriptコーディング規約。

## 1. 関数定義: アロー関数に統一

`function` 宣言は使わず、すべてアロー関数（`const` + `=>`）で統一する。

```typescript
// ✅ Good - アロー関数
const handleClick = () => {
  console.log('clicked');
};

const add = (a: number, b: number): number => a + b;

const MyComponent: FC<Props> = ({ title }) => {
  return <h1>{title}</h1>;
};

// ❌ Bad - function宣言
function handleClick() {
  console.log('clicked');
}

function add(a: number, b: number): number {
  return a + b;
}

export default function MyComponent({ title }: Props) {
  return <h1>{title}</h1>;
}

**例外**: クラスメソッドは通常のメソッド構文を使用する。

```typescript
// ✅ OK - クラスメソッドはそのまま
export class DiaryEntry {
  static create(date: Date, content: string): DiaryEntry {
    return new DiaryEntry(/* ... */);
  }

  private validate(): void {
    // ...
  }
}
```

## 2. 型定義: `type` に統一

`interface` は使わず、すべて `type` で定義する。

```typescript
// ✅ Good
type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

// extends の代わりに &（intersection）を使用
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  label: string;
};

// ❌ Bad
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}
```

## 3. 命名規則

### ファイル名

| 対象 | 規則 | 例 |
|------|------|---|
| コンポーネント | PascalCase | `DiaryEditor.tsx`, `DateDisplay.tsx` |
| ユーティリティ | kebab-case | `date-utils.ts`, `cn.ts` |
| ドメインモデル | kebab-case | `diary-entry.ts`, `date-value.ts` |
| ユースケース | kebab-case | `create-diary-entry.ts` |
| テストファイル | 元ファイル名 + `.test` | `DiaryEditor.test.tsx`, `diary-entry.test.ts` |
| Storybook | 元ファイル名 + `.stories` | `DiaryEditor.stories.tsx` |
| 型定義ファイル | kebab-case | `diary.ts` (in `src/types/`) |
| バリデーション | kebab-case | `diary.ts` (in `src/lib/validations/`) |

### 変数・関数名

| 対象 | 規則 | 例 |
|------|------|---|
| 変数 | camelCase | `diaryEntry`, `selectedDate` |
| 関数 | camelCase | `handleClick`, `formatDate` |
| 定数 | UPPER_SNAKE_CASE | `STORAGE_KEY`, `MAX_CONTENT_LENGTH` |
| 真偽値 | `is` / `has` / `can` / `should` 接頭辞 | `isLoading`, `hasError`, `canEdit` |
| イベントハンドラー | `handle` + 動詞 | `handleClick`, `handleDateChange` |
| コールバックprop | `on` + 動詞 | `onClick`, `onDateChange`, `onSave` |

### 型・クラス名

| 対象 | 規則 | 例 |
|------|------|---|
| 型 (type) | PascalCase | `DiaryEntry`, `ButtonProps` |
| Props型 | コンポーネント名 + `Props` | `DiaryEditorProps`, `DialProps` |
| クラス | PascalCase | `DiaryEntry`, `DateValue` |
| Enum（使用する場合） | PascalCase（値はUPPER_SNAKE_CASE） | `SaveStatus.IN_PROGRESS` |
| ジェネリクス型引数 | 1文字大文字 or 説明的な名前 | `T`, `TItem`, `TResponse` |

### ディレクトリ名

| 対象 | 規則 | 例 |
|------|------|---|
| コンポーネントディレクトリ | PascalCase | `DiaryEditor/`, `DateDisplay/` |
| その他のディレクトリ | kebab-case | `use-cases/`, `domain/`, `infrastructure/` |
| Next.js App Router | kebab-case | `app/diary/`, `app/api/` |

### React Hooks

| 対象 | 規則 | 例 |
|------|------|---|
| カスタムHook | `use` + PascalCase | `useDiary`, `useAutoSave` |
| カスタムHookファイル | `use` + PascalCase | `useDiary.ts`, `useAutoSave.ts` |

## 4. エクスポート

```typescript
// ✅ Good - named export を優先
export const Button: FC<ButtonProps> = ({ children }) => {
  return <button>{children}</button>;
};

// ✅ Good - 定数のexport
export const MAX_CONTENT_LENGTH = 10000;

// ✅ Good - 型のexport
export type ButtonProps = {
  children: ReactNode;
};

// ❌ Bad - default export は使わない（Next.js pages/layoutsを除く）
export default Button;
```

**例外**: Next.jsの `page.tsx` と `layout.tsx` は `export default` を使用する。

## 5. import の整理

```typescript
// 1. React / Next.js
import { useState, useCallback } from 'react';
import type { FC } from 'react';

// 2. 外部ライブラリ
import { z } from 'zod';

// 3. プロジェクト内部（階層の深い順）
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { Button } from '@/components/atoms/Button';

// 4. 相対パス（同一ディレクトリ）
import { helperFunction } from './helper';
```

型インポートは `import type` を使用する：

```typescript
// ✅ Good
import type { FC, ReactNode } from 'react';
import type { DiaryEntry } from '@/lib/domain/diary-entry';

// ❌ Bad
import { FC, ReactNode } from 'react';
```
