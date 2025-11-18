import { test, expect } from '@playwright/test';

test('Frontend Verification', async ({ page }) => {
  await page.goto('http://localhost:8080/menu/bestfoods/table1');
  await page.getByText('chinese').click();
  await expect(page.getByText('Rice with avocado')).toBeVisible();

  const initialItemCount = await page.locator('[data-testid="menu-item"]').count();
  expect(initialItemCount).toBeGreaterThan(0);

  // Scroll down to trigger infinite scroll
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000); // Wait for new items to load

  const finalItemCount = await page.locator('[data-testid="menu-item"]').count();
  expect(finalItemCount).toBeGreaterThan(initialItemCount);
  await page.screenshot({ path: 'tests/debug_screenshot.png' });
});
