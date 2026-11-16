import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});

const page = await browser.newPage();
await page.goto('http://localhost:1313/linux/', { waitUntil: 'networkidle0' });

// Find the row whose data-title matches "nginx" (case-insensitive)
const row = await page.evaluateHandle(() => {
  const rows = Array.from(document.querySelectorAll('tr[data-title]'));
  return rows.find(r => r.getAttribute('data-title').toLowerCase() === 'nginx') ?? null;
});

const found = await page.evaluate(el => el !== null, row);

if (found) {
  console.log('PASS: NGINX package is present in the rendered dashboard');
  await browser.close();
  process.exit(0);
} else {
  console.error('FAIL: NGINX package row not found');
  await browser.close();
  process.exit(1);
}
