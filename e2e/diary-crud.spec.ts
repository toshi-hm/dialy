import { expect, test } from '@playwright/test';

test.describe('FR-02/FR-03: 日記作成・編集機能', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('textarea');
  });

  test('AT-02-01: 新規日付でテキストエリアが空で表示される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue('');
  });

  test('AT-02-02: 1秒間入力停止で自動保存される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.pressSequentially('テスト日記の内容です', { delay: 50 });
    const saveStatus = page.locator('text=/保存しました/');
    await expect(saveStatus).toBeVisible({ timeout: 15000 });
  });

  test('AT-02-03: ページリロード後もデータが復元される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.pressSequentially('永続化テスト内容', { delay: 50 });
    await page.waitForSelector('text=/保存しました/', { timeout: 15000 });

    await page.reload();
    await page.waitForSelector('textarea');
    const restoredTextarea = page.locator('textarea');
    await expect(restoredTextarea).toHaveValue('永続化テスト内容', { timeout: 5000 });
  });

  test('AT-02-04: 文字数カウントがリアルタイムで表示される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('あいうえお');
    const charCount = page.locator('text=/文字数: 5/');
    await expect(charCount).toBeVisible({ timeout: 3000 });
  });
});
