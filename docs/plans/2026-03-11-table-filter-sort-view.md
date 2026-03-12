# Student Progress View — Filter Toolbar, Sort Headers & Column Toggle

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a filter toolbar (search + Status/Level facets), Asc/Desc sort on Level and Status columns, and a "View" column-visibility toggle to the Student Progress View table.

**Architecture:** All UI components are co-located in `StudentProgressView.tsx` as small sub-components (`FacetFilter`, `SortHeader`, `ColumnToggle`). They wire directly to existing ETH-6 filter state — no new data layer required. Sort state is new local state whose output wraps `filteredCourses` in a `useMemo`.

**Tech Stack:** React 19, TypeScript, shadcn/ui (Tailwind v4), Lucide icons, Radix Popover, Radix DropdownMenu

---

## PR ETH-8 — Install shadcn `popover` and `checkbox` components

### Task 1: Install components via shadcn CLI

**Files:**
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/checkbox.tsx`

**Step 1: Run shadcn add**

```bash
bunx shadcn@latest add popover checkbox
```

Expected output: two new files created in `src/components/ui/`.

**Step 2: Verify files exist**

```bash
ls src/components/ui/popover.tsx src/components/ui/checkbox.tsx
```

Expected: both paths printed, no errors.

**Step 3: Verify build still passes**

```bash
bun run build
```

Expected: no TypeScript errors.

**Step 4: Commit**

```bash
git add src/components/ui/popover.tsx src/components/ui/checkbox.tsx
git commit -m "feat(eth-8): install shadcn popover and checkbox components"
```

---

## PR ETH-9 — Filter toolbar: search input + FacetFilter for Status & Level

### Task 2: Add `FacetFilter` sub-component

**Files:**
- Modify: `src/components/progress/StudentProgressView.tsx`

**Context:** This is a self-contained component added above the `StudentProgressView` main export, same file. Model after `FilterPopover` in `claude-agent-dashboard/src/components/TaskTable.tsx` but using the Phillips corporate style (light mode, `border-border`, `bg-muted`).

**Step 1: Add imports at the top of `StudentProgressView.tsx`**

Add to the existing import block:
```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
```

**Step 2: Add `FacetFilter` component above the `StudentProgressView` function**

```typescript
function FacetFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const activeCount = selected.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm">
          + {label}
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 space-y-0.5" align="start">
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted focus-visible:outline-none"
          >
            <Checkbox checked={selected.includes(opt)} className="pointer-events-none" />
            <span>{opt}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

**Step 3: Derive available filter options from `flatCourses` in `StudentProgressView`**

Add these derived constants inside the component body (after `flatCourses` is set):
```typescript
const ALL_STATUSES: CourseStatus[] = ["Completed", "Incomplete", "Not Enrolled"];
const allLevels = useMemo(
  () => [...new Set(flatCourses.map((r) => r.course.levelName).filter(Boolean))].sort(),
  [flatCourses]
);
```

**Step 4: Replace the broken `clearFilters` button stub (lines ~318–325) with the filter toolbar**

Remove:
```tsx
{selectedLevels.length > 0 ||
  selectedStatuses.length > 0 ||
  (searchText !== "" && (
    <Button size="sm" onClick={() => clearFilters()} className="gap-2">
      Clear Filters
      <X className="h-5 w-5" />
    </Button>
  ))}
```

Replace with:
```tsx
{/* Filter Toolbar */}
<div className="flex items-center gap-2 mb-3">
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
    <Input
      placeholder="Filter courses..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="pl-8 h-9"
    />
  </div>

  <FacetFilter
    label="Status"
    options={ALL_STATUSES}
    selected={selectedStatuses}
    onToggle={(v) =>
      setSelectedStatuses((prev) =>
        prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
      )
    }
    onClear={() => setSelectedStatuses([])}
  />

  <FacetFilter
    label="Level"
    options={allLevels}
    selected={selectedLevels}
    onToggle={(v) =>
      setSelectedLevels((prev) =>
        prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v]
      )
    }
    onClear={() => setSelectedLevels([])}
  />

  {(selectedStatuses.length > 0 || selectedLevels.length > 0 || searchText !== "") && (
    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
      <X className="h-4 w-4" />
      Clear all
    </Button>
  )}
</div>
```

