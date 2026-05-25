# Regression Tests Report
**Date**: 2026-05-25
**Tester**: Claude (Cascade)
**Environment**: Swimlane_App.html (single-file HTML app)
**Test Category**: Baseline Regression Tests

## Test 1.1: Habit Streak Calculation

### Why This Test
Recent fix addressed overcounting streaks across gaps in sparse data. The old implementation iterated `Object.keys(habitChecks)` which only contained keys for days where at least one habit was touched — gap days had no key, so the loop silently skipped them and inflated the streak count.

### Test Steps
1. Open Swimlane_App.html in browser
2. Navigate to habit tracking section
3. Create a new habit (e.g., "Test Habit")
4. Mark habit as complete on:
   - Today (current date)
   - Yesterday (1 day ago)
   - 2 days ago
5. Leave day 3 days ago unchecked (create a gap)
6. Mark habit as complete on:
   - 4 days ago
   - 5 days ago
7. Observe the streak count badge (S mode)
8. Observe the total count badge (T mode)
9. Verify streak shows 3 (consecutive from today)
10. Verify total shows 5 (all checks regardless of gaps)

### Expected Result
- Streak count (S): 3 (consecutive days: today, yesterday, 2 days ago)
- Total count (T): 5 (all checked days)
- Streak calculation walks consecutive calendar days backward from today, breaking at first gap

### Actual Result
**STATUS**: ⏳ PENDING - Requires manual browser testing

### Evidence
[To be populated after manual test execution]

### Notes
The fix is in `Render.habitStats()` at lines 1926-1952 in Swimlane_App.html:
```javascript
// Streak: walk consecutive calendar days backward from today.
let streakCount = 0;
const checkDate = new Date(Utils.today);
while (true) {
    const dateStr = Utils.toLocalISO(checkDate);
    if (state.habitChecks[dateStr]?.[habit.id]) {
        streakCount++;
    } else {
        break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
}
```

---

## Test 1.2: Type-Event Item Type

### Why This Test
Recent fix added `{ id: 'type-event', label: 'E' }` to `Config.itemTypes` with CSS badge styling, italic text, countdown display, and inclusion in Horizon filter and `updateDayToggles` countdown selector.

### Test Steps
1. Open Swimlane_App.html in browser
2. Add a new item to any lane on today's date
3. Click the type badge to cycle through types
4. Verify cycle order: T (task) → M (milestone) → O (outcome) → E (event) → T
5. When on type-event:
   - Verify badge displays with blue background (#e0e7ff) and "E" label
   - Verify text is italicized (CSS: `font-style: italic`)
   - Verify text color is blue (#1e40af)
   - Add a future date (e.g., 5 days from today)
   - Verify countdown displays "(5d)" format
   - For today, verify "(Today)"
   - For past dates, verify "(Past)"
6. Open Horizon view
7. Verify type-event items appear in Horizon when date ≥ today
8. Verify type-event items are filtered correctly when showAchievements is off

### Expected Result
- Type-event badge: blue background, "E" label, visible
- Text: italicized, blue color
- Countdown: displays "(Xd)" / "(Today)" / "(Past)" correctly
- Horizon: includes type-event items in filter condition
- Config.itemTypes includes all 4 types: T, M, O, E

### Actual Result
**STATUS**: ⏳ PENDING - Requires manual browser testing

### Evidence
[To be populated after manual test execution]

### Notes
CSS for type-event at lines 331-333:
```css
.type-event .type-badge { background: #e0e7ff; color: #1e40af; border: 1px solid #bfdbfe; }
.type-event .text-input, .type-event .text-input-readonly { font-style: italic; color: #1e40af; }
.type-event .countdown { display: inline-block; }
```

Config.itemTypes at line 672:
```javascript
itemTypes: [{ id: 'type-task', label: 'T' }, { id: 'type-milestone', label: 'M' }, { id: 'type-outcome', label: 'O' }, { id: 'type-event', label: 'E' }]
```

Horizon filter at line 1720:
```javascript
const hzItems = state.items.filter(i => { return i.laneId === lane.id && i.dateStr && (i.type === 'type-outcome' || i.type === 'type-milestone' || i.type === 'type-event') && (i.dateStr >= sysToday || i.isDone); });
```

---

## Summary

| Test ID | Test Name | Status | Priority |
|---------|-----------|--------|----------|
| 1.1 | Habit Streak Calculation | ⏳ Pending | High |
| 1.2 | Type-Event Item Type | ⏳ Pending | High |

## Overall Status
**REGRESSION TESTS**: ⏳ PENDING EXECUTION

## Next Steps
1. Open Swimlane_App.html in browser
2. Execute Test 1.1 (Habit Streak Calculation)
3. Execute Test 1.2 (Type-Event Item Type)
4. Document results with screenshots/evidence
5. Update status above
