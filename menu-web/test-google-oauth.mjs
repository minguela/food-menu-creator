// test-google-oauth.mjs — Playwright test
import { chromium } from 'playwright';

const SITE = 'https://renovaciones.dminguela.es';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Loading page...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 15000 });
  const title = await page.title();
  console.log(`   Title: "${title}"`);

  // Check if Google button exists
  const googleBtn = page.locator('text=Continuar con Google');
  const btnCount = await googleBtn.count();
  console.log(`2. Google button found: ${btnCount > 0 ? 'YES' : 'NO'} (${btnCount} elements)`);

  if (btnCount > 0) {
    // Click the button and capture navigation
    console.log('3. Clicking Google button...');
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      googleBtn.first().click(),
    ]);

    // Check current URL for Google redirect
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`4. Redirected to: ${currentUrl.substring(0, 80)}...`);

    if (currentUrl.includes('accounts.google.com')) {
      console.log('   ✅ Correctly redirected to Google OAuth');
    } else if (currentUrl.includes('error=')) {
      console.log(`   ❌ Error in URL: ${currentUrl}`);
    } else {
      console.log('   ⚠️ Unexpected URL (might have already been authenticated)');
    }
  }

  // Check for auth token in localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  console.log(`5. Auth token in storage: ${token ? 'YES (already logged in)' : 'NO'}`);

  // Screenshot
  await page.screenshot({ path: '/tmp/google-oauth-test.png' });
  console.log('6. Screenshot saved to /tmp/google-oauth-test.png');

  await browser.close();
  console.log('\nDone.');
})();
