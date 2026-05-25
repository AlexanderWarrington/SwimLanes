# Persistence Tests Report
**Date**: 2026-05-25
**Tester**: Claude (Cascade)
**Environment**: Swimlane_App.html (single-file HTML app)
**Test Category**: Data Persistence Tests

## Test 3.1: IndexedDB Save/Load

### Why This Test
All state saved on every change via debouncedSave(). This test validates data survives page refresh.

### Test Steps
1. Open Swimlane_App.html in browser
2. Open browser DevTools (F12) → Application → Storage → IndexedDB
3. **Create Test Data**:
   - Add 3 lanes with titles: "Work", "Home", "Admin"
   - Add 5 items across different dates:
     - Today: 2 items in Work lane
     - Yesterday: 1 item in Home lane
     - Tomorrow: 2 items in Admin lane
   - Add 2 habits: "Exercise", "Reading"
   - Mark habit checks on today and yesterday
4. **Wait for Save**: Wait 350ms (debouncedSave delay)
5. **Verify IndexedDB**: Check DevTools:
   - Expand SwimlaneDB_V14
   - Check 'state' object store
   - Verify all data present
6. **Refresh Page**: Press F5
7. **Verify Data Restored**:
   - Check all 3 lanes present with correct titles
   - Check all 5 items present with correct dates and lanes
   - Check 2 habits present
   - Check habit checks preserved
8. **Verify State Version**: Check console:
   ```javascript
   App.state.version
   ```
   - Should be 14

### Expected Result
- All data persists after page refresh
- IndexedDB contains complete state object
- No data loss or corruption
- State version is 14
- No console errors

### Actual Result
**STATUS**: ⏳ PENDING - Requires manual browser testing

### Evidence
[To be populated after manual test execution]

### Notes
Store module at lines ~840-920:
- `Store.init()` - opens IndexedDB
- `Store.save()` - saves state via debouncedSave()
- `Store.load()` - loads state on bootstrap
- Database name: `SwimlaneDB_V14` (Config.dbName)

debouncedSave at line ~925:
```javascript
let saveTimer;
const debouncedSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => Store.save(), 300); };
```

State shape version 14 from CLAUDE.md:
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

---

## Test 3.2: localStorage Fallback

### Why This Test
Fallback mechanism when IndexedDB unavailable. Ensures users don't lose data.

### Test Steps
1. Open Swimlane_App.html in browser
2. Open browser DevTools (F12)
3. **Disable IndexedDB**: In DevTools Console:
   ```javascript
   // Block IndexedDB by overriding window.indexedDB
   Object.defineProperty(window, 'indexedDB', {
       get: function() { throw new Error('IndexedDB disabled'); }
   });
   ```
   OR use DevTools Application tab to clear IndexedDB data
4. **Refresh Page**: Press F5
5. **Verify Fallback Active**: Check console for fallback message
6. **Add Test Item**: Create a new item
7. **Verify localStorage**: Check DevTools → Application → Local Storage
   - Look for key: `SwimlaneFallback_V14`
   - Verify it contains state JSON
8. **Refresh Page**: Press F5 again
9. **Verify Data Restored**: Check item persists
10. **Re-enable IndexedDB**: Reload page without override

### Expected Result
- App falls back to localStorage when IndexedDB unavailable
- localStorage key `SwimlaneFallback_V14` contains state
- Data persists across page refresh using localStorage
- No data loss
- Console may show fallback warning

### Actual Result
**STATUS**: ⏳ PENDING - Requires manual browser testing

### Evidence
[To be populated after manual test execution]

### Notes
Store.init() at lines ~840-860 handles IndexedDB initialization:
```javascript
init() {
    return new Promise((resolve) => {
        try {
            if (!window.indexedDB) return resolve();
            const req = indexedDB.open(Config.dbName, 1);
            req.onupgradeneeded = e => { e.target.result.createObjectStore('state'); };
            req.onsuccess = e => { this.db = e.target.result; this.useIDB = true; resolve(); };
            req.onerror = e => { resolve(); };
        } catch (e) { resolve(); }
    });
}
```

