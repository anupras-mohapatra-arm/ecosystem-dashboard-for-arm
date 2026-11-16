import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:1313/linux/', { waitUntil: 'networkidle0' });
await page.screenshot({ path: 'dashboard.png' });

console.log('Screenshot saved to dashboard.png');
await browser.close();