**Step 5: Verify the dev server renders the toolbar**

```bash
bun dev
```

Navigate to a student progress view. Confirm:
- Search input renders with magnifying glass icon
- "+ Status" and "+ Level" buttons render
- Typing in search filters the table
- Clicking a status option in the popover filters rows

**Step 6: Commit**

```bash
git add src/components/progress/StudentProgressView.tsx
git commit -m "feat(eth-9): add filter toolbar with search input and Status/Level facet filters"
```

---

## PR ETH-10 — Sort headers (Asc/Desc) on Level and Status columns

### Task 3: Add sort state and `SortHeader` sub-component

**Files:**
- Modify: `src/components/progress/StudentProgressView.tsx`

**Context:** Model after `SortHeader` in `claude-agent-dashboard/src/components/TaskTable.tsx`. Uses `DropdownMenu` (already installed). Lucide icons replace tabler icons.

**Step 1: Add Lucide sort icons to the import**

Add to the existing lucide-react import line:
```typescript
ArrowUp, ArrowDown, ArrowUpDown,
```

**Step 2: Add sort state inside `StudentProgressView`**

Add after the existing filter state declarations:
```typescript
type SortCol = "level" | "status";
const [sort, setSort] = useState<{ col: SortCol | null; dir: "asc" | "desc" }>({
  col: null,
  dir: "asc",
});
```

**Step 3: Add `SortHeader` component above the `StudentProgressView` function**

```typescript
function SortHeader({
  col,
  label,
  sort,
  onSort,
}: {
  col: "level" | "status";
  label: string;
  sort: { col: string | null; dir: "asc" | "desc" };
  onSort: (col: "level" | "status", dir: "asc" | "desc") => void;
}) {
  const isActive = sort.col === col;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 focus-visible:outline-none group">
          {label}
          <span className={isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"}>
            {isActive && sort.dir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : isActive && sort.dir === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem onClick={() => onSort(col, "asc")}>
          <ArrowUp className="h-3.5 w-3.5" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(col, "desc")}>
          <ArrowDown className="h-3.5 w-3.5" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 4: Add DropdownMenu imports**

Add to the existing import block:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**Step 5: Wrap `filteredCourses` in a sort `useMemo`**

Add after the existing `filteredCourses` declaration:
```typescript
const LEVEL_ORDER: Record<string, number> = { Basic: 0, Intermediate: 1, Advanced: 2 };
const STATUS_ORDER: Record<CourseStatus, number> = {
  "Not Enrolled": 0,
  "Incomplete": 1,
  "Completed": 2,
};

