# Student Progress View — Table Filter & Sort Design

**Feature Branch:** `feature/eth-7-add-advanced-filter-ui-to-student-progress-view-pr-44`
**Status:** Approved for implementation
**Date:** 2026-03-11

---

## Problem

The Student Progress View (`StudentProgressView.tsx`) has a course table with no way to sort or filter from the UI. The filter logic (ETH-6) is already wired up in state — we just need to surface it.

A Learning Supervisor reviewing a student with 20+ courses across multiple programs needs to quickly answer:
- "Show me everything that's still Not Enrolled"
- "Which Basic-level courses are incomplete?"
- "Sort by Status so I can see what needs attention first"

---

## Solution Overview

Three coordinated UI additions to the existing `<Table>` in `StudentProgressView.tsx`:

1. **Filter Toolbar** — search input + faceted filter buttons (Status, Level) above the table
2. **Sort Headers** — Asc/Desc `DropdownMenu` on Status and Level column headers
3. **Column Toggle** — "View" button that opens a checklist to show/hide any of the 7 columns

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Filter courses... 🔍 ]   [+ Status]  [+ Level]          [⊞ View] │
├──────────┬──────────────────┬──────────┬────────┬──────┬────┬───────┤
│ Course ID│ Course Name      │ Program  │ Level ↕│ Type │ Dur│Status↕│
├──────────┼──────────────────┼──────────┼────────┼──────┼────┼───────┤
│ #1234    │ Haas Maintenance │ Machinist│ Basic  │ ILT  │ 3d │ ● ... │
└──────────┴──────────────────┴──────────┴────────┴──────┴────┴───────┘
```

- Filter toolbar sits between the metric cards and the table border
- Sort indicators (`↕`, `↑`, `↓`) appear inline in the Level and Status column headers
- View button anchored to the right of the toolbar row

---

## Component Design

### FilterToolbar (inline in StudentProgressView)

```tsx
<div className="flex items-center gap-2 mb-3">
  <Input placeholder="Filter courses..." value={searchText} onChange={...} />
  <FacetFilter label="Status" options={ALL_STATUSES} selected={selectedStatuses} ... />
  <FacetFilter label="Level"  options={ALL_LEVELS}   selected={selectedLevels}  ... />
  <div className="ml-auto">
    <ColumnToggle hiddenCols={hiddenCols} onToggle={toggleCol} />
  </div>
</div>
```

### FacetFilter (new sub-component, same file)

Reuses the `FilterPopover` pattern from `claude-agent-dashboard/src/components/TaskTable.tsx`:
- Trigger: pill button showing label + active-count badge
- Content: `Popover` with checkbox list (one per option)
- Wires directly to existing `selectedStatuses` / `selectedLevels` state

**New shadcn deps:** `popover`, `checkbox`

### SortHeader (new sub-component, same file)

Reuses the `SortHeader` pattern from `claude-agent-dashboard/src/components/TaskTable.tsx`:
- Trigger: inline button in `<TableHead>` — label + sort-direction icon
- Content: `DropdownMenu` with Asc / Desc items only
- Applied to: **Level** and **Status** columns only

Uses Lucide icons (already in project): `ArrowUp`, `ArrowDown`, `ArrowUpDown`

**No new shadcn deps** — `dropdown-menu` already installed.

### ColumnToggle (new sub-component, same file)

- Trigger: `<Button variant="outline">⊞ View</Button>`
- Content: `DropdownMenu` with `DropdownMenuCheckboxItem` per column
- Toggleable columns: Course ID, Course Name, Program, Level, Training Type, Duration, Status

**No new shadcn deps** — uses `DropdownMenuCheckboxItem` already in `dropdown-menu`.

---

## State Additions

```typescript
// Sort
type SortCol = "level" | "status";
interface SortState { col: SortCol | null; dir: "asc" | "desc" }
const [sort, setSort] = useState<SortState>({ col: null, dir: "asc" });

// Column visibility
type ColKey = "courseId" | "courseName" | "program" | "level" | "type" | "duration" | "status";
const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set());
```

Sorted output: wrap `filteredCourses` in `useMemo` that applies sort after filter.

---

## Filter Logic Reuse (ETH-6)

ETH-6 already provides:
- `searchText` / `setSearchText`
- `selectedLevels` / `setSelectedLevels`
- `selectedStatuses` / `setSelectedStatuses`
- `filteredCourses` (derived state, AND logic across all filters)
- `clearFilters()`

No changes to filter logic — we're only building the UI on top.

---

## Atomic PR Breakdown

| PR | Scope | Branch |
|----|-------|--------|
| **ETH-8** | Install `popover` + `checkbox` shadcn components | `feat/eth-8-install-popover-checkbox` |
| **ETH-9** | Filter toolbar: search input + FacetFilter for Status & Level | `feat/eth-9-filter-toolbar` |
| **ETH-10** | Sort headers (Asc/Desc) on Level and Status columns | `feat/eth-10-sort-headers` |
| **ETH-11** | Column toggle "View" button | `feat/eth-11-column-toggle` |

Each PR is independently reviewable and demoable. ETH-8 is a prerequisite for ETH-9. ETH-10 and ETH-11 can be done in any order after ETH-9.

---

## Success Criteria

- [ ] Typing in the search box filters the table in real time
- [ ] Clicking "+ Status" opens a popover; selecting options narrows the table
- [ ] Clicking "+ Level" opens a popover; selecting options narrows the table
- [ ] Active filter count badge appears on pill buttons when selections are made
- [ ] Clicking "Asc" / "Desc" on Level header sorts the table rows
- [ ] Clicking "Asc" / "Desc" on Status header sorts the table rows
- [ ] "View" button opens column checklist; toggling hides/shows that column
- [ ] All combinations of filters + sort work together correctly
- [ ] Empty state message shown when filters produce zero results
