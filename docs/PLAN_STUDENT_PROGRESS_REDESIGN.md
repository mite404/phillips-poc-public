# StudentProgressView Redesign - Tasks View Pattern

## Overview

Redesign the StudentProgressView component from a card-based layout to a **table-based layout** following the shadcn Tasks view pattern. This provides a more compact, scannable interface with program-based filtering using clickable tags.

## Key Requirements

- **Layout**: Table-based (not card-based)
- **Filtering**: Program names as clickable tags/badges
- **Space Efficiency**: Show more courses on screen at once
- **Status Visibility**: Status badges in table cells
- **Existing Components**: Use shadcn Table, Badge, Button components (already in codebase)
- **No New Dependencies**: All components already exist

## Current State Analysis

### StudentProgressView Structure (Before)

- **Layout**: Card-based with ProgramProgressCard components
- **Display**: Programs shown vertically with progress bars
- **Data**: Hierarchical structure (HydratedProgram[])
- **Space**: Each program takes significant vertical space

### Data Structures

```typescript
// Current hierarchical structure
interface HydratedProgram {
  program: SupervisorProgram;
  courses: CourseCatalogItem[];
  enrollments: CourseEnrollment[];
}

// Will transform to flat structure
interface CourseRow {
  course: CourseCatalogItem;
  program: SupervisorProgram;
  enrollment?: CourseEnrollment;
  status: CourseStatus;
}
```

## Implementation Plan

### Phase 1: Data Structure Changes

**File**: `src/components/progress/StudentProgressView.tsx`

#### 1.1 Add New Interface for Flattened Course Rows

```typescript
interface CourseRow {
  course: CourseCatalogItem;
  program: SupervisorProgram;
  enrollment?: CourseEnrollment;
  status: CourseStatus;
}
```

#### 1.2 Transform Hierarchical Data to Flat Array

After fetching `hydratedPrograms`, flatten the data:

```typescript
const flatCourses: CourseRow[] = hydratedPrograms.flatMap(
  ({ program, courses, enrollments }) =>
    courses.map((course) => ({
      course,
      program,
      enrollment: enrollments.find((e) => e.courseId === course.courseId),
      status: getCourseStatus(course.courseId),
    })),
);
```

**Note:** The `course` object contains all the fields needed for table columns:

- `course.courseId` → Course ID column
- `course.courseTitle` → Course Name column
- `course.levelName` → Level column
- `course.trainingTypeName` → Type column
- `course.totalDays` → Duration column

#### 1.3 Add Filter State Management

```typescript
const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

// Toggle program filter
const toggleProgramFilter = (programId: string) => {
  setSelectedPrograms((prev) =>
    prev.includes(programId)
      ? prev.filter((id) => id !== programId)
      : [...prev, programId],
  );
};

// Clear all filters
const clearFilters = () => setSelectedPrograms([]);

// Apply filters
const filteredCourses =
  selectedPrograms.length > 0
    ? flatCourses.filter((row) => selectedPrograms.includes(row.program.id))
    : flatCourses;
```

---

### Phase 2: Table Component Structure

**File**: `src/components/progress/StudentProgressView.tsx`

#### 2.1 Import Required Components

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
```

#### 2.2 Replace Card-Based Layout with Table

**Remove:**

- `<ProgramProgressCard>` components
- `space-y-8` container
- Card-based iteration

**Add:**

- Filter tags section at top
- Table with columns: Course ID, Course Name, Program, Level, Type, Duration, Status
- Rows mapped from `filteredCourses`

---

### Phase 3: Filter Tags Section

**File**: `src/components/progress/StudentProgressView.tsx`

#### 3.1 Display Program Filter Tags

Above the table, show all available programs as clickable badges:

```tsx
<div className="mb-6 space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-medium text-foreground">Filter by Program</h3>
    {selectedPrograms.length > 0 && (
      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
        <X className="h-3 w-3 mr-1" />
        Clear Filters
      </Button>
    )}
  </div>
  <div className="flex flex-wrap gap-2">
    {hydratedPrograms.map(({ program }) => (
      <Badge
        key={program.id}
        variant={selectedPrograms.includes(program.id) ? "default" : "outline"}
        className="cursor-pointer hover:bg-primary/20 transition-colors"
        onClick={() => toggleProgramFilter(program.id)}
      >
        {program.programName}
      </Badge>
    ))}
  </div>
