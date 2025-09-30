const { test, expect } = require('@playwright/test');

test('Home page loads', async ({ page }) => {
  console.log('Navigating to homepage...');
  await page.goto('/', { timeout: 10000 });
  console.log('Page loaded.');
  await expect(page).toHaveTitle(/To-Do App/i);
});
