---
description: Playwrightを使用したE2Eテストを作成する
---

// turbo-all

## 手順

### 1. テスト対象のユーザーフローを確認

テスト対象のページ・機能を確認し、テストシナリオを設計する。

### 2. Playwrightのインストール確認

```bash
npx playwright --version
```

インストールされていない場合:

```bash
pnpm add -D @playwright/test
npx playwright install
```

### 3. テストファイルを作成

`e2e/` ディレクトリにテストファイルを作成する。基本構造:

```typescript
import { test, expect } from '@playwright/test';

test.describe('対象フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('シナリオ名', async ({ page }) => {
    // ユーザー操作 → 結果検証
  });
});
```

- `getByRole`, `getByLabel` などアクセシビリティ重視のセレクタを使用
- 必要に応じてPage Object Modelを作成

### 4. テストを実行

```bash
npx playwright test
```

### 5. 結果を確認

```bash
npx playwright show-report
```