</div>
```

---

### Phase 4: Table Implementation

**File**: `src/components/progress/StudentProgressView.tsx`

#### 4.1 Table Structure

```tsx
<div className="border border-border rounded-[--radius] overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted">
        <TableHead className="w-[8%]">Course ID</TableHead>
        <TableHead className="w-[25%]">Course Name</TableHead>
        <TableHead className="w-[18%]">Program</TableHead>
        <TableHead className="w-[12%]">Level</TableHead>
        <TableHead className="w-[12%]">Type</TableHead>
        <TableHead className="w-[10%] text-right">Duration</TableHead>
        <TableHead className="w-[15%] text-center">Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredCourses.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
            {selectedPrograms.length > 0
              ? "No courses found in selected programs"
              : "No courses assigned"}
          </TableCell>
        </TableRow>
      ) : (
        filteredCourses.map((row) => (
          <TableRow key={`${row.program.id}-${row.course.courseId}`}>
            {/* Course ID */}
            <TableCell className="text-xs text-muted-foreground font-mono">
              #{row.course.courseId}
            </TableCell>

            {/* Course Name */}
            <TableCell className="font-medium">{row.course.courseTitle}</TableCell>

            {/* Program Badge (clickable) */}
            <TableCell>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => toggleProgramFilter(row.program.id)}
              >
                {row.program.programName}
              </Badge>
            </TableCell>

            {/* Level */}
            <TableCell className="text-sm text-muted-foreground">
              {row.course.levelName}
            </TableCell>

            {/* Type */}
            <TableCell className="text-sm text-muted-foreground">
              {row.course.trainingTypeName}
            </TableCell>

            {/* Duration */}
            <TableCell className="text-sm text-muted-foreground text-right">
              {row.course.totalDays} days
            </TableCell>

            {/* Status Badge */}
            <TableCell className="text-center">
              <Badge className={getStatusClassName(row.status)}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

#### 4.2 Status Badge Styling Helper

```typescript
const getStatusClassName = (status: CourseStatus): string => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Incomplete":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Not Enrolled":
      return "bg-slate-100 text-slate-600 hover:bg-slate-100";
  }
};
```

---

### Phase 5: Overall Progress Summary

**File**: `src/components/progress/StudentProgressView.tsx`

#### 5.1 Add Summary Stats Above Filters

Display overall progress metrics:

```tsx
<div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Total Courses */}
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold">{flatCourses.length}</div>
      <p className="text-xs text-muted-foreground">Total Courses</p>
    </CardContent>
  </Card>

  {/* Completed */}
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold text-green-600">
        {flatCourses.filter((r) => r.status === "Completed").length}
      </div>
      <p className="text-xs text-muted-foreground">Completed</p>
    </CardContent>
  </Card>

  {/* In Progress */}
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold text-yellow-600">
        {flatCourses.filter((r) => r.status === "Incomplete").length}
      </div>
      <p className="text-xs text-muted-foreground">In Progress</p>
    </CardContent>
  </Card>
</div>
```

---

### Phase 6: Remove or Repurpose ProgramProgressCard

**File**: `src/components/progress/ProgramProgressCard.tsx`

**Options:**

1. **Delete the file** if no longer needed (recommended)
2. **Archive** by renaming to `ProgramProgressCard.old.tsx`
3. **Keep** if other parts of the codebase use it

**Recommended:** Delete the file since StudentProgressView will no longer use card-based layout.

---

### Phase 7: Responsive Design

**File**: `src/components/progress/StudentProgressView.tsx`

#### 7.1 Add Horizontal Scroll for Mobile

Wrap table in scrollable container:

```tsx
<div className="overflow-x-auto">
  <Table>{/* table content */}</Table>
</div>
```

#### 7.2 Responsive Summary Stats

Use responsive grid for summary cards:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{/* summary cards */}</div>
```

---

## Critical Files to Modify

### Primary:

1. **`src/components/progress/StudentProgressView.tsx`** - Main component redesign
   - Add flattened data structure
   - Add filter state management
   - Replace card layout with table
   - Add filter tags section
   - Add summary stats

### Optional:

2. **`src/components/progress/ProgramProgressCard.tsx`** - Delete or archive (no longer used)

### Already Available (No Changes):

3. `src/components/ui/table.tsx` - Table component (ready to use)
4. `src/components/ui/badge.tsx` - Badge component (ready to use)
5. `src/components/ui/button.tsx` - Button component (ready to use)
6. `src/components/ui/card.tsx` - Card component (for summary stats)

---

## UI Layout Structure

### Before (Card-Based):

```
Student Progress View
├── Header (Student Name)
└── Cards Container
    ├── Program Card 1
    │   ├── Program Name + Description
    │   ├── Progress Bar
    │   └── Course List (grid)
    ├── Program Card 2
    │   └── (same structure)
    └── Program Card 3
        └── (same structure)
```

### After (Table-Based):

```
Student Progress View
├── Header (Student Name)
├── Summary Stats (3 cards: Total, Completed, In Progress)
├── Filter Tags Section
│   ├── "Filter by Program" label
│   ├── Program badges (clickable)
│   └── "Clear Filters" button (if active)
└── Courses Table
    ├── Table Header (Course ID, Course Name, Program, Level, Type, Duration, Status)
    └── Table Body (all courses flattened)
```

---

## Data Flow

### Current Flow (Hierarchical):

```
API Data → HydratedProgram[] → Map to ProgramProgressCard components
```

### New Flow (Flat):

```
API Data → HydratedProgram[] → Flatten to CourseRow[] → Filter by selected programs → Render table rows
```

---

## Key Advantages

✅ **3-4x more courses visible** without scrolling  
✅ **Easier scanning** - horizontal layout for comparison  
✅ **Quick filtering** - click program badge to filter  
✅ **Status at a glance** - badges make progress immediately visible  
✅ **No new dependencies** - uses existing shadcn components  
✅ **Mobile responsive** - horizontal scroll built-in  
✅ **Consistent design** - matches Lyra theme

---

## Verification Steps

After implementation:

### Visual Checks:

- [ ] Table displays with sharp corners (border-radius: 0)
- [ ] Header row has bg-muted background
- [ ] Program badges are clickable and toggle filter state
- [ ] Active filters highlight with Phillips orange
- [ ] Status badges use correct colors (green/yellow/slate)
- [ ] Summary stats display correct counts
- [ ] "Clear Filters" button appears when filters active

### Functional Checks:

- [ ] Clicking program badge filters table to show only that program's courses
- [ ] Clicking same badge again removes filter
- [ ] Multiple programs can be selected simultaneously
- [ ] "Clear Filters" button resets all filters
- [ ] Empty state shows when no courses match filters
- [ ] Table shows all courses when no filters active
- [ ] Course status reflects enrollment data correctly

### Responsive Checks:

- [ ] Table scrolls horizontally on mobile screens
- [ ] Summary stats stack vertically on mobile
- [ ] Filter tags wrap to multiple rows if needed
- [ ] Touch targets are appropriately sized for mobile

---

## Implementation Order

1. **Add new interfaces** (CourseRow type)
2. **Add filter state** (useState for selectedPrograms)
3. **Flatten data structure** (transform hydratedPrograms → flatCourses)
4. **Add summary stats section** (3 cards at top)
5. **Add filter tags section** (program badges + clear button)
6. **Replace card layout with table** (Table, TableHeader, TableBody, TableRow, TableCell)
7. **Add status badge helper** (getStatusClassName function)
8. **Test filtering** (click badges, verify table updates)
9. **Add responsive wrapper** (overflow-x-auto)
10. **Clean up** (remove/archive ProgramProgressCard.tsx if unused)

---

## Estimated Effort

- **Data structure refactor**: 30 minutes
- **Filter state logic**: 20 minutes
- **Summary stats section**: 15 minutes
- **Filter tags UI**: 20 minutes
- **Table implementation**: 45 minutes
- **Status styling**: 15 minutes
- **Responsive design**: 15 minutes
- **Testing & polish**: 30 minutes

**Total**: ~3 hours

---

## Phase 8: Advanced Filtering Features

Enhance the StudentProgressView table with modern filtering capabilities inspired by the shadcn Tasks template. Add text search and status filtering to help supervisors quickly find specific courses.

## Requirements

- **Text Search Filter**: Search across all fields (course name, program name, level, type, course ID)
- **Status Dropdown Filter**: Filter by enrollment status (Completed/Incomplete/Not Enrolled)
- **Multi-Filter Logic**: Combine all filters using AND logic
- **Sharp Corners**: Maintain border-radius: 0 (Lyra theme)
- **Filter Count Badge**: Show how many statuses are selected
- **Smart Empty States**: Different messages based on active filters

---

## Phase 8A: Add Filter UI Components

**File**: `src/components/progress/StudentProgressView.tsx`

#### 8A.1 Add Component Imports

```typescript
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";
```

#### 8A.2 Add Filter State Variables

```typescript
const [searchText, setSearchText] = useState<string>("");
const [selectedStatuses, setSelectedStatuses] = useState<CourseStatus[]>([]);
```

---

## Phase 8B: Implement Text Search Logic

**File**: `src/components/progress/StudentProgressView.tsx`

#### 8B.1 Create Search Filter Function

```typescript
const matchesSearch = (row: CourseRow, search: string): boolean => {
  if (!search) return true;

  const searchLower = search.toLowerCase();

  return (
    row.course.courseTitle.toLowerCase().includes(searchLower) ||
    row.program.programName.toLowerCase().includes(searchLower) ||
    row.course.levelName.toLowerCase().includes(searchLower) ||
    row.course.trainingTypeName.toLowerCase().includes(searchLower) ||
    row.course.courseId.toString().includes(searchLower)
  );
};
```

#### 8B.2 Update Filtered Courses Logic

Replace the current `filteredCourses` with multi-filter logic:

```typescript
const filteredCourses = flatCourses.filter((row) => {
  // Program filter (existing)
  const matchesProgram =
    selectedPrograms.length === 0 || selectedPrograms.includes(row.program.id);

  // Status filter (new)
  const matchesStatus =
    selectedStatuses.length === 0 || selectedStatuses.includes(row.status);

  // Text search (new)
  const matchesSearchText = matchesSearch(row, searchText);

  return matchesProgram && matchesStatus && matchesSearchText;
});
```

---

## Phase 8C: Build Filter UI Bar

**File**: `src/components/progress/StudentProgressView.tsx`

#### 8C.1 Add Filter Bar (above table)

Insert this between the header and the table:

```typescript
{/* Filter Bar */}
<div className="mb-4 flex items-center gap-2">
  {/* Text Search Input */}
  <Input
    placeholder="Filter courses..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="max-w-xs"
  />

  {/* Status Filter Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className="h-10">
        <ListFilter className="mr-2 h-4 w-4" />
        Status
        {selectedStatuses.length > 0 && (
          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {selectedStatuses.length}
          </span>
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-[200px]">
      <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Completed */}
      <DropdownMenuCheckboxItem
        checked={selectedStatuses.includes("Completed")}
        onCheckedChange={(checked) => {
          setSelectedStatuses(prev =>
            checked
              ? [...prev, "Completed"]
              : prev.filter(s => s !== "Completed")
          );
        }}
      >
        Completed
      </DropdownMenuCheckboxItem>

      {/* Incomplete */}
      <DropdownMenuCheckboxItem
        checked={selectedStatuses.includes("Incomplete")}
        onCheckedChange={(checked) => {
          setSelectedStatuses(prev =>
            checked
              ? [...prev, "Incomplete"]
              : prev.filter(s => s !== "Incomplete")
          );
        }}
      >
        Incomplete
      </DropdownMenuCheckboxItem>

      {/* Not Enrolled */}
      <DropdownMenuCheckboxItem
        checked={selectedStatuses.includes("Not Enrolled")}
        onCheckedChange={(checked) => {
          setSelectedStatuses(prev =>
            checked
              ? [...prev, "Not Enrolled"]
              : prev.filter(s => s !== "Not Enrolled")
          );
        }}
      >
        Not Enrolled
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Clear Filters Button (if any active) */}
  {(searchText || selectedStatuses.length > 0 || selectedPrograms.length > 0) && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setSearchText("");
        setSelectedStatuses([]);
        setSelectedPrograms([]);
      }}
      className="h-10"
    >
      <X className="mr-2 h-4 w-4" />
      Clear All
    </Button>
  )}
