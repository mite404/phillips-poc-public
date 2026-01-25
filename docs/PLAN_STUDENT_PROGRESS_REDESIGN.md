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
