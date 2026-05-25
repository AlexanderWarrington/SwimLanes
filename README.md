# Swimlane Journal

A personal productivity journal that lives entirely in one HTML file. No build step, no server, no dependencies to install — open `Swimlane_App.html` in any modern browser and it works.

## What it is

An infinite-canvas daily journal organised into swimlanes (columns). Each lane tracks a different area of your life across a continuous scrollable timeline. Items can be tasks, milestones, outcomes, or events. Habits, diary entries, and a focus tracker run alongside.

All data is stored in IndexedDB in your browser with a localStorage fallback. Nothing leaves your machine.

## How to open it

Double-click `Swimlane_App.html`, or in PowerShell:

```powershell
Invoke-Item Swimlane_App.html
```

That's it. No `npm install`, no build step, no server.

## How to develop

Edit `Swimlane_App.html` directly. All HTML, CSS, and JavaScript live in that one file. See `CLAUDE.md` for the full architecture reference.

**After any change to the `<script>` block, verify before committing:**

```powershell
# 1. Syntax check (instant)
$html = Get-Content Swimlane_App.html -Raw -Encoding UTF8
$js = $html.Substring($html.IndexOf('<script>') + 8, $html.LastIndexOf('</script>') - $html.IndexOf('<script>') - 8)
[System.IO.File]::WriteAllText("extracted.js", $js, [System.Text.Encoding]::UTF8)
node --check extracted.js; Remove-Item extracted.js

# 2. Full smoke suite (opens headless browser, ~30s)
node tests/smoke.js
```

The git pre-commit hook runs `node tests/smoke.js` automatically on every commit. Set it up once after cloning:

```powershell
pwsh tools/install-hooks.ps1
```

## Branch naming convention

| Prefix | Use for | Example |
|--------|---------|---------|
| `feat/` | New user-facing feature | `feat/horizon-filtering` |
| `fix/` | Bug fix | `fix/streak-calculation` |
| `docs/` | Documentation only, no code change | `docs/update-architecture-notes` |
| `test/` | Adding or updating tests | `test/add-persistence-smoke` |
| `chore/` | Tooling, config, housekeeping | `chore/update-playwright` |

**Rules:**
- Branch from `main`, PR back to `main`
- Kebab-case only, no spaces or underscores
- Keep it short — the PR title carries the full description
- Delete the branch after merging

## Testing

```powershell
node tests/smoke.js
```

Seven automated Playwright tests covering boot, onboarding, add item, search, undo, and persistence. Screenshots saved to `tests/screenshots/` on each run.

Manual test specifications live in `tests/*.md` for cases that need human judgement (visual layout, drag-and-drop feel, etc.).

## Repo structure

```
Swimlane_App.html        The entire app
CLAUDE.md                Architecture reference and development rules
.windsurfrules           Windsurf / Cascade AI context
tools/
  browser-check.js       Quick headless diagnostic (page errors, screenshot)
  pre-commit             Git hook source — installed by install-hooks.ps1
  install-hooks.ps1      One-time hook setup after cloning
tests/
  smoke.js               Automated Playwright smoke suite (7 tests)
  screenshots/           Screenshots from last smoke run
  *.md                   Manual test specifications and baseline report
```

## Key constraints

- No framework, no bundler, no npm. Keep it that way.
- All JavaScript is one IIFE — nothing leaks to `window` except `App`.
- Never write `</script>` literally inside a `<script>` block, even in comments. Use `<\/script>`.
- HTML entities inside `<script>` tags are not decoded by the browser — `&amp;` stays `&amp;` in JS. This is intentional in `Utils.escape`.
