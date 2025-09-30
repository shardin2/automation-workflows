/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.srv1002253.hstgr.cloud';
const EMAIL = process.env.N8N_EMAIL;
const PASSWORD = process.env.N8N_PASSWORD;
const WORKFLOW_ID = process.env.N8N_WORKFLOW_ID || 'REqxDUqLU22TgzCi';
const HEADFUL = String(process.env.HEADFUL || '0') === '1' || String(process.env.HEADFUL || '').toLowerCase() === 'true';

const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
const AUTH_DIR = path.resolve(__dirname, '../.auth');
const STORAGE_STATE = path.join(AUTH_DIR, 'state.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function waitForUrlIncludes(page, substrings, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const url = page.url();
    if (substrings.some((s) => url.includes(s))) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function loginIfNeeded(page, context) {
  // If storage state exists, assume logged in
  if (fs.existsSync(STORAGE_STATE)) {
    return true;
  }

  // If credentials are provided, try automated login
  if (EMAIL && PASSWORD) {
    console.log('Logging into n8n UI (automated credentials)...');
    try {
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'domcontentloaded' });
    } catch {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    }

    // Find and fill email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[aria-label*="email" i]'
    ];
    let emailFilled = false;
    for (const sel of emailSelectors) {
      const loc = page.locator(sel);
      if (await loc.count()) {
        try {
          await loc.first().fill(EMAIL, { timeout: 3000 });
          emailFilled = true;
          break;
        } catch {}
      }
    }

    // Find and fill password
    const pwLoc = page.locator('input[type="password"]');
    if (!emailFilled || !(await pwLoc.count())) {
      // Maybe the app is already logged-in
      if (await waitForUrlIncludes(page, ['/workflow', '/workflows', '/canvas', '/settings'], 3000)) {
        console.log('It looks like we are already logged in.');
      } else {
        throw new Error('Could not find login form with provided credentials. If you use SSO/2FA, switch to manual login.');
      }
    } else {
      await pwLoc.first().fill(PASSWORD, { timeout: 5000 });
      // Submit
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'button:has-text("Sign In")',
        'button:has-text("Log In")'
      ];
      let submitted = false;
      for (const sel of submitSelectors) {
        const btn = page.locator(sel);
        if (await btn.count()) {
          await btn.first().click();
          submitted = true;
          break;
        }
      }
      if (!submitted) {
        // Try pressing Enter in password field
        await pwLoc.first().press('Enter');
      }
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }

    // Consider login successful if we reach any app page
    const okAuto = await waitForUrlIncludes(page, ['/workflow', '/workflows', '/settings', '/canvas'], 15000);
    if (!okAuto) {
      console.warn('Automated login did not reach an app page; continuing anyway.');
    }

    // Save storage state for reuse
    ensureDir(AUTH_DIR);
    await context.storageState({ path: STORAGE_STATE });
    console.log('Saved session to .auth/state.json');
    return true;
  }

  // Manual login fallback (no credentials provided)
  console.log('No N8N_EMAIL/N8N_PASSWORD provided. Opening login page for manual sign-in...');
  try {
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  }

  console.log('Please complete login in the opened browser window. Waiting up to 3 minutes...');
  const okManual = await waitForUrlIncludes(page, ['/workflow', '/workflows', '/canvas', '/settings'], 180000);
  if (!okManual) {
    throw new Error('Timed out waiting for manual login. Please try again with credentials or ensure UI is accessible.');
  }

  ensureDir(AUTH_DIR);
  await context.storageState({ path: STORAGE_STATE });
  console.log('Saved session to .auth/state.json');
  return true;
}

async function navigateToWorkflow(page) {
  const target = `${BASE_URL}/workflow/${WORKFLOW_ID}`;
  console.log('Opening workflow:', target);
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 });
}

async function activateIfInactive(page) {
  // Try to locate an "Active" switch and turn it on if off
  try {
    const switches = page.getByRole ? page.getByRole('switch') : page.locator('[role="switch"]');
    const count = await switches.count();
    for (let i = 0; i < count; i++) {
      const sw = switches.nth(i);
      const name = (await sw.getAttribute('aria-label')) || '';
      const isActiveSwitch = /active/i.test(name || '');
      const ariaChecked = await sw.getAttribute('aria-checked');
      if (isActiveSwitch && ariaChecked === 'false') {
        console.log('Workflow appears inactive. Activating...');
        await sw.click();
        await page.waitForTimeout(1000);
        return { changed: true };
      }
    }
  } catch (e) {
    console.warn('Could not evaluate/activate switch:', e.message);
  }
  return { changed: false };
}

