---
name: unit-test
description: Vitestを使用したユニットテストを作成します。コンポーネントのレンダリング、ユーザー操作、エッジケースを網羅したテストを生成します。
---

# Unit Test Creation with Vitest

Vitest と @testing-library/react を使用して、包括的なユニットテストを作成します。

## テスト作成手順

### 1. テストファイルの基本構造

```typescript
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders correctly with required props', () => {
    render(<ComponentName title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ComponentName onClick={handleClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    render(<ComponentName className="custom-class" />);
    const element = screen.getByRole('...');
    expect(element).toHaveClass('custom-class');
  });
});
```

### 2. テストカバレッジ

以下の観点を網羅:

**レンダリングテスト**:
- 必須propsでの正常なレンダリング
- オプショナルpropsの有無での動作
- 異なるpropsのバリエーション

**ユーザー操作テスト**:
- クリック、入力、フォーカスなどのイベント
- キーボード操作（Enter, Escape, Tab など）
- 非同期操作の完了待機

**状態管理テスト**:
- 内部状態の変化
- 条件付きレンダリング
- エラー状態の処理

**アクセシビリティテスト**:
- 適切なARIAロールの確認
- キーボードナビゲーション
- スクリーンリーダー対応

**エッジケーステスト**:
- 空の値、null、undefined
- 極端に長いテキスト
- 不正な入力値

### 3. Testing Library のクエリ優先順位

アクセシビリティを考慮した順序で要素を取得:

1. `getByRole()` - 最優先（セマンティックHTMLとARIA）
2. `getByLabelText()` - フォーム要素
3. `getByPlaceholderText()` - フォーム要素（補助的）
4. `getByText()` - テキストコンテンツ
5. `getByTestId()` - 最終手段

```typescript
// Good - アクセシブルな方法
const button = screen.getByRole('button', { name: 'Submit' });
const input = screen.getByLabelText('Email');

// Avoid - テスト専用属性に依存
const element = screen.getByTestId('submit-button');
```

### 4. 非同期操作のテスト

```typescript
test('loads data asynchronously', async () => {
  render(<AsyncComponent />);

  // 初期状態を確認
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // データが表示されるまで待機
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();

  // ローディング表示が消えたことを確認
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

### 5. モックの使用

```typescript
import { vi } from 'vitest';

// 関数のモック
const mockFn = vi.fn();

// モジュールのモック
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' })),
}));

// タイマーのモック
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

### 6. スナップショットテスト

複雑なUIの回帰テストに使用:

```typescript
test('matches snapshot', () => {
  const { container } = render(<ComponentName />);
  expect(container).toMatchSnapshot();
});
```

**注意**: スナップショットテストは最小限に。主に複雑なマークアップの回帰検知に使用。

## テストコマンド

```bash
pnpm test                # ウォッチモードでテスト実行
pnpm test ComponentName  # 特定のテストファイルを実行
pnpm test:ui             # Vitest UI起動
pnpm test:coverage       # カバレッジレポート生成
```

## ベストプラクティス

1. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）
2. **1テスト1検証**: 各テストは1つの動作を検証
3. **わかりやすいテスト名**: 何をテストしているか明確に
4. **テストの独立性**: テスト間で状態を共有しない
5. **実装の詳細に依存しない**: ユーザーの視点でテスト

## 出力

1. `.test.tsx` ファイルを作成
2. テストケースの一覧と各テストの目的を説明
3. カバレッジ率を確認するコマンドを案内
4. テストの実行方法を説明