const sortedCourses = useMemo(() => {
  if (!sort.col) return filteredCourses;
  return [...filteredCourses].sort((a, b) => {
    let cmp = 0;
    if (sort.col === "level") {
      const aO = LEVEL_ORDER[a.course.levelName] ?? 99;
      const bO = LEVEL_ORDER[b.course.levelName] ?? 99;
      cmp = aO - bO;
    } else if (sort.col === "status") {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    }
    return sort.dir === "asc" ? cmp : -cmp;
  });
}, [filteredCourses, sort]);
```

**Step 6: Replace `filteredCourses` with `sortedCourses` in the table body map**

Find:
```tsx
filteredCourses.map((row) => (
```

Replace with:
```tsx
sortedCourses.map((row) => (
```

Also update the empty-state `filteredCourses.length` check:
```tsx
{sortedCourses.length === 0 ? (
```

**Step 7: Replace the Level and Status `<TableHead>` cells with `SortHeader`**

Find:
```tsx
<TableHead className="w-[12%]">Level</TableHead>
```
Replace with:
```tsx
<TableHead className="w-[12%]">
  <SortHeader col="level" label="Level" sort={sort} onSort={(col, dir) => setSort({ col, dir })} />
</TableHead>
```

Find:
```tsx
<TableHead className="w-[15%]">Status</TableHead>
```
Replace with:
```tsx
<TableHead className="w-[15%]">
  <SortHeader col="status" label="Status" sort={sort} onSort={(col, dir) => setSort({ col, dir })} />
</TableHead>
```

**Step 8: Verify**

```bash
bun dev
```

- Click Level header → Asc sorts Basic → Intermediate → Advanced
- Click Level header → Desc reverses order
- Click Status header → Asc sorts Not Enrolled → Incomplete → Completed
- Filters and sort work together

**Step 9: Commit**

```bash
git add src/components/progress/StudentProgressView.tsx
git commit -m "feat(eth-10): add Asc/Desc sort headers to Level and Status columns"
```

---

## PR ETH-11 — Column toggle "View" button

### Task 4: Add `ColumnToggle` sub-component and column visibility state

**Files:**
- Modify: `src/components/progress/StudentProgressView.tsx`

**Step 1: Add column visibility state inside `StudentProgressView`**

```typescript
type ColKey = "courseId" | "courseName" | "program" | "level" | "type" | "duration" | "status";

const COL_LABELS: Record<ColKey, string> = {
  courseId:   "Course ID",
  courseName: "Course Name",
  program:    "Program",
  level:      "Level",
  type:       "Training Type",
  duration:   "Duration",
  status:     "Status",
};

const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set());

const toggleCol = (col: ColKey) =>
  setHiddenCols((prev) => {
    const next = new Set(prev);
    next.has(col) ? next.delete(col) : next.add(col);
    return next;
  });
```

**Step 2: Add `ColumnToggle` component above `StudentProgressView`**

```typescript
function ColumnToggle({
  hiddenCols,
  onToggle,
}: {
  hiddenCols: Set<string>;
  onToggle: (col: string) => void;
}) {
  const cols: { key: string; label: string }[] = [
    { key: "courseId",   label: "Course ID" },
    { key: "courseName", label: "Course Name" },
    { key: "program",    label: "Program" },
    { key: "level",      label: "Level" },
    { key: "type",       label: "Training Type" },
    { key: "duration",   label: "Duration" },
    { key: "status",     label: "Status" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 ml-auto">
          <SlidersHorizontal className="h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cols.map(({ key, label }) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={!hiddenCols.has(key)}
            onCheckedChange={() => onToggle(key)}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 3: Add missing Lucide and DropdownMenu imports**

Add to lucide-react imports:
```typescript
SlidersHorizontal,
```

Add to dropdown-menu imports:
```typescript
DropdownMenuCheckboxItem,
DropdownMenuLabel,
DropdownMenuSeparator,
```

**Step 4: Add `<ColumnToggle>` to the filter toolbar row**

In the filter toolbar div, replace the `ml-auto` spacer area at the end with:
```tsx
<ColumnToggle hiddenCols={hiddenCols} onToggle={toggleCol} />
```

The toolbar now reads:
```tsx
<div className="flex items-center gap-2 mb-3">
  {/* search input */}
  {/* FacetFilter Status */}
  {/* FacetFilter Level */}
  {/* Clear all button (conditional) */}
  <ColumnToggle hiddenCols={hiddenCols} onToggle={toggleCol} />
</div>
```

**Step 5: Gate each `<TableHead>` and `<TableCell>` on `hiddenCols`**

For each of the 7 columns, wrap the header and every body cell in a conditional:

```tsx
// Header:
{!hiddenCols.has("courseId") && <TableHead className="w-[8%]">Course ID</TableHead>}

// Body cell (inside filteredCourses.map):
{!hiddenCols.has("courseId") && (
  <TableCell className="text-xs text-muted-foreground font-mono text-right">
    #{row.course.courseId}
  </TableCell>
)}
```

Repeat for all 7 columns: `courseId`, `courseName`, `program`, `level`, `type`, `duration`, `status`.

Also update `colSpan={7}` on the empty-state row to `colSpan={7 - hiddenCols.size}`.

**Step 6: Verify**

```bash
bun dev
```

- "View" button renders top-right of toolbar
- Clicking opens "Toggle columns" checklist with checkmarks
- Unchecking "Duration" hides that column from header and all rows
- Re-checking restores it
- Hiding multiple columns still renders a coherent table

**Step 7: Commit**

```bash
git add src/components/progress/StudentProgressView.tsx
git commit -m "feat(eth-11): add View column toggle with show/hide per column"
```

---

## Final verification after all PRs

```bash
bun run build
bun run lint
```

Expected: zero errors, zero warnings.

Check all success criteria from `docs/table-filter-view.md`.
