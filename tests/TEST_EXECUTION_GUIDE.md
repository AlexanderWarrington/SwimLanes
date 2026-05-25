# Test Execution Guide - Swimlane Journal
**Date**: 2026-05-25
**Purpose**: Step-by-step instructions for executing baseline tests

## Quick Start

1. **Open the Application**:
   ```powershell
   # In PowerShell, run:
   Invoke-Item "c:\Users\PC\Documents\AntiGravity\Projects\SwimLanes\Swimlane_App.html"
   ```
   OR double-click the file in File Explorer

2. **Open Browser DevTools**: Press F12 (or right-click → Inspect)

3. **Follow Test Procedures**: Each test file has detailed step-by-step instructions

## Test Execution Order

### Phase 1: Regression Tests (30 minutes)
**Priority**: HIGH - These validate recent bug fixes

1. Open `tests/regression-tests.md`
2. Execute **Test 1.1: Habit Streak Calculation**
   - Follow steps 1-10
   - Document results in the file
   - Update status to ✅ PASS or ❌ FAIL
3. Execute **Test 1.2: Type-Event Item Type**
   - Follow steps 1-8
   - Document results in the file
   - Update status to ✅ PASS or ❌ FAIL

### Phase 2: Data Flow Tests (20 minutes)
**Priority**: HIGH - Validates core architecture

1. Open `tests/data-flow-tests.md`
2. Execute **Test 2.1: One-Way Data Flow Verification**
   - Follow steps 1-9
   - Use DevTools console for verification
   - Document results
3. Execute **Test 2.2: EventBus Propagation**
   - Follow steps 1-9
   - Add temporary console logging
   - Document results

### Phase 3: Persistence Tests (25 minutes)
**Priority**: HIGH - Validates data storage

1. Open `tests/persistence-tests.md`
2. Execute **Test 3.1: IndexedDB Save/Load**
   - Follow steps 1-8
   - Use DevTools Application tab
   - Document results
3. Execute **Test 3.2: localStorage Fallback**
   - Follow steps 1-10
   - Disable IndexedDB temporarily
   - Document results
4. Execute **Test 3.3: State Version Migration**
   - Follow steps 1-7
   - Inject legacy state via console
   - Document results

### Phase 4: User Interaction Tests (35 minutes)
**Priority**: HIGH - Validates core UX

1. Open `tests/user-interaction-tests.md`
2. Execute **Test 4.1: Item CRUD Operations**
   - Follow steps 1-8
   - Test create, read, update, delete
   - Document results
3. Execute **Test 4.2: Lane Management**
   - Follow steps 1-7
   - Test add, edit, minimize, color, delete
   - Document results
4. Execute **Test 4.4: Search (Ctrl+K)**
   - Follow steps 1-7
   - Test search functionality
   - Document results
5. Execute **Test 4.5: Undo/Redo**
   - Follow steps 1-7
   - Test undo stack and keyboard shortcut
   - Document results

### Phase 5: Edge Case Tests (20 minutes)
**Priority**: MEDIUM - Validates boundary conditions

1. Open `tests/edge-case-tests.md`
2. Execute **Test 5.1: Virtual Scroll Boundaries**
   - Follow steps 1-8
   - Test scrolling at edges
   - Document results
3. Execute **Test 5.2: Date Boundary Conditions**
   - Follow steps 1-8
   - Test month/year/leap year
   - Document results
4. Execute **Test 5.3: Empty States**
   - Follow steps 1-8
   - Clear all data and reload
   - Document results

### Phase 6: Integration Tests (25 minutes)
**Priority**: MEDIUM - Validates feature integration

1. Open `tests/integration-tests.md`
2. Execute **Test 6.1: Horizon View**
   - Follow steps 1-8
   - Test Horizon panel
   - Document results
3. Execute **Test 6.2: Notes Drawer**
   - Follow steps 1-9
   - Test notes CRUD and formatting
   - Document results
4. Execute **Test 6.3: Projects Drawer**
   - Follow steps 1-9
   - Test projects and drag-to-schedule
   - Document results

## Documentation Guidelines

### Updating Test Files

For each test, update the following sections:

```markdown
### Actual Result
**STATUS**: ✅ PASS / ❌ FAIL
[Brief description of what happened]

### Evidence
[Screenshot path or console output]
- Screenshot: `tests/screenshots/test-1.1-streak.png`
- Console output:
  ```
  Streak count: 3
  Total count: 5
  ```

### Notes
[Any observations, issues found, or deviations from expected]
```

### Taking Screenshots

1. **Windows Snipping Tool**: Press `Win + Shift + S`
2. **Browser DevTools**: Can capture screenshots via DevTools (Ctrl+Shift+P → "Capture screenshot")
3. **Save to**: `tests/screenshots/` directory with descriptive names:
   - `test-1.1-streak-calculation.png`
   - `test-1.2-type-event-badge.png`
   - `test-4.1-item-crud.png`

### Console Output

Copy relevant console output to test files:

```javascript
// Example console verification
App.state.items.length
// Output: 5

App.state.version
// Output: 14
```

## Updating the Baseline Report

After completing tests, update `tests/baseline-test-report-2026-05-25.md`:

1. Update each status table with ✅ or ❌
2. Update overall progress:
   - Completed count
   - Passed count
   - Failed count
   - Completion percentage
3. Add summary of findings in "Executive Summary" section

## entire.io Integration

### Saving Test Sessions

After each test session, save checkpoint:

```bash
# If entire CLI is installed
entire checkpoint save "test-session-$(date +%Y-%m-%d)"
```

### Tagging Test Files

Add tags to test files for entire.io search:

```markdown
# Regression Tests Report
**Tags**: #baseline #regression #streak #type-event
```

### Querying Test History

```bash
entire search --json "tag:regression status:fail"
entire search --json "tag:baseline date:2026-05-25"
```

## Troubleshooting

### Issue: File won't open in browser
**Solution**: Use `Invoke-Item` in PowerShell or double-click in File Explorer

### Issue: IndexedDB not visible in DevTools
**Solution**: 
- Refresh DevTools (F5 in DevTools window)
- Check Application → Storage → IndexedDB
- Ensure not in private/incognito mode

### Issue: Console commands not working
**Solution**: Ensure App is accessible:
```javascript
// Check if App is defined
typeof App
// Should return "object"
```

### Issue: Tests not persisting after refresh
**Solution**: 
- Wait 350ms after changes (debouncedSave delay)
- Check browser console for errors
- Verify IndexedDB has data

## Estimated Time

- Phase 1 (Regression): 30 minutes
- Phase 2 (Data Flow): 20 minutes
- Phase 3 (Persistence): 25 minutes
- Phase 4 (User Interaction): 35 minutes
- Phase 5 (Edge Cases): 20 minutes
- Phase 6 (Integration): 25 minutes

**Total Estimated Time**: ~2.5 hours

## Completion Checklist

- [ ] All 16 tests executed
- [ ] All test files updated with results
- [ ] Screenshots saved for visual tests
- [ ] Console output documented
- [ ] Baseline report updated
- [ ] Overall completion percentage calculated
- [ ] Findings summarized
- [ ] Test files tagged for entire.io
- [ ] entire.io checkpoint saved (if CLI installed)

## Next Steps After Baseline

1. **Analyze Results**: Identify any failures or issues
2. **Fix Bugs**: Report and fix any failing tests
3. **Automate**: Set up Playwright for automated testing
4. **CI/CD**: Integrate into continuous integration pipeline
5. **Regression Protection**: Run baseline before each release

---

**Guide Created**: 2026-05-25
**For Questions**: Refer to individual test files or CLAUDE.md
