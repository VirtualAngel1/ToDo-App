const { test, expect } = require('@playwright/test');

test('Home page loads', async ({ page }) => {
  await page.goto(process.env.SERVICE_URL_FRONTEND || 'https://todo-app-4g2e.onrender.com');
  await expect(page).toHaveTitle(/To-Do App/i);
});
