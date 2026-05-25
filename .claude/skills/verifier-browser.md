# Browser Verification Skill

Use this skill to verify that `Swimlane_App.html` loads without JavaScript errors and renders content correctly.

## When to invoke

- After any edit to the `<script>` block in `Swimlane_App.html`
- When the user reports a white screen, blank page, or JS rendering as visible text
- After fixing a syntax error or runtime bug
- Before marking any JS fix as complete

## How to run

```powershell
node tools/browser-check.js
```

- Exit 0 = PASS (no JS errors, 60 day blocks rendered)
- Exit 1 = FAIL (see output for page errors / console errors)

Screenshot is saved to `tools/screenshot.png` — read it to confirm visual state.

## If Playwright is missing

```powershell
npx playwright install chromium
```

## Quick syntax check (no browser needed)

Run this first — it's instant and catches syntax errors before launching a browser:

```powershell
$html = Get-Content Swimlane_App.html -Raw -Encoding UTF8
$start = $html.IndexOf('<script>') + '<script>'.Length
$end   = $html.LastIndexOf('</script>')
$js    = $html.Substring($start, $end - $start)
[System.IO.File]::WriteAllText("extracted.js", $js, [System.Text.Encoding]::UTF8)
node --check extracted.js
Remove-Item extracted.js
```

## Interpreting results

| Symptom | Cause | Fix |
|---|---|---|
| JS renders as text | `</script>` literal in a `<script>` comment | Change to `<\/script>` |
| `Invalid or unexpected token` | Broken string literal in JS | Hex-check the escape function; look for `'\\'` + orphan `'` |
| White screen, no page errors | Runtime crash in `bootstrap()` or `VirtualScroll.init()` | Check console for errors |
| `Executable doesn't exist` | Chromium not installed | `npx playwright install chromium` |
