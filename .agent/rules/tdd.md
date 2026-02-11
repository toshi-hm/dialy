---
trigger: always_on
glob: src/**/*.test.{ts,tsx}
description: TDD（テスト駆動開発）のRed-Green-Refactorサイクルと実践ガイドライン。
---

# Test Driven Development (TDD) Rules

このプロジェクトでは、テスト駆動開発（TDD）を推奨します。

## TDDサイクル: Red-Green-Refactor

```
1. Red   → 失敗するテストを書く
2. Green → テストを通す最小限のコードを書く
3. Refactor → コードを改善する（テストは通ったまま）
```

### 1. Red: 失敗するテストを書く

新機能や修正を実装する前に、**まずテストを書く**。

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

テストを実行: `pnpm test Button` → **失敗を確認** ❌

### 2. Green: テストを通す最小限のコードを書く

```typescript
// Button.tsx
import type { FC, ReactNode } from 'react';

type ButtonProps = { children: ReactNode; }

export const Button: FC<ButtonProps> = ({ children }) => {
  return <button>{children}</button>;
};
```

テストを実行: `pnpm test Button` → **成功を確認** ✅

### 3. Refactor: コードを改善する

テストが通った状態で、コードの品質を向上。リファクタリング後もテストが通ることを確認。

## TDDのベストプラクティス

### 小さなステップで進む

```typescript
// ✅ Good - 1つずつ実装
test('validates email format', () => { /* ... */ });
test('saves user to database', () => { /* ... */ });

// ❌ Bad - 一度に多くを実装
test('complete user registration flow', () => { /* ... */ });
```

### テストは1つの動作を検証

```typescript
// ✅ Good - 1テスト1検証
test('renders button with text', () => { /* ... */ });
test('calls onClick when clicked', () => { /* ... */ });

// ❌ Bad - 複数の検証
test('button works correctly', () => { /* 複数のassert */ });
```

### AAA パターン（Arrange-Act-Assert）

```typescript
test('updates count when clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initialCount={0} />);

  // Act
  await user.click(screen.getByRole('button', { name: 'Increment' }));

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### テストの独立性を保つ

各テストが他のテストに依存しないようにする。

## テストコマンド

```bash
pnpm test               # ウォッチモードで実行
pnpm test -- --run      # 単発実行
pnpm test Button        # 特定のファイルのみ
pnpm test:coverage      # カバレッジ確認
```

## TDDを適用すべき場所

### 優先度: 高
- ✅ ビジネスロジック（Domain層）
- ✅ ユースケース（Application層）
- ✅ バリデーション関数
- ✅ 再利用可能なコンポーネント

### 優先度: 中
- ✅ 複雑なUIコンポーネント
- ✅ フォーム処理・状態管理

### 優先度: 低
- ⚠️ 単純な表示専用コンポーネント
- ⚠️ プロトタイプや実験的なコード

**重要**: TDDは厳格なルールではなく、品質を高めるためのツールです。状況に応じて柔軟に適用しましょう。
