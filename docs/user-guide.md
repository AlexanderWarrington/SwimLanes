# Swimlane Journal — User Guide

## What it is

Swimlane Journal is an infinite-canvas daily planner that lives in a single HTML file. Open it in any browser — no login, no server, no install. Your data stays on your device.

The core idea: time runs vertically as a continuous scroll. Past is above, future is below, today is in the middle. Each lane is a column tracking a different area of your life — Work, Health, Personal, or whatever fits you.

---

## Getting started

1. Open `Swimlane_App.html` in a modern browser (Chrome, Edge, Firefox, Safari).
2. The welcome screen gives you two options:
   - **Try Demo** — loads a pre-filled example with three lanes and a mix of items so you can explore before committing.
   - **Start Fresh** — blank slate with no data.
3. Click **+ Lane** to add your first column. Name it for an area of your life.
4. Click any cell on the timeline to add an item to that day.

---

## The four item types

Every item has a coloured badge — **T**, **M**, **O**, or **E**. Click the badge to cycle through types.

| Badge | Name | When to use |
|---|---|---|
| **T** | Task | Everyday to-dos. Things to cross off. |
| **M** | Milestone | A date you're building toward — a deadline, a checkpoint, a delivery. Shows in Horizon with a countdown. |
| **O** | Outcome | A bigger goal with a target date — a result you want to achieve, not just a deadline to meet. Displayed large and in the lane's colour. Shows in Horizon. |
| **E** | Event | Something happening on a fixed date that you're tracking but not "completing" — a meeting, a trip, a release someone else controls. Shows in Horizon. |

**Right-click** any item to mark it done (or undone). Done tasks get struck through. Done M, O, and E items are hidden from the Horizon unless you enable "Show Past Days" in the menu.

---

## The Horizon

Click **Hz** in the top-left to open the Horizon bar — a sticky index strip that shows all your upcoming **M**, **O**, and **E** items sorted by days remaining, across all lanes at once.

- The red number is days until the date. **Today** and **Past** are shown in place of a number.
- The **↗** arrow next to each item scrolls the timeline to that date.
- Use the **Scrolled** filter in the menu to show only items whose row is currently on screen.

Tasks (T) don't appear in the Horizon — they're day-level detail, not strategic markers.

---

## Habits

The habit tracker runs along the bottom of the timeline. Each habit gets its own column; check the box on each day you complete it.

- Add a habit with **+ Habit** in the header row.
- The streak counter shows consecutive days completed.
- Right-click a habit header to delete it.

---

## Diary

The diary column (rightmost) gives you one free-text entry per day. Click to edit. It's for anything — notes, reflections, what happened. Searchable via Ctrl+K.

---

## Focus tracker

The narrow **◎** column tracks where you spent focused time each day. Click to log a session. The **Focus Timeline** button shows a history view.

---

## Projects and Notes

Each lane has two side drawers:

- **📁 Projects** — a backlog of tasks that aren't tied to a specific date. Drag project tasks directly onto calendar days to schedule them.
- **📝 Notes** — long-form notes attached to the lane (not to a date).

Click the icons in the lane header to open them.

---

## Task notes

Click the **▼** chevron on any task to expand an inline rich-text note below it. Useful for sub-tasks, links, or context that doesn't belong on the main timeline.

---

## Keyboard shortcuts and navigation

| Action | How |
|---|---|
| Search everything | **Ctrl+K** (or Cmd+K on Mac) |
| Jump to today | Click **Tod** in the header |
| Undo | **Ctrl+Z** (when not in a text field) |
| Mark item done | **Right-click** the item |
| Mark done (touch) | **Double-tap** the item |
| Cycle item type | Click the **T/M/O/E badge** |

---

## Minimising lanes

Click the **–** button in a lane header to collapse that lane to a narrow strip. Useful when you want to focus on one area without deleting others.

---

## Searching

**Ctrl+K** opens the command palette. Type two or more characters to search across all task text and diary entries. Click a result to jump to that date.

---

## Importing and exporting data

Open **⚙ Menu → Export** to download a JSON backup. **Import** loads a backup file and replaces the current data. Use this to move your journal between devices or browsers.

Your data lives in the browser's IndexedDB — clearing browser storage will erase it, so export regularly.

---

## Themes

**⚙ Menu → Paper Style** switches between Dotted and Lined grid backgrounds.

---

## Tips for getting started

- **Start with Outcomes.** Before adding tasks, put one O per lane for what you're ultimately working toward this quarter. Then add the Milestones that lead there.
- **Keep Tasks day-specific.** If a task doesn't need to happen on a particular day, put it in Projects (📁) instead — it won't clutter the timeline.
- **Use the Horizon as your weekly review.** Open Hz on Monday morning to see what's coming up across all lanes.
- **Right-click is your friend.** It's the fastest way to mark things done without opening anything.
