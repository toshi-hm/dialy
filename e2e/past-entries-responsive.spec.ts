import { expect, test } from '@playwright/test';

test.describe('FR-04: 過去同日日記表示機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('textarea');
  });

  test('AT-04-05: 過去の同日日記がない場合にメッセージが表示される', async ({ page }) => {
    const noEntriesMessage = page.locator('text=/過去の日記はまだありません/');
    await expect(noEntriesMessage).toBeVisible({ timeout: 5000 });
  });
});

test.describe('レスポンシブ表示', () => {
  test('AT-NF-05: デスクトップ表示が適切', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('[role="slider"]');

    // Dial and main content should both be visible
    const dial = page.locator('[role="slider"]');
    await expect(dial).toBeVisible();
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('AT-NF-05: モバイル表示が適切', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('[role="slider"]');

    const dial = page.locator('[role="slider"]');
    await expect(dial).toBeVisible();
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });
});