async function openExecutionsAndCapture(page) {
  try {
    const execTab = page.getByRole ? page.getByRole('tab', { name: /executions/i }) : page.locator('role=tab[name="Executions"i]');
    if (await execTab.count()) {
      await execTab.first().click();
    } else {
      // Fallback: click by text
      const byText = page.locator('text=Executions');
      if (await byText.count()) await byText.first().click();
    }
  } catch {
    // ignore
  }

  await page.waitForTimeout(1500);

  // Try to read rows
  let summary = 'No executions found or list not visible';
  try {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const max = Math.min(5, rowCount);
      const items = [];
      for (let i = 0; i < max; i++) {
        const rowText = await rows.nth(i).innerText();
        items.push(rowText.replace(/\s+/g, ' ').trim());
      }
      summary = `Found ${rowCount} executions. Top ${max}:\n- ` + items.join('\n- ');
    }
  } catch {
    // ignore
  }

  ensureDir(ARTIFACTS_DIR);
  const screenshotPath = path.join(ARTIFACTS_DIR, `workflow-${WORKFLOW_ID}-executions.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return { screenshotPath, summary };
}

async function debugInEditorAndDump(page) {
  // Click "Debug in editor" if present
  const candidates = [
    'button:has-text("Debug in editor")',
    'text=Debug in editor',
  ];
  for (const sel of candidates) {
    try {
      const loc = page.locator ? page.locator(sel) : null;
      if (loc && await loc.count()) {
        await loc.first().click();
        break;
      } else {
        // Try DOM search via evaluate
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(b => /debug in editor/i.test(b.textContent || ''));
          if (btn) btn.click();
        });
        break;
      }
    } catch {}
  }

  // Wait for editor to load
  await page.waitForTimeout(5000);

  // Dump page text and html for offline inspection
  const innerText = await page.evaluate(() => document.body.innerText);
  const html = await page.content();
  ensureDir(ARTIFACTS_DIR);
  const textPath = path.join(ARTIFACTS_DIR, `workflow-${WORKFLOW_ID}-debug-innerText.txt`);
  const htmlPath = path.join(ARTIFACTS_DIR, `workflow-${WORKFLOW_ID}-debug.html`);
  fs.writeFileSync(textPath, innerText || '');
  fs.writeFileSync(htmlPath, html || '');
  const screenshotPath = path.join(ARTIFACTS_DIR, `workflow-${WORKFLOW_ID}-debug.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Try to extract a concise error line
  let firstErrorLine = '';
  try {
    const match = (innerText || '').match(/(Error|ERROR|Failed|Unauthorized|Forbidden|Not found|invalid)[^\n]{0,300}/);
    if (match) firstErrorLine = match[0];
  } catch {}

  return { textPath, htmlPath, screenshotPath, firstErrorLine };
}

async function clickNodeByLabel(page, label) {
  // Try Playwright text locator first
  try {
    const nodeByText = page.locator(`text=${label}`);
    if (await nodeByText.count()) {
      await nodeByText.first().click();
      await page.waitForTimeout(500);
      return true;
    }
  } catch {}

  // Fallback: query DOM for elements containing label and click
  try {
    const clicked = await page.evaluate((lbl) => {
      const candidates = Array.from(document.querySelectorAll('*')).filter(el => (el.textContent || '').trim().includes(lbl));
      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 40 && rect.height > 12) {
          (el).click();
          return true;
        }
      }
      return false;
    }, label);
    if (clicked) {
      await page.waitForTimeout(500);
      return true;
    }
  } catch {}
  return false;
}

(async () => {
  ensureDir(ARTIFACTS_DIR);
  ensureDir(AUTH_DIR);

  console.log('Launching browser (headless:', !HEADFUL, ')');
  const browser = await chromium.launch({ headless: !HEADFUL });
  const context = await browser.newContext(fs.existsSync(STORAGE_STATE) ? { storageState: STORAGE_STATE } : {});
  const page = await context.newPage();

  try {
    await loginIfNeeded(page, context);
    await navigateToWorkflow(page);

    const activation = await activateIfInactive(page);
    const { screenshotPath, summary } = await openExecutionsAndCapture(page);

    console.log('Executions summary:\n' + summary);
    console.log('Saved screenshot:', screenshotPath);

    const debugArtifacts = await debugInEditorAndDump(page);
    console.log('Debug artifacts saved:', debugArtifacts);

    // Focus the likely failing node and dump its side panel
    const clicked = await clickNodeByLabel(page, 'Create database page');
    if (clicked) {
      const nodePanelText = await page.evaluate(() => document.body.innerText);
      const nodeTextPath = path.join(ARTIFACTS_DIR, `workflow-${WORKFLOW_ID}-node-CreateDatabasePage.txt`);
      fs.writeFileSync(nodeTextPath, nodePanelText || '');
      console.log('Saved node panel text to:', nodeTextPath);
    } else {
      console.log('Could not click the "Create database page" node automatically.');
    }

    if (activation.changed) {
      console.log('Applied fix: Activated the workflow.');
    } else {
      console.log('Workflow was already active or activation control not found.');
    }

    if (debugArtifacts.firstErrorLine) {
      console.log('First detected error line:', debugArtifacts.firstErrorLine);
    }

    console.log('Done. If executions show specific errors (e.g., missing credentials), let me know and I will extend the script to apply a targeted fix.');
  } catch (err) {
    console.error('Playwright fix failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
