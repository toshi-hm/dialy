---
name: e2e-test
description: Playwrightを使用したE2Eテストを作成します。実際のユーザーフローをシミュレートし、ページ間の統合とエンドツーエンドの動作を検証します。
---

# E2E Test Creation with Playwright

Playwright を使用して、実際のユーザーシナリオを再現するE2Eテストを作成します。

## 前提条件

Playwright がまだインストールされていない場合:

```bash
pnpm add -D @playwright/test
npx playwright install
```

## テスト作成手順

### 1. テストファイルの基本構造

```typescript
// e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前の共通セットアップ
    await page.goto('/');
  });

  test('should complete primary user journey', async ({ page }) => {
    // 1. ページに移動
    await page.goto('/diary');

    // 2. 要素が表示されるまで待機
    await expect(page.getByRole('heading', { name: 'My Diary' })).toBeVisible();

    // 3. ユーザー操作を実行
    await page.getByRole('button', { name: 'New Entry' }).click();

    // 4. フォームに入力
    await page.getByLabel('Title').fill('Test Entry');
    await page.getByLabel('Content').fill('This is a test entry.');

    // 5. 送信
    await page.getByRole('button', { name: 'Save' }).click();

    // 6. 結果を検証
    await expect(page.getByText('Entry saved successfully')).toBeVisible();
  });
});
```

### 2. テストシナリオの設計

**主要なユーザーフロー**:
- 新規ユーザー登録フロー
- ログイン/ログアウトフロー
- コンテンツ作成・編集・削除フロー
- 検索とフィルタリング
- ナビゲーションフロー

**エッジケースとエラーハンドリング**:
- バリデーションエラー
- ネットワークエラー
- 権限エラー
- データの境界値

### 3. Page Object Model (POM)

再利用可能なページオブジェクトを作成:

```typescript
// e2e/pages/DiaryPage.ts
import { Page, Locator } from '@playwright/test';

export class DiaryPage {
  readonly page: Page;
  readonly newEntryButton: Locator;
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEntryButton = page.getByRole('button', { name: 'New Entry' });
    this.titleInput = page.getByLabel('Title');
    this.contentInput = page.getByLabel('Content');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/diary');
  }

  async createEntry(title: string, content: string) {
    await this.newEntryButton.click();
    await this.titleInput.fill(title);
    await this.contentInput.fill(content);
    await this.saveButton.click();
  }
}

// 使用例
test('create diary entry', async ({ page }) => {
  const diaryPage = new DiaryPage(page);
  await diaryPage.goto();
  await diaryPage.createEntry('Test', 'Content');
});
```

### 4. 認証とセッション管理

セットアップでログイン状態を保存:

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForURL('/dashboard');

  // セッションを保存
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

テストで再利用:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'authenticated',
      use: { storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

### 5. API モックとインターセプト

外部APIをモック:

```typescript
test('shows error when API fails', async ({ page }) => {
  // APIリクエストをインターセプト
  await page.route('**/api/entries', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });

  await page.goto('/diary');
  await expect(page.getByText('Failed to load entries')).toBeVisible();
});
```

### 6. レスポンシブテスト

異なるビューポートでテスト:

```typescript
test.describe('responsive layout', () => {
  test('mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // モバイル固有のUIをテスト
  });

  test('desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    // デスクトップ固有のUIをテスト
  });
});
```

### 7. アクセシビリティテスト

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

### 8. Visual Regression Testing

スクリーンショット比較:

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

## Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## テストコマンド

```bash
npx playwright test              # 全テスト実行
npx playwright test --ui         # UI モードで実行
npx playwright test --debug      # デバッグモード
npx playwright test user-flow    # 特定のテストファイル
npx playwright show-report       # レポート表示
npx playwright codegen           # テストコード生成
```

## ベストプラクティス

1. **信頼性の高いセレクタ**: `getByRole`, `getByLabel` などアクセシビリティ重視のセレクタを使用
2. **明示的な待機**: `waitForLoadState`, `waitForURL` で確実に待機
3. **独立したテスト**: テスト間でデータや状態を共有しない
4. **POMパターン**: ページオブジェクトで再利用性を高める
5. **適切な粒度**: E2Eテストは重要なユーザーフローに絞る

## 出力

1. E2Eテストファイルを作成
2. テストシナリオと検証内容を説明
3. テスト実行方法を案内
4. 必要に応じてPage Objectを作成
