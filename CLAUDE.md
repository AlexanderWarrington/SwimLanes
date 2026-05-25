# Swimlane Journal — Claude Notes

## What this project is

A single-file personal productivity journal delivered as `Swimlane_App.html`. No build step, no bundler, no server — open in any modern browser. All state is stored in IndexedDB (localStorage fallback).

## The one file that matters

| File | Purpose |
|------|---------|
| `Swimlane_App.html` | The entire app — HTML, CSS, and JS in one file |

`Swimlane App_V1.html` was the original version. It is no longer maintained.

## Architecture (read the header comment block in the script first)

All JavaScript lives inside a single IIFE `App`. Modules in execution order:

```
Config → Utils → State → UI State → DOM → EventBus → Undo → Store
→ debouncedSave → applySettings → Actions → Render → VirtualScroll
→ DragDrop → Search → Events → bootstrap()
```

**One-way data flow:**
`User gesture → Events (delegation) → Actions (mutates State) → EventBus.emit → Render (reads State, writes DOM)`

Render never writes State. Actions never write the DOM directly.

## Key modules

- **Config** — app-wide constants (item types, palette, DB name, maxRenderedDays)
- **Utils** — pure stateless helpers (uuid, parseDate, toLocalISO, getDiffDays, escape)
- **State** — the single JSON blob saved to IndexedDB on every change
- **EventBus** — pub/sub; decouples Actions from Render; cleared on every hardRebuild
- **Undo** — snapshot stack (max 20); snap() before destructive actions, perform() to roll back
- **Store** — IndexedDB primary + localStorage fallback; hydrate() handles legacy string-habit format
- **Actions** — ALL state mutations go here via `mutate(fn, event, payload)`
- **Render** — DOM-only reads of State; hardRebuild() for structure, trackContent() for cell patches
- **VirtualScroll** — IntersectionObserver keeps ~120 day-rows in DOM; seekToDate() for nav
- **DragDrop** — SortableJS per track; group `matrix` allows cross-lane/cross-day moves
- **Search** — Ctrl+K command palette; 200ms debounce; min 2 chars
- **Events** — single `document` listener with `data-action` routing

## Bug fixes applied (do not revert)

1. **Streak calculation** (`Render.habitStats`) — walks consecutive calendar days backward from today; previously iterated sparse keys and overcounted streaks across gaps.
2. **type-event item type** — `{ id: 'type-event', label: 'E' }` added to `Config.itemTypes`; CSS badge + italic text + countdown display added; included in Horizon filter and `updateDayToggles` countdown selector.
3. **`</script>` in JS comment (line 717)** — the HTML parser terminates a `<script>` tag on the literal bytes `</script>` regardless of JS comment context. The comment `// e.g. "<script>alert(1)</script>"` was closing the script tag early, causing all JS below it to render as page text. Fix: use `<\/script>` inside any `<script>` block comment.
4. **Broken escape function (line 719)** — `Utils.escape` had `'\\'` (string `\`) followed by an orphaned `'`, producing `Invalid or unexpected token`. Was masked by bug 3 because the script never reached line 719. Fix: map single quote with a double-quoted string `"&#39;"` to avoid quote-escaping entirely. Final correct form: `"'": "&#39;"`.

**HTML-in-script rules (hard-won):**
- Never write `</script>` literally inside a `<script>` block, even in comments. Use `<\/script>`.
- HTML entities (`&amp;`, `&lt;`, etc.) inside `<script>` tags are NOT decoded by the HTML parser — they remain as literal strings in JS. This is correct for `Utils.escape`.
- When mapping single-quote in a string object, use a double-quoted value (`"&#39;"`) to avoid backslash-escaping confusion.

## State shape (version 14)

```js
{
  version: 14,
  lanes:       [{ id, title, minimized, color }],
  habits:      [{ id, title }],
  items:       [{ id, laneId, dateStr, type, text, done, projectId? }],
  notes:       [{ id, laneId, title, body }],
  projects:    [{ id, laneId, title, tasks, ... }],
  habitChecks: { "YYYY-MM-DD": { habitId: bool } },
  diary:       { "YYYY-MM-DD": string },
  focus:       { "YYYY-MM-DD": string },
  settings:    { theme, horizonMode, habitMode, showAchievements, showHorizon, habitsMin, diaryMin }
}
```

## Working in this repo

- **Never edit `Swimlane App_V1.html`** — it is archived reference only.
- Branch from `main`, PR back to `main`. Prefix: `feat/`, `fix/`, `docs/`, `test/`, `chore/`. See README.md for the full convention.
- When adding a new item type: update `Config.itemTypes`, add CSS badge styles, add to Horizon filter condition, add to `updateDayToggles` countdown selector.
- When changing the state shape: bump `version` in `dbName`/`fallbackKey` suffix and update `hydrate()` to handle the migration.

## Verifying JS changes

After any edit to the `<script>` block, run:

```powershell
node tools/browser-check.js
```

This launches a headless Chromium via Playwright, captures page errors, console errors, DOM state, and saves a screenshot to `tools/screenshot.png`. Exit 0 = pass.

For a faster syntax-only check (no browser needed):

```powershell
$html = Get-Content Swimlane_App.html -Raw -Encoding UTF8
$js = $html.Substring($html.IndexOf('<script>') + 8, $html.LastIndexOf('</script>') - $html.IndexOf('<script>') - 8)
[System.IO.File]::WriteAllText("extracted.js", $js, [System.Text.Encoding]::UTF8)
node --check extracted.js; Remove-Item extracted.js
```

## CSS layout

- `--grid-size: 44px` — row height and background dot/line grid baseline
- `--left-margin: 176px` — controls column width; the red/grey margin line
- CSS Grid `grid-template-columns` is written dynamically by `Render.gridCSS()` on each rebuild
- Two themes: `body.theme-dotted` and `body.theme-lined`

## gh CLI path

`"C:\Program Files\GitHub CLI\gh.exe"` — not in PATH, use full path.
