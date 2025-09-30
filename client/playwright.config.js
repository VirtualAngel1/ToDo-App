const config = {
  testDir: './tests',
  timeout: 1000000, 
  testMatch: /.*\.js/,
  reporter: [['junit', { outputFile: 'playwright-report/results.xml' }]],
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        baseURL: process.env.SERVICE_URL_FRONTEND || 'http://localhost:3500',
        headless: true,
        viewport: { width: 1280, height: 720 },
        navigationTimeout: 5000,
        expect: { timeout: 3000 },
      },
    },
  ],
};

module.exports = config;
