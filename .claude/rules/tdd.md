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

**この時点では Button コンポーネントは存在しないか、不完全な状態**

テストを実行: `pnpm test Button`
→ **失敗することを確認** ❌

### 2. Green: テストを通す最小限のコードを書く

テストを通すために必要な最小限のコードだけを実装。

```typescript
// Button.tsx
import type { FC, ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
};

export const Button: FC<ButtonProps> = ({ children }) => {
  return <button>{children}</button>;
};
```

テストを実行: `pnpm test Button`
→ **成功することを確認** ✅

### 3. Refactor: コードを改善する

テストが通った状態で、コードの品質を向上。

```typescript
// Button.tsx
import type { FC, ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

リファクタリング後もテストを実行: `pnpm test Button`
→ **引き続き成功することを確認** ✅

## TDDの実践ガイドライン

### テストを先に書く理由

1. **要件の明確化**: テストを書くことで、何を実装すべきか明確になる
2. **設計の改善**: テストしやすいコードは、良い設計であることが多い
3. **リファクタリングの安全性**: テストがあれば、安心してコードを改善できる
4. **ドキュメント**: テストは実装の使い方を示すドキュメントとなる
5. **バグの早期発見**: 実装前にテストを書くことで、仕様の齟齬を早期に発見

### テストファースト開発のステップ

**機能開発の例: ユーザー登録フォームのバリデーション**

#### Step 1: 最初のテスト（Red）

```typescript
// validateEmail.test.ts
import { describe, test, expect } from 'vitest';
import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  test('returns true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
});
```

実行 → ❌ 失敗（関数が存在しない）

#### Step 2: 最小実装（Green）

```typescript
// validateEmail.ts
export function validateEmail(email: string): boolean {
  return true; // 最小限の実装
}
```

実行 → ✅ 成功

#### Step 3: 次のテスト追加（Red）

```typescript
test('returns false for invalid email', () => {
  expect(validateEmail('invalid-email')).toBe(false);
});
```

実行 → ❌ 失敗

#### Step 4: 実装を改善（Green）

```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

実行 → ✅ 成功

#### Step 5: エッジケース追加（Red）

```typescript
test('returns false for empty string', () => {
  expect(validateEmail('')).toBe(false);
});

test('returns false for email without domain', () => {
  expect(validateEmail('user@')).toBe(false);
});
```

実行 → ✅ 成功（実装が既にカバーしている）

#### Step 6: リファクタリング（Refactor）

```typescript
// Zodスキーマに移行
import { z } from 'zod';

export const emailSchema = z.string().email();

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}
```

実行 → ✅ すべてのテストが通る

### TDD のベストプラクティス

#### 1. 小さなステップで進む

```typescript
// ❌ Bad - 一度に多くを実装
test('complete user registration flow', () => {
  // バリデーション、保存、メール送信、リダイレクト...
});

// ✅ Good - 1つずつ実装
test('validates email format', () => { /* ... */ });
test('saves user to database', () => { /* ... */ });
test('sends confirmation email', () => { /* ... */ });
```

#### 2. テストは1つの動作を検証

```typescript
// ❌ Bad - 複数の検証
test('button works correctly', () => {
  render(<Button onClick={mockFn}>Click</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
  expect(screen.getByRole('button')).toHaveClass('active');
});

// ✅ Good - 1テスト1検証
test('renders button with text', () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
});

test('calls onClick when clicked', async () => {
  const user = userEvent.setup();
  const mockFn = vi.fn();
  render(<Button onClick={mockFn}>Click</Button>);
  await user.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

#### 3. わかりやすいテスト名

```typescript
// ❌ Bad
test('test1', () => { /* ... */ });
test('button test', () => { /* ... */ });

// ✅ Good - 何をテストしているか明確
test('renders button with correct text', () => { /* ... */ });
test('disables button when loading prop is true', () => { /* ... */ });
test('calls onClick handler when clicked', () => { /* ... */ });
```

#### 4. AAA パターン（Arrange-Act-Assert）

```typescript
test('updates count when increment button is clicked', async () => {
  // Arrange: テストの準備
  const user = userEvent.setup();
  render(<Counter initialCount={0} />);

  // Act: アクションを実行
  const button = screen.getByRole('button', { name: 'Increment' });
  await user.click(button);

  // Assert: 結果を検証
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### 5. テストの独立性を保つ

```typescript
// ❌ Bad - テスト間で状態を共有
let counter = 0;

test('increments counter', () => {
  counter++; // グローバル変数を変更
  expect(counter).toBe(1);
});

test('counter is 2', () => {
  counter++; // 前のテストに依存
  expect(counter).toBe(2);
});

// ✅ Good - 各テストが独立
test('increments counter from 0', () => {
  const counter = 0;
  expect(counter + 1).toBe(1);
});

test('increments counter from 5', () => {
  const counter = 5;
  expect(counter + 1).toBe(6);
});
```

## コンポーネント開発のTDDワークフロー

### 1. コンポーネント仕様を決定

「どんなコンポーネントを作るか」を明確にする

例: Buttonコンポーネント
- テキストとアイコンを表示
- クリック可能
- プライマリ/セカンダリのバリエーション
- ローディング状態をサポート

### 2. テストファイルを作成

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  // テストケースを列挙（まだ実装しない）
});
```

### 3. 最初のテストケースを書く（最もシンプルなもの）

```typescript
test('renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});
```

### 4. Red → Green → Refactor を繰り返す

各テストケースごとに:
1. テストを書く（失敗を確認）
2. 実装する（成功を確認）
3. リファクタリング（成功を維持）

### 5. すべての要件をテストでカバー

- バリエーション
- イベントハンドラー
- エッジケース
- アクセシビリティ

## テストコマンド

```bash
pnpm test               # ウォッチモードで実行
pnpm test Button        # 特定のファイルのみ
pnpm test:coverage      # カバレッジ確認
pnpm test:ui            # UIでテスト実行
```

## TDDを適用すべき場所

### 優先度: 高

- ✅ ビジネスロジック（Domain層）
- ✅ ユースケース（Application層）
- ✅ バリデーション関数
- ✅ ユーティリティ関数
- ✅ 再利用可能なコンポーネント

### 優先度: 中

- ✅ 複雑なUIコンポーネント
- ✅ フォーム処理
- ✅ 状態管理

### 優先度: 低（状況に応じて）

- ⚠️ 単純な表示専用コンポーネント
- ⚠️ プロトタイプや実験的なコード
- ⚠️ 1回限りのスクリプト

## まとめ

TDDは最初は時間がかかるように感じますが、以下のメリットがあります:

1. **バグの削減**: 実装前にテストを書くため、仕様の齟齬を早期発見
2. **設計の改善**: テストしやすいコードは、良い設計
3. **リファクタリングの安全性**: テストがあれば、安心してコードを改善
4. **ドキュメント**: テストは最新の使い方を示す実行可能なドキュメント
5. **開発速度の向上**: 長期的には、バグ修正時間が減り、開発速度が向上

**重要**: TDDは厳格なルールではなく、品質を高めるためのツールです。状況に応じて柔軟に適用しましょう。
