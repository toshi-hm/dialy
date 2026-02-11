---
description: Vitestを使用したユニットテストを作成する
---

// turbo-all

## 手順

### 1. 対象コンポーネント/関数を確認

テスト対象のファイルを読み込み、テストすべき振る舞いを把握する。

### 2. テストファイルを作成

`ComponentName.test.tsx` を同ディレクトリに作成する。

- `@testing-library/react` の `render`, `screen` を使用
- `@testing-library/user-event` でユーザー操作をシミュレート
- クエリ優先順位: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`

### 3. テストケースを網羅

- **レンダリング**: 必須props / オプショナルprops
- **ユーザー操作**: クリック、入力、キーボード操作
- **状態管理**: 内部状態変化、条件付きレンダリング
- **エッジケース**: 空値、長いテキスト、不正入力

### 4. テストを実行

```bash
pnpm test -- --run
```

### 5. カバレッジを確認

```bash
pnpm test:coverage
```
