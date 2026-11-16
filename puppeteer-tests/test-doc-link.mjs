import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});

const page = await browser.newPage();
await page.goto('http://localhost:1313/linux/', { waitUntil: 'networkidle0' });

// Click the NGINX row to expand the sub-row containing resource links
const nginxRowIndex = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('tr[data-title]'));
  const idx = rows.findIndex(r => r.getAttribute('data-title').toLowerCase() === 'nginx');
  if (idx === -1) return -1;
  rows[idx].click();
  return idx;
});

if (nginxRowIndex === -1) {
  console.error('FAIL: could not find and click the NGINX row');
  await browser.close();
  process.exit(1);
}

// Wait for the official docs link to become visible in the expanded sub-row
await page.waitForSelector('a[data-source-type="official-docs"]', { timeout: 5000 });

// Scope the link to the sub-row that follows the NGINX row
const docsHref = await page.evaluate((idx) => {
  const allRows = Array.from(document.querySelectorAll('tr'));
  const dataRows = allRows.filter(r => r.hasAttribute('data-title'));
  const nginxRow = dataRows[idx];
  // The sub-row is the next sibling tr after the NGINX row in the full table
  let sibling = nginxRow.nextElementSibling;
  while (sibling) {
    const link = sibling.querySelector('a[data-source-type="official-docs"]');
    if (link) return link.href;
    if (sibling.hasAttribute('data-title')) break; // hit the next package row
    sibling = sibling.nextElementSibling;
  }
  return null;
}, nginxRowIndex);

if (!docsHref) {
  console.error('FAIL: official docs link not found in the NGINX sub-row');
  await browser.close();
  process.exit(1);
}

const response = await page.goto(docsHref);
const status = response.status();

if (status === 200) {
  console.log(`PASS: docs link ${docsHref} returned HTTP ${status}`);
  await browser.close();
  process.exit(0);
} else {
  console.error(`FAIL: docs link ${docsHref} returned HTTP ${status}`);
  await browser.close();
  process.exit(1);
}
