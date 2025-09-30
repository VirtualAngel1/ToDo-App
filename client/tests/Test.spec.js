const { test, expect } = require('@playwright/test');

test('Home page loads', async ({ page }) => {
  console.log('Navigating to homepage...');
  await page.goto('/', { timeout: 20000 }); 

  await page.waitForSelector('#root', { timeout: 10000 });
  console.log('Root element found.');

  const title = await page.title();
  console.log('Actual title:', title);

  await expect(title).toMatch(/To-Do App/i);
});
