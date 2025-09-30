/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const HEADFUL = String(process.env.HEADFUL || '1') === '1' || String(process.env.HEADFUL || '').toLowerCase() === 'true';
const HOSTINGER_LOGIN_URL = process.env.HOSTINGER_LOGIN_URL || 'https://hpanel.hostinger.com/';

const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function waitForSomeText(page, regex, timeout = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const txt = await page.evaluate(() => document.body.innerText);
    if (regex.test(txt || '')) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function clickByText(page, re, opts = {}) {
  // Try role-based first
  try {
    const btn = page.locator(`:text-matches("${re.source}", "i")`);
    if (await btn.count()) { await btn.first().click(opts); return true; }
  } catch {}
  // Fallback to evaluate query
  try {
    const clicked = await page.evaluate((pattern) => {
      const re = new RegExp(pattern, 'i');
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const t = (el.textContent || '').trim();
        if (t && re.test(t)) { el.click(); return true; }
      }
      return false;
    }, re.source);
    if (clicked) return true;
  } catch {}
  return false;
}

async function focusTerminal(page) {
  // Click common terminal containers
  const selectors = [
    '.xterm-helper-textarea',
    '.xterm-screen',
    '.xterm-rows',
    'canvas',
    'div[role="textbox"] textarea',
  ];
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel);
      if (await loc.count()) {
        await loc.first().click({ force: true });
        await page.waitForTimeout(300);
        return true;
      }
    } catch {}
  }
  return false;
}

async function typeCommand(page, command, waitMs = 2000) {
  await page.keyboard.type(command, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(waitMs);
}

(async () => {
  ensureDir(ARTIFACTS_DIR);
  console.log('Launching browser (headless:', !HEADFUL, ')');
  const browser = await chromium.launch({ headless: !HEADFUL });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Opening Hostinger hPanel login:', HOSTINGER_LOGIN_URL);
    await page.goto(HOSTINGER_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Please log in to Hostinger in the opened window. I will wait up to 3 minutes...');
    const loggedIn = await waitForSomeText(page, /(VPS|Dashboard|Search|Home)/i, 180000);
    if (!loggedIn) throw new Error('Timed out waiting for Hostinger login.');

    // Try to navigate to VPS list
    console.log('Looking for VPS section...');
    await clickByText(page, /VPS/i);
    await page.waitForTimeout(2000);

    // Click first Manage button
    console.log('Looking for Manage button...');
    await clickByText(page, /Manage/i);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Open Browser Terminal / Terminal / Console
    console.log('Opening Browser Terminal...');
    await clickByText(page, /(Browser\s*Terminal|Terminal|Console|SSH)/i);
    await page.waitForTimeout(5000);

    // Focus terminal
    if (!(await focusTerminal(page))) {
      console.warn('Could not auto-focus terminal. Click into the terminal window, then press Enter.');
      await page.waitForTimeout(5000);
    }

    // Run update sequence
    console.log('Running Docker Compose update commands...');
    const cmds = [
      'set -e',
      'echo "$(whoami) on $(hostname)"',
      // Try common paths; if not found, you can adjust manually
      'cd /root/n8n 2>/dev/null || cd /opt/n8n 2>/dev/null || cd /srv/n8n 2>/dev/null || cd /var/lib/n8n 2>/dev/null || pwd',
      'pwd',
      'ls -la',
      // If no compose here, try to locate it
      'test -f docker-compose.yml || test -f compose.yaml || find $HOME -maxdepth 3 -type f \( -name docker-compose.yml -o -name compose.yaml \) | head -n 1',
      'if [ -f docker-compose.yml ] || [ -f compose.yaml ]; then echo "Compose file present"; else echo "No compose file in CWD"; fi',
      'docker compose pull',
      'docker compose down',
      'docker compose up -d',
      'docker compose ps',
    ];

    for (const cmd of cmds) {
      console.log('> ' + cmd);
      await typeCommand(page, cmd, 2500);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `hostinger-term-${Date.now()}.png`), fullPage: true });
    }

    console.log('Update commands sent. Please watch the terminal for errors. When services are up, open your n8n and verify the "versions behind" banner is gone.');
  } catch (err) {
    console.error('Hostinger update automation failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Keep the browser open if headful so you can observe; close only in headless mode
    if (!HEADFUL) await browser.close();
  }
})();