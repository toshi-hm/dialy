import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'dialy_entries';

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
    await tagInput.fill('勉強');
    await tagInput.press('Enter');

    await page.waitForFunction((storageKey) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw) as { entries?: Array<{ tags?: string[] }> };
      const tags = parsed.entries?.[0]?.tags ?? [];
      return tags.includes('仕事') && tags.includes('勉強');
    }, STORAGE_KEY);

    await page.reload();
    await page.waitForSelector('textarea');

    await expect(page.getByRole('button', { name: '仕事を削除' })).toBeVisible();
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible();
  });

  test('タグを削除すると保存データからも削除される', async ({ page }) => {
    const tagInput = page.getByPlaceholder('タグを追加...');
    await tagInput.fill('仕事');
    await tagInput.press('Enter');
    await tagInput.fill('勉強');
    await tagInput.press('Enter');

    await page.getByRole('button', { name: '仕事を削除' }).click();

    await page.waitForFunction((storageKey) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw) as { entries?: Array<{ tags?: string[] }> };
      const tags = parsed.entries?.[0]?.tags ?? [];
      return tags.length === 1 && tags[0] === '勉強';
    }, STORAGE_KEY);

    await page.reload();
    await page.waitForSelector('textarea');

    await expect(page.getByRole('button', { name: '仕事を削除' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '勉強を削除' })).toBeVisible();
  });
});
