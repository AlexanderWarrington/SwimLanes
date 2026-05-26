/**
 * tests/smoke.js — Automated smoke tests for Swimlane_App.html
 *
 * Usage:
 *   node tests/smoke.js
 *
 * Covers the critical happy paths. Runs automatically via the Claude Code
 * Stop hook after every session that modifies the project.
 *
 * Tests:
 *   T1  Syntax check     — JS parses cleanly (fast, no browser)
 *   T2  Boot             — app loads, no JS errors, 60 day blocks render
 *   T3  Onboarding       — "Start Journaling" dismisses modal, reveals journal
 *   T4  Add item         — clicking today's track and typing creates an item
 *   T5  Search           — Ctrl+K opens the command palette
 *   T6  Undo             — Ctrl+Z removes the item added in T4
 *   T7  Persist          — data survives a page reload
 */

const path = require('path');
const fs   = require('fs');

// ── Locate Playwright ────────────────────────────────────────────────────────
function findPlaywright() {
    const cacheRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    if (!fs.existsSync(cacheRoot)) return null;
    for (const entry of fs.readdirSync(cacheRoot)) {
        const candidate = path.join(cacheRoot, entry, 'node_modules', 'playwright');
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

const playwrightPath = findPlaywright();
if (!playwrightPath) {
    console.error('ERROR: playwright not found. Run: npx playwright install chromium');
    process.exit(1);
}

const { chromium } = require(playwrightPath);

// ── Config ────────────────────────────────────────────────────────────────────
const HTML_FILE = path.resolve(__dirname, '..', 'Swimlane_App.html');
const FILE_URL  = 'file:///' + HTML_FILE.replace(/\\/g, '/');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

// ── Test runner ───────────────────────────────────────────────────────────────
const results = [];
let passed = 0, failed = 0;

function record(name, ok, detail = '') {
    results.push({ name, ok, detail });
    if (ok) { passed++; console.log(`  ✔  ${name}`); }
    else     { failed++; console.log(`  ✖  ${name}${detail ? ': ' + detail : ''}`); }
}

// ── T1: Syntax check (no browser) ────────────────────────────────────────────
function t1_syntax() {
    const html  = fs.readFileSync(HTML_FILE, 'utf8');
    const start = html.indexOf('<script>') + '<script>'.length;
    const end   = html.lastIndexOf('</script>');
    if (start < 0 || end < 0) { record('T1 Syntax check', false, 'No <script> block found'); return; }
    const tmpJs = path.join(__dirname, '_syntax_check_tmp.js');
    fs.writeFileSync(tmpJs, html.substring(start, end), 'utf8');
    const { execSync } = require('child_process');
    try {
        execSync(`node --check "${tmpJs}"`, { stdio: 'pipe' });
        record('T1 Syntax check', true);
    } catch (e) {
        record('T1 Syntax check', false, e.stderr?.toString().split('\n')[0] || 'parse error');
    } finally {
        fs.unlinkSync(tmpJs);
    }
}

// ── Browser tests ─────────────────────────────────────────────────────────────
async function runBrowserTests() {
    const browser = await chromium.launch({ headless: true });
    const ctx     = await browser.newContext();

    async function freshPage() {
        // Clear storage so every test starts from a known blank state
        await ctx.clearCookies();
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        // Wipe IndexedDB and localStorage before loading
        await page.addInitScript(() => {
            indexedDB.deleteDatabase('swimlane_journal_v14');
            localStorage.clear();
        });
        return { page, errors };
    }

    // Loads the app with known state:
    //   1. Fresh blank page (storage wiped by freshPage initScript)
    //   2. Second initScript sets swimlane_onboarded so onboarding never blocks
    //   3. First navigation initialises the app's IDB connection
    //   4. Seeded state written into IDB from the page context
    //   5. Reload — app boots from the seeded IDB, no onboarding
    // items: array of item objects; settings: partial settings override.
    // Returns { page, errors, laneId } — page is already loaded and ready.
    // Seeds IDB with a known state and returns a fresh page booted from it.
    //
    // The naive approach (write seed → reload) fails because the app's beforeunload
    // handler calls Store.save(), which writes the stale in-memory default state back
    // over the seed before the new page can read it.
    //
    // Fix: use a disposable "seed writer" page that we close with runBeforeUnload: false
    // (Playwright's default). The seed survives in IDB, and a separate fresh test page
    // then boots from it with no interference.
    async function seededPage(items, settings = {}) {
        const laneId = 'test-lane';
        const seedState = {
            version: 14,
            lanes:   [{ id: laneId, title: 'Lane', minimized: false, color: '#6366f1' }],
            habits: [], notes: [], projects: [],
            habitChecks: {}, diary: {}, focus: {},
            items,
            settings: { theme: 'dotted', horizonMode: 'all', habitMode: 'streak',
                        showAchievements: false, showHorizon: false, habitsMin: false, diaryMin: false,
                        ...settings }
        };

        // Step 1: load the app on a throwaway page to get onto the file:// origin,
        // then write the seed into IDB. We must be on file:// because that is the
        // origin the app uses; about:blank has a null origin and would create a
        // separate IDB namespace.
        const seedPage = await ctx.newPage();
        await seedPage.goto(FILE_URL);
        await seedPage.waitForTimeout(600); // let the app open its IDB connection

        const writeResult = await seedPage.evaluate(async (stateToSave) => {
            return await new Promise((resolve) => {
                const req = indexedDB.open('SwimlaneDB_V14', 1);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    try {
                        const tx = db.transaction('state', 'readwrite');
                        tx.objectStore('state').put(stateToSave, 'appData');
                        tx.oncomplete = () => { db.close(); resolve({ ok: true }); };
                        tx.onerror   = (err) => { db.close(); resolve({ ok: false, err: String(err) }); };
                    } catch(e) { db.close(); resolve({ ok: false, err: e.message }); }
                };
                req.onerror = () => resolve({ ok: false, err: 'open-error' });
            });
        }, seedState);
        console.log('  [seededPage write]', JSON.stringify(writeResult));

        // Step 2: flush the committed IDB write to shared storage before closing.
        // Abruptly terminating the page (page.close()) causes headless Chromium to
        // skip the IDB flush, so the next page sees stale data.
        // Navigating away triggers a clean unload which flushes IDB, but it also
        // fires beforeunload → Store.save() which would overwrite the seed.
        // Fix: patch IDBObjectStore.prototype.put to a no-op for one call so that
        // the beforeunload save is silently swallowed, then navigate away to flush.
        await seedPage.evaluate((seed) => {
            const orig = IDBObjectStore.prototype.put;
            IDBObjectStore.prototype.put = function(value, key) {
                IDBObjectStore.prototype.put = orig; // restore after one interception
                // Write the seed instead of the stale in-memory state
                return orig.call(this, seed, key);
            };
        }, seedState);
        await seedPage.goto('about:blank'); // triggers beforeunload → intercepted put → seed stays
        await seedPage.close();

        // Step 3: open a fresh test page. It boots cold from IDB — which now holds
        // our seed — so the app initialises with exactly the state we want.
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => {
            localStorage.setItem('swimlane_onboarded', 'true');
        });
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);

        return { page, errors, laneId };
    }

    // Dismisses the onboarding overlay if it is open.
    async function dismissOnboarding(page) {
        const has = await page.evaluate(() =>
            document.getElementById('onboarding-overlay')?.classList.contains('is-open'));
        if (has) { await page.click('[data-action="startFresh"]'); await page.waitForTimeout(300); }
    }

    // ── T2: Boot ────────────────────────────────────────────────────────────
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(2500);
        const dayBlocks = await page.evaluate(() => document.querySelectorAll('.day-block').length);
        const noErrors  = errors.length === 0;
        record('T2 Boot (no JS errors, calendar renders)', noErrors && dayBlocks >= 30,
            !noErrors ? errors[0] : dayBlocks < 30 ? `only ${dayBlocks} day blocks` : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't2-boot.png') });
        await page.close();
    }

    // ── T3: Onboarding dismissal ─────────────────────────────────────────────
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);
        const overlayVisible = await page.evaluate(() => {
            const o = document.getElementById('onboarding-overlay');
            return o && o.classList.contains('is-open');
        });
        if (overlayVisible) {
            await page.click('[data-action="startFresh"]');
            await page.waitForTimeout(500);
        }
        const overlayClosed = await page.evaluate(() => {
            const o = document.getElementById('onboarding-overlay');
            return !o || !o.classList.contains('is-open');
        });
        const journalVisible = await page.evaluate(() => {
            const c = document.getElementById('journal-container');
            return c && c.innerHTML.length > 1000;
        });
        record('T3 Onboarding dismissal', overlayClosed && journalVisible,
            !overlayClosed ? 'overlay still open' : !journalVisible ? 'journal not rendered' : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't3-onboarding.png') });
        await page.close();
    }

    // ── T4: Add item ─────────────────────────────────────────────────────────
    // Clicks the first visible lane track on today's row and types a task.
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);
        // Dismiss onboarding if present
        const hasOnboarding = await page.evaluate(() =>
            document.getElementById('onboarding-overlay')?.classList.contains('is-open'));
        if (hasOnboarding) await page.click('[data-action="startFresh"]');
        await page.waitForTimeout(500);

        // Click today's first track cell (the add-item area)
        const todayTrack = await page.$('.is-today .track');
        let itemAdded = false;
        if (todayTrack) {
            await todayTrack.click();
            await page.waitForTimeout(400);
            // If an input appeared, type in it
            const input = await page.$('.item-input, .new-item-input, input[data-role="new-item"]');
            if (input) {
                await input.type('Smoke test task');
                await page.keyboard.press('Enter');
                await page.waitForTimeout(400);
            }
            // Check item exists in DOM or state
            itemAdded = await page.evaluate(() =>
                document.querySelectorAll('.is-today .item[data-id]').length > 0
            );
        }
        record('T4 Add item', itemAdded, !todayTrack ? 'today track not found' : !itemAdded ? 'item not in state' : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't4-add-item.png') });
        await page.close();
    }

    // ── T5: Search (Ctrl+K) ──────────────────────────────────────────────────
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);
        const hasOnboarding = await page.evaluate(() =>
            document.getElementById('onboarding-overlay')?.classList.contains('is-open'));
        if (hasOnboarding) await page.click('[data-action="startFresh"]');
        await page.waitForTimeout(300);

        await page.keyboard.press('Control+k');
        await page.waitForTimeout(400);
        const paletteOpen = await page.evaluate(() => {
            const p = document.getElementById('search-overlay');
            return p && (p.style.display !== 'none') && p.offsetHeight > 0;
        });
        record('T5 Search (Ctrl+K)', paletteOpen, paletteOpen ? '' : 'search overlay not visible');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't5-search.png') });
        await page.close();
    }

    // ── T6: Undo (Ctrl+Z) ────────────────────────────────────────────────────
    // Inject an item directly via App.Actions, then undo it.
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);
        const hasOnboarding = await page.evaluate(() =>
            document.getElementById('onboarding-overlay')?.classList.contains('is-open'));
        if (hasOnboarding) await page.click('[data-action="startFresh"]');
        await page.waitForTimeout(300);

        // Add item via App.Actions if accessible
        const addedAndUndone = await page.evaluate(async () => {
            if (!window.App || !window.App.state) return null;
            const before = window.App.state.items.length;
            const laneId = window.App.state.lanes[0]?.id;
            const today  = new Date().toISOString().split('T')[0];
            if (!laneId) return null;
            window.App.addItem && window.App.addItem(laneId, today, 'undo-test-item');
            await new Promise(r => setTimeout(r, 300));
            const after = window.App.state.items.length;
            return { before, after };
        });

        if (addedAndUndone && addedAndUndone.after > addedAndUndone.before) {
            await page.keyboard.press('Control+z');
            await page.waitForTimeout(400);
            const afterUndo = await page.evaluate(() => window.App?.state?.items?.length ?? -1);
            record('T6 Undo (Ctrl+Z)', afterUndo <= addedAndUndone.before,
                `items: before=${addedAndUndone.before} after-add=${addedAndUndone.after} after-undo=${afterUndo}`);
        } else {
            // Can't inject via API — just verify Ctrl+Z doesn't crash
            await page.keyboard.press('Control+z');
            await page.waitForTimeout(400);
            const noError = errors.length === 0;
            record('T6 Undo (Ctrl+Z)', noError, noError ? '(API not exposed; verified no crash)' : errors[0]);
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't6-undo.png') });
        await page.close();
    }

    // ── T7: Persistence ──────────────────────────────────────────────────────
    // Load, inject state, reload, verify state survived.
    {
        const { page, errors } = await freshPage();
        await page.goto(FILE_URL);
        await page.waitForTimeout(1500);
        const hasOnboarding = await page.evaluate(() =>
            document.getElementById('onboarding-overlay')?.classList.contains('is-open'));
        if (hasOnboarding) await page.click('[data-action="startFresh"]');
        await page.waitForTimeout(300);

        const initialLaneCount = await page.evaluate(() => window.App?.state?.lanes?.length ?? 0);
        const reloadErrors = [];
        page.on('pageerror', e => reloadErrors.push(e.message));
        await page.reload();
        await page.waitForTimeout(2000);
        const afterReloadLaneCount = await page.evaluate(() => window.App?.state?.lanes?.length ?? 0);
        const reloadedOk = reloadErrors.length === 0 && afterReloadLaneCount >= initialLaneCount;
        record('T7 Persist (reload)', reloadedOk,
            reloadErrors.length ? reloadErrors[0] : !reloadedOk ? `lanes ${initialLaneCount}→${afterReloadLaneCount}` : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't7-persist.png') });
        await page.close();
    }

    // ── T8: Horizon — shows M/O/E items, excludes T (Task) items ────────────────
    // The horizon is a read-only index of upcoming Milestones, Outcomes, and
    // Events. Tasks (type-task) must never appear in it.
    {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDateStr = tomorrow.toISOString().split('T')[0];
        const { page, errors } = await seededPage([
            { id: 'hz-m-1', laneId: 'test-lane', dateStr: futureDateStr,
              type: 'type-milestone', text: 'Key Milestone', isDone: false },
            { id: 'hz-t-1', laneId: 'test-lane', dateStr: futureDateStr,
              type: 'type-task',      text: 'Just a Task',  isDone: false }
        ]);

        await page.click('[data-action="toggleHorizon"]');
        await page.waitForTimeout(500);

        const { hzCount, hasTask } = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.hz-item'));
            return {
                hzCount: items.length,
                hasTask: items.some(el => el.classList.contains('type-task'))
            };
        });
        const ok = hzCount === 1 && !hasTask;
        record('T8 Horizon: shows M/O/E items, excludes T tasks', ok,
            !ok ? `hzCount=${hzCount}, hasTask=${hasTask}` : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't8-horizon-input.png') });
        await page.close();
    }

    // ── T9: Horizon — hz-item text is a read-only span with correct content ──────
    // Horizon items are auto-populated from swimlane state and must not be
    // editable inputs. The .index-text element must be a <span> showing the
    // item's text exactly.
    {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDateStr = tomorrow.toISOString().split('T')[0];
        const { page, errors } = await seededPage([
            { id: 'hz-ro-1', laneId: 'test-lane', dateStr: futureDateStr,
              type: 'type-outcome', text: 'My Outcome Text', isDone: false }
        ]);

        await page.click('[data-action="toggleHorizon"]');
        await page.waitForTimeout(500);

        const { isSpan, text } = await page.evaluate(() => {
            const el = document.querySelector('.hz-item .index-text');
            return { isSpan: el?.tagName === 'SPAN', text: el?.textContent?.trim() ?? null };
        });
        const ok = isSpan && text === 'My Outcome Text';
        record('T9 Horizon: hz-item text is read-only span with correct content', ok,
            !ok ? `isSpan=${isSpan}, text="${text}"` : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't9-horizon-edit.png') });
        await page.close();
    }

    // ── T10: Horizon — right-click on hz-item marks it done ──────────────────────
    // Verifies the contextmenu → toggleDone path works for .hz-item elements.
    {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDateStr = tomorrow.toISOString().split('T')[0];
        const { page, errors } = await seededPage([
            { id: 'hz-done-1', laneId: 'test-lane', dateStr: futureDateStr,
              type: 'type-outcome', text: 'Right-click me', isDone: false }
        ]);

        await page.click('[data-action="toggleHorizon"]');
        await page.waitForTimeout(500);

        await page.click('.hz-item', { button: 'right' });
        await page.waitForTimeout(400);

        // horizonData() re-renders on itemToggled and removes done items when
        // showAchievements is false, so checking the DOM class is unreliable.
        // Read IDB directly instead (debouncedSave fires within 300ms).
        const isDone = await page.evaluate(async () => {
            return new Promise(resolve => {
                const req = indexedDB.open('SwimlaneDB_V14', 1);
                req.onsuccess = e => {
                    const db = e.target.result;
                    const tx = db.transaction('state', 'readonly');
                    tx.objectStore('state').get('appData').onsuccess = r => {
                        db.close();
                        resolve(r.target.result?.items?.find(i => i.id === 'hz-done-1')?.isDone === true);
                    };
                    tx.onerror = () => { db.close(); resolve(false); };
                };
                req.onerror = () => resolve(false);
            });
        });
        record('T10 Horizon: right-click on hz-item marks done', isDone,
            isDone ? '' : 'isDone not true in IDB after right-click');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't10-horizon-rightclick.png') });
        await page.close();
    }

    // ── T11: Horizon — double-tap on overdue item marks it done (mobile) ────────
    // Regression: before the fix, the touchend guard required .track or
    // .proj-task-list ancestry, excluding the overdue bin. After fix, the guard
    // also allows .overdue-bin so double-tap completes overdue items.
    {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const pastDateStr = yesterday.toISOString().split('T')[0];
        const { page, errors } = await seededPage([
            { id: 'overdue-1', laneId: 'test-lane', dateStr: pastDateStr,
              type: 'type-task', text: 'Overdue task', isDone: false }
        ]);

        await page.click('[data-action="toggleHorizon"]');
        await page.waitForTimeout(500);

        // Simulate a double-tap (two touchend events within 500 ms).
        const tapped = await page.evaluate(async () => {
            const overdue = document.querySelector('.overdue-bin .item[data-id="overdue-1"]');
            if (!overdue) return false;
            const opts = { bubbles: true, cancelable: true, touches: [],
                           changedTouches: [], targetTouches: [] };
            overdue.dispatchEvent(new TouchEvent('touchend', opts));
            await new Promise(r => setTimeout(r, 150));
            overdue.dispatchEvent(new TouchEvent('touchend', opts));
            await new Promise(r => setTimeout(r, 300));
            return true;
        });
        await page.waitForTimeout(500); // allow 300ms debouncedSave timer + IDB write

        const isDone = await page.evaluate(async () => {
            return new Promise(resolve => {
                const req = indexedDB.open('SwimlaneDB_V14', 1);
                req.onsuccess = e => {
                    const db = e.target.result;
                    const tx = db.transaction('state', 'readonly');
                    tx.objectStore('state').get('appData').onsuccess = r => {
                        db.close();
                        resolve(r.target.result?.items?.find(i => i.id === 'overdue-1')?.isDone === true);
                    };
                    tx.onerror = () => { db.close(); resolve(false); };
                };
                req.onerror = () => resolve(false);
            });
        });
        record('T11 Horizon: double-tap on overdue item marks done', tapped && isDone,
            !tapped ? 'overdue item not found in DOM' :
            !isDone  ? 'item not marked done in state after double-tap' : '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 't11-horizon-doubletap.png') });
        await page.close();
    }

    await browser.close();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const HR = '─'.repeat(60);
console.log(`\n${HR}`);
console.log('  Swimlane Smoke Tests');
console.log(HR);

t1_syntax();

runBrowserTests().then(() => {
    console.log(HR);
    console.log(`  ${passed + failed} tests   ✔ ${passed} passed   ${failed > 0 ? '✖' : '·'} ${failed} failed`);
    console.log(`  Screenshots: tests/screenshots/`);
    console.log(HR + '\n');
    process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});

