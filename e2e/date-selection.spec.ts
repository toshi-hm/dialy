import { expect, test } from '@playwright/test';

test.describe('FR-01: 日付選択機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="slider"]');
  });

  test('AT-01-01: 初回表示時に今日の日付が表示される', async ({ page }) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateText = await page.locator('text=/\\d+月\\d+日/').first().textContent();
    expect(dateText).toContain(`${month}月${day}日`);
  });

  test('AT-01-04: 未来日付は選択できない', async ({ page }) => {
    // Record today's date text before attempting to move forward
    const dateText = await page.locator('text=/\\d+月\\d+日/').first().textContent();

    const dial = page.locator('[role="slider"]');
    await dial.focus();
    await page.keyboard.press('ArrowRight');

    // Wait briefly for any potential state change
    await page.waitForTimeout(500);

    // Verify: either an error alert is shown, or the date has not changed
    const errorMessage = page.locator('[role="alert"]');
    const errorVisible = await errorMessage.isVisible();

    if (errorVisible) {
      await expect(errorMessage).toContainText('未来');
    } else {
      // Date should remain unchanged
      const dateTextAfter = await page.locator('text=/\\d+月\\d+日/').first().textContent();
      expect(dateTextAfter).toBe(dateText);
    }
  });

  test('AT-01-06: カレンダーダイアログが表示される', async ({ page }) => {
    const dial = page.locator('[role="slider"]');
    await dial.click();
    const calendarDialog = page.locator('[role="dialog"]');
    await expect(calendarDialog).toBeVisible({ timeout: 3000 });
  });
});
