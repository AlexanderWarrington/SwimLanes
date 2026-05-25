/**
 * browser-check.js — Playwright diagnostic runner for Swimlane_App.html
 *
 * Usage:
 *   node tools/browser-check.js [path/to/file.html]
 *
 * Defaults to Swimlane_App.html in the project root.
 *
 * Output:
 *   - All page-level JS errors (syntax + runtime)
 *   - All console.error / console.warn output
 *   - Key DOM state (journal-container populated?, day-blocks?, header?)
 *   - Screenshot saved to tools/screenshot.png
 *
 * Playwright is discovered from the npx cache — no install needed.
 * If it cannot be found, run: npx playwright install chromium
 */

const path = require('path');
const fs   = require('fs');

// --- Locate the playwright module from the npx cache -------------------
function findPlaywright() {
    const cacheRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    if (!fs.existsSync(cacheRoot)) return null;

    const entries = fs.readdirSync(cacheRoot);
    for (const entry of entries) {
        const candidate = path.join(cacheRoot, entry, 'node_modules', 'playwright');
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

const playwrightPath = findPlaywright();
if (!playwrightPath) {
    console.error('ERROR: playwright not found in npx cache.');
    console.error('Run:  npx playwright install chromium');
    process.exit(1);
}

const { chromium } = require(playwrightPath);

// --- Resolve target file ------------------------------------------------
const targetFile = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '..', 'Swimlane_App.html');

if (!fs.existsSync(targetFile)) {
    console.error('ERROR: file not found:', targetFile);
    process.exit(1);
}

const fileUrl = 'file:///' + targetFile.replace(/\\/g, '/');

// --- Run ---------------------------------------------------------------
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page    = await browser.newPage();

    const pageErrors   = [];
    const consoleMsgs  = [];

    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console',   msg => {
        if (['error', 'warn'].includes(msg.type())) {
            consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
        }
    });

    await page.goto(fileUrl);
    await page.waitForTimeout(3000);

    const screenshotPath = path.join(__dirname, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // DOM checks
    const dom = await page.evaluate(() => ({
        containerLength: (document.getElementById('journal-container') || {}).innerHTML?.length ?? -1,
        dayBlockCount:   document.querySelectorAll('.day-block').length,
        hasHeader:       !!document.querySelector('.header-row'),
        appInitError:    window.__appInitError || null,
    }));

    await browser.close();

    // --- Report ---
    const hr = '-'.repeat(60);

    console.log(hr);
    console.log('FILE:', targetFile);
    console.log(hr);

    console.log('\n[PAGE ERRORS]');
    pageErrors.length ? pageErrors.forEach(e => console.log('  ✖', e)) : console.log('  (none)');

    console.log('\n[CONSOLE ERRORS / WARNINGS]');
    consoleMsgs.length ? consoleMsgs.forEach(m => console.log(' ', m)) : console.log('  (none)');

    console.log('\n[DOM STATE]');
    console.log('  journal-container length:', dom.containerLength);
    console.log('  .day-block count:        ', dom.dayBlockCount);
    console.log('  .header-row present:     ', dom.hasHeader);

    const ok = pageErrors.length === 0 && dom.dayBlockCount > 0;
    console.log('\n' + hr);
    console.log(ok ? '✔  PASS — app loaded with no JS errors' : '✖  FAIL — see errors above');
    console.log('Screenshot:', screenshotPath);
    console.log(hr);

    process.exit(ok ? 0 : 1);
})();
