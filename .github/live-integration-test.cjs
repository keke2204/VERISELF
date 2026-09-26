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

    await page.waitForFunction(() => typeof window.fetch === 'function');

    const health = await page.evaluate(async api => {
      const r = await fetch(api + '/api/v1/health', { cache: 'no-store' });
      return { status: r.status, body: await r.json() };
    }, API);

    if (health.status !== 200 || health.body.status !== 'healthy') {
      throw new Error('Browser health check failed: ' + JSON.stringify(health));
    }

    const result = await page.evaluate(async ({ api, bytes }) => {
      const binary = Uint8Array.from(atob(bytes), c => c.charCodeAt(0));
      const file = new File([binary], 'browser-test.png', { type: 'image/png' });
      const form = new FormData();
      form.append('file', file);
      const register = await fetch(api + '/api/v1/media/register', {
        method: 'POST',
        body: form
      });
      const registerBody = await register.json();
      if (!register.ok) return { stage: 'register', status: register.status, body: registerBody };

      const compareForm = new FormData();
      compareForm.append('source_id', String(registerBody.id));
      compareForm.append('candidate', file);
      const compare = await fetch(api + '/api/v1/media/compare', {
        method: 'POST',
        body: compareForm
      });
      return {
        stage: 'compare',
        status: compare.status,
        body: await compare.json()
      };
    }, { api: API, bytes: png1x1.toString('base64') });

    if (result.status !== 200 || result.body.result !== 'CLOSE PERCEPTUAL MATCH') {
      throw new Error('Browser POST integration failed: ' + JSON.stringify(result));
    }

    const panelState = await page.locator('#apiStatus').textContent();
    console.log('LIVE INTEGRATION PASSED');
    console.log('Backend health:', JSON.stringify(health.body));
    console.log('Browser POST comparison:', JSON.stringify(result.body));
    console.log('Frontend status:', panelState);
    if (errors.length) console.log('Non-fatal browser console errors:', errors);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
