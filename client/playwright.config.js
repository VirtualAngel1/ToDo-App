const { devices } = require('@playwright/test');

const config = {
  testDir: './tests', 
  testMatch: /.*\.js/, 
  reporter: [['junit', { outputFile: 'playwright-report/results.xml' }]],
  use: {
    baseURL: process.env.SERVICE_URL_FRONTEND || 'https://todo-app-4g2e.onrender.com',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
};

module.exports = config;
