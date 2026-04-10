import { expect, test } from '@playwright/test';

test.describe('P2-FEAT-04: タグ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('textarea');
  });

  test('タグを複数追加してリロード後も復元される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('タグ付きの日記');
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    const tagInput = page.getByPlaceholder('タグを追加...');
    await tagInput.fill('仕事');
    await tagInput.press('Enter');
    await expect(page.getByRole('button', { name: '仕事を削除' })).toBeVisible({ timeout: 5000 });

    await tagInput.fill('勉強');
    await tagInput.press('Enter');
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible({ timeout: 5000 });

    // タグ保存を待つ
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    await page.reload();
    await page.waitForSelector('textarea');

    await expect(page.getByRole('button', { name: '仕事を削除' })).toBeVisible();
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible();
  });

  test('タグを削除すると保存データからも削除される', async ({ page }) => {
    const tagInput = page.getByPlaceholder('タグを追加...');
    await tagInput.fill('仕事');
    await tagInput.press('Enter');
    await expect(page.getByRole('button', { name: '仕事を削除' })).toBeVisible({ timeout: 5000 });

    await tagInput.fill('勉強');
    await tagInput.press('Enter');
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible({ timeout: 5000 });

    // タグ保存を待つ
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: '仕事を削除' }).click();

    // 削除後の保存を待つ
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    await page.reload();
    await page.waitForSelector('textarea');

    await expect(page.getByRole('button', { name: '仕事を削除' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible();
  });
});
