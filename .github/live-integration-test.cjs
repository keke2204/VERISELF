const { chromium } = require('playwright');

const SITE = 'https://keke2204.github.io/VERISELF/';
const API = 'https://veriself.onrender.com';

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  try {
    const response = await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    if (!response || !response.ok()) throw new Error('GitHub Pages returned an invalid response.');

    await page.locator('#apiStatus').waitFor({ state: 'visible', timeout: 15000 });

    // Test the actual visible Protect Photo picker, not only the hidden file input.
    const picker = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.locator('#uploadDropzone').click();
    await picker;

    // Test the actual frontend source-upload control.
    await page.locator('#uploadInput').setInputFiles({
      name: 'browser-source.png',
      mimeType: 'image/png',
      buffer: png1x1
    });

    await page.waitForFunction(
      () => /SOURCE REGISTERED|REGISTERING SOURCE|ONLINE|ERROR|OFFLINE|TIMEOUT/.test(
        document.querySelector('#apiStatus')?.textContent || ''
      ),
      null,
      { timeout: 65000 }
    );

    await page.waitForFunction(
      () => !!document.querySelector('#apiMediaId')?.textContent.trim() &&
            document.querySelector('#apiMediaId')?.textContent.trim() !== '—',
      null,
      { timeout: 65000 }
    );

    const mediaId = await page.locator('#apiMediaId').textContent();
    if (!mediaId.trim() || mediaId.trim() === '—') {
      throw new Error('Frontend source upload did not produce a backend media ID.');
    }

    // Test the actual frontend candidate-upload control.
    await page.locator('#candidateInput').setInputFiles({
      name: 'browser-candidate.png',
      mimeType: 'image/png',
      buffer: png1x1
    });

    await page.waitForFunction(
      () => document.querySelector('#advVerdict')?.textContent?.includes('CLOSE PERCEPTUAL MATCH'),
      null,
      { timeout: 65000 }
    );

    const verdict = await page.locator('#advVerdict').textContent();
    const distance = await page.locator('#advDistance').textContent();
    const similarity = await page.locator('#advSimilarity').textContent();
    const status = await page.locator('#apiStatus').textContent();

    if (!verdict.includes('CLOSE PERCEPTUAL MATCH')) {
      throw new Error('Frontend candidate comparison did not display the backend result.');
    }

    console.log('REAL FRONTEND -> BACKEND FLOW PASSED');
    console.log('Media ID:', mediaId.trim());
    console.log('Distance:', distance);
    console.log('Similarity:', similarity);
    console.log('Verdict:', verdict);
    console.log('API status:', status);
    if (errors.length) console.log('Browser console errors:', errors);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('REAL FRONTEND -> BACKEND FLOW FAILED');
  console.error(err);
  process.exit(1);
});
