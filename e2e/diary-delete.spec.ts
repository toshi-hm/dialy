import { expect, test } from '@playwright/test';

test.describe('FR-05: 日記削除機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('textarea');
  });

  test('AT-05-01: 日記がない場合は削除ボタンが表示されない', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: '削除' });
    await expect(deleteButton).not.toBeVisible();
  });

  test('AT-05-02/03: 削除確認ダイアログ経由で日記が削除される', async ({ page }) => {
    // Create a diary entry first
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.pressSequentially('削除テスト用の日記', { delay: 50 });
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    // Click delete button
    const deleteButton = page.getByRole('button', { name: '削除' });
    await expect(deleteButton).toBeVisible({ timeout: 3000 });
    await deleteButton.click();

    // Confirm dialog should appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Confirm deletion
    const confirmButton = dialog.getByRole('button', { name: '削除' });
    await confirmButton.click();

    // Textarea should be cleared
    await expect(textarea).toHaveValue('', { timeout: 5000 });
  });

  test('AT-05-04: キャンセルで日記が保持される', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.pressSequentially('キャンセルテスト用の日記', { delay: 50 });
    await expect(page.getByText('保存しました')).toBeVisible({ timeout: 15000 });

    const deleteButton = page.getByRole('button', { name: '削除' });
    await deleteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const cancelButton = dialog.getByRole('button', { name: 'キャンセル' });
    await cancelButton.click();

    await expect(textarea).toHaveValue('キャンセルテスト用の日記');
  });
});