</div>
```

---

## Phase 8D: Update Empty State Messages

**File**: `src/components/progress/StudentProgressView.tsx`

#### 8D.1 Make Empty State Filter-Aware

Update the empty state in the table body:

```typescript
{filteredCourses.length === 0 ? (
  <TableRow>
    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
      {searchText || selectedStatuses.length > 0 || selectedPrograms.length > 0
        ? "No courses match your filters"
        : "No courses assigned"}
    </TableCell>
  </TableRow>
) : (
  // ... render rows
)}
```

---

## Filter Logic Flow

### Multi-Filter Combination (AND logic):

```
filteredCourses = ALL of:
  ✓ Matches program filter (if selectedPrograms not empty)
  AND
  ✓ Matches status filter (if selectedStatuses not empty)
  AND
  ✓ Matches search text (if searchText not empty)
```

### Example Scenarios:

**Scenario 1: Search for "CNC"**

- searchText = "cnc"
- Shows all courses with "CNC" in title/program/level/type

**Scenario 2: Filter by "Incomplete" status**

- selectedStatuses = ["Incomplete"]
- Shows only courses with Incomplete status

**Scenario 3: Combined filters**

- searchText = "sales"
- selectedStatuses = ["Incomplete"]
- selectedPrograms = ["prog_1"]
- Shows only Sales Training courses that are Incomplete

**Scenario 4: Clear all**

- All filters reset
- Shows all courses

---

## Updated UI Layout Structure

### After Phase 8:

```
Student Progress View
├── Header (Student Name)
├── Summary Stats (3 cards)
├── Program Filter Tags (existing from Phase 3)
├── Advanced Filter Bar (NEW)
│   ├── Text Search Input ("Filter courses...")
│   ├── Status Dropdown (with badge count)
│   └── "Clear All" button (if filters active)
├── Table (with 1px border)
│   ├── Table Header (7 columns)
│   └── Table Body (filtered course rows)
```

---

## Implementation Order for Phase 8

1. **Add state variables** (searchText, selectedStatuses)
2. **Add component imports** (Input, DropdownMenu, ListFilter icon)
3. **Create matchesSearch helper** (search across fields)
4. **Update filteredCourses logic** (multi-filter AND logic)
5. **Add Filter Bar UI** (Input + Status dropdown + Clear button)
6. **Update empty state** (filter-aware message)
7. **Test text search** (type and verify filtering)
8. **Test status filter** (select statuses, verify filtering)
9. **Test combined filters** (all three filters together)
10. **Verify styling** (borders, corners, spacing)

---

## Verification Steps for Phase 8

### Filter Bar Checks:

- [ ] Text input appears above table with placeholder "Filter courses..."
- [ ] Status dropdown button shows "Status" label with ListFilter icon
- [ ] Status dropdown opens on click showing 3 checkboxes
- [ ] "Clear All" button appears when any filter is active
- [ ] Filter count badge shows on Status button when statuses selected

### Text Search Checks:

- [ ] Typing in search box filters table in real-time
- [ ] Search matches course name (e.g., "CNC" finds "CNC Machining")
- [ ] Search matches program name (e.g., "My Program")
- [ ] Search matches level (e.g., "Advanced")
- [ ] Search matches type (e.g., "ILT")
- [ ] Search matches course ID (e.g., "116" finds course #116)
- [ ] Search is case-insensitive

### Status Filter Checks:

- [ ] Selecting "Completed" shows only completed courses
- [ ] Selecting "Incomplete" shows only incomplete courses
- [ ] Selecting "Not Enrolled" shows only not enrolled courses
- [ ] Multiple statuses can be selected (OR logic within status filter)
- [ ] Badge on button shows count of selected statuses
- [ ] Unchecking a status removes it from filter

### Combined Filter Checks:

- [ ] Program badges + text search work together
- [ ] Program badges + status filter work together
- [ ] All 3 filter types work together (AND logic)
- [ ] "Clear All" resets all filters (program, status, and search)
- [ ] Empty state shows "No courses match your filters" when filters active
- [ ] Empty state shows "No courses assigned" when no data and no filters

### Styling Checks:

- [ ] Filter bar appears above table
- [ ] Input field uses theme styling
- [ ] Status button uses outline variant
- [ ] Dropdown menu aligns properly
- [ ] All elements use sharp corners (border-radius: 0)
- [ ] Filter count badge uses primary color
- [ ] Spacing is consistent

---

## Estimated Additional Effort (Phase 8)

- **State setup**: 5 minutes
- **matchesSearch logic**: 10 minutes
- **Multi-filter logic**: 10 minutes
- **Filter Bar UI**: 30 minutes
- **Status dropdown**: 20 minutes
- **Clear All button**: 10 minutes
- **Testing & polish**: 20 minutes

**Total for Phase 8**: ~1.5 hours

**Combined Total (Phases 1-8)**: ~4.5 hours