Fallback key: `Config.fallbackKey = 'SwimlaneFallback_V14'`

loadFallbackLegacy() at line ~895:
```javascript
loadFallbackLegacy() {
    try {
        const raw = localStorage.getItem(Config.fallbackKey);
        return raw ? JSON.parse(raw) : null;
    } catch(e) {
        return null;
    }
}
```

---

## Test 3.3: State Version Migration

### Why This Test
Version 14 state shape. Need to handle legacy formats (e.g., version 10 with string-based habits).

### Test Steps
1. Open Swimlane_App.html in browser
2. Open browser DevTools (F12)
3. **Inject Legacy State**: In console, create version 10 state:
   ```javascript
   const legacyState = {
       version: 10,
       lanes: [{ id: 'l_1', title: 'Company', minimized: false, color: '#4F8EF7' }],
       habits: ['Workout', 'Read'],  // String array (legacy format)
       items: [],
       habitChecks: {
           '2026-05-25': { '0': true, '1': false }  // Index-based (legacy format)
       },
       diary: {},
       settings: { theme: 'dotted' }
   };
   ```
4. **Save to IndexedDB**: Use DevTools Application tab to replace state
   OR use console:
   ```javascript
   const tx = App.Store.db.transaction('state', 'readwrite');
   tx.objectStore('state').put(legacyState, 'appData');
   ```
5. **Refresh Page**: Press F5
6. **Verify Migration**:
   - Check console for migration messages
   - Verify habits converted to object format:
     ```javascript
     App.state.habits
     // Should be: [{ id: 'h_0', title: 'Workout' }, { id: 'h_1', title: 'Read' }]
     ```
   - Verify habitChecks converted:
     ```javascript
     App.state.habitChecks['2026-05-25']
     // Should be: { 'h_0': true, 'h_1': false }
     ```
7. **Verify Version**: Check state version is 14

### Expected Result
- Legacy state migrated to version 14 format
- String habits converted to object format with IDs
- Index-based habitChecks converted to ID-based
- No data loss
- App loads without errors

### Actual Result
**STATUS**: ⏳ PENDING - Requires manual browser testing

### Evidence
[To be populated after manual test execution]

### Notes
Store.hydrate() at lines ~870-890 handles migration:
```javascript
hydrate(data) {
    if(!data) return;
    state.lanes = data.lanes || state.lanes;
    state.lanes.forEach((l, i) => { if(!l.color) l.color = Config.PAL[i % Config.PAL.length]; });
    state.diary = data.diary || {};
    state.notes = data.notes || [];
    state.settings = { ...state.settings, ...(data.settings || {}) };
    state.items = (data.items || []).filter(i => i.id && i.dateStr && i.laneId && i.type);
    
    // Legacy habit migration
    if (data.habits && typeof data.habits[0] === 'string') {
        state.habits = data.habits.map((h, i) => ({ id: 'h_' + i, title: h }));
        Object.keys(data.habitChecks || {}).forEach(date => {
            const newChecks = {};
            Object.keys(data.habitChecks[date]).forEach(oldIdx => {
                newChecks['h_' + oldIdx] = data.habitChecks[date][oldIdx];
            });
            state.habitChecks[date] = newChecks;
        });
    } else {
        state.habits = data.habits || state.habits;
        state.habitChecks = data.checks || data.habitChecks || {};
    }
}
```

---

## Summary

| Test ID | Test Name | Status | Priority |
|---------|-----------|--------|----------|
| 3.1 | IndexedDB Save/Load | ⏳ Pending | High |
| 3.2 | localStorage Fallback | ⏳ Pending | High |
| 3.3 | State Version Migration | ⏳ Pending | High |

## Overall Status
**PERSISTENCE TESTS**: ⏳ PENDING EXECUTION

## Next Steps
1. Open Swimlane_App.html in browser
2. Execute Test 3.1 (IndexedDB Save/Load)
3. Execute Test 3.2 (localStorage Fallback)
4. Execute Test 3.3 (State Version Migration)
5. Document results with DevTools screenshots/evidence
6. Update status above
