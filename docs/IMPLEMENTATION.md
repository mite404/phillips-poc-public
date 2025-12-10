# Implementation Progress Tracker

> **Last Updated:** 2025-12-10

This document tracks the completion status of each PR and its associated tasks.

---

## PR-01: Infrastructure

**Status:** ✅ **COMPLETE**

- [x] Project Scaffold (Vite + Bun)
- [x] Tailwind v4 + Phillips brand colors
- [x] JSON Server Setup (`db.json` with custom_programs, assignments, enrollments)
- [x] Static mock data (`src/data/mockCourses.json`, `mockStudents.json`, `mockSchedules.json`)
- [x] Shadcn/ui component installation (Card, Badge, Button, Input, Skeleton, Sonner)

---

## PR-02: Supervisor Catalog (Course Grid & Search)

**Status:** ✅ **COMPLETE**

- [x] `src/api/utils.ts`: Fetch wrapper with base URLs and error handling
- [x] `src/api/legacyRoutes.ts`: `getCatalog()` with automatic fallback to `mockCourses.json`
- [x] `src/components/common/CourseCard.tsx`: Card component (Image, Title, Duration, Level, Training Type, Price)
- [x] `src/components/builder/CatalogColumn.tsx`: Search + Level Filter + Responsive Grid
- [x] Client-side search filtering (case-insensitive courseTitle)
- [x] Level filter buttons (All/Basic/Advanced)
- [x] Skeleton loading states and error handling
- [x] Responsive grid layout (1 → 2 → 3 columns)

---

## PR-03: Program Builder UI Shell & Navigation

**Status:** 🚧 **IN PROGRESS**

### Completed:

- [x] `src/components/ProgramBuilder.tsx`: 2-column split-pane layout (60/40)
  - [x] Left Column: "My Program" with editable title input
  - [x] Left Column Footer: "Save Draft" button (placeholder)
  - [x] Right Column: "Course Catalog" header with search placeholder
  - [x] Right Column: Filter buttons placeholder
  - [x] Both columns: Independent scroll with flexbox layout
- [x] `src/components/PageContent.tsx`: 
  - [x] ProgramBuilder rendered as default view
  - [x] Conditional rendering for saved program drafts
  - [x] "Back to Auth portal" button at bottom
- [x] `src/components/SidebarNav.tsx`:
  - [x] "Program Builder" navigation button
  - [x] Saved programs list (Q3 Safety, Advanced Milling, New Hire Onboarding)
  - [x] Proper styling and hover states
  - [x] Text wrapping fix with `whitespace-nowrap`
- [x] `src/App.tsx`:
  - [x] `currentView` state management
  - [x] View routing to SidebarNav and PageContent
  - [x] Default view set to "builder"

### Pending:

- [ ] Integrate CatalogColumn into right column
- [ ] Wire "Save Draft" button functionality
- [ ] Create ProgramContext for state management

---

## PR-04: Course Management & Drag-and-Drop

**Status:** ⏳ **NOT STARTED**

### Tasks:

- [ ] Create `src/context/ProgramContext.tsx`
  - [ ] State: `selectedCourses[]`, `programMeta`
  - [ ] Actions: ADD_COURSE, REMOVE_COURSE, REORDER_COURSE
- [ ] Create `src/components/builder/WorkbenchColumn.tsx`
  - [ ] Drop zone for selected courses
  - [ ] Course list display with remove buttons
- [ ] Update `src/components/ProgramBuilder.tsx`
  - [ ] Replace right column placeholder with CatalogColumn
- [ ] Create `src/api/localRoutes.ts`
  - [ ] `createProgram()` POST endpoint
  - [ ] `saveDraft()` POST endpoint
- [ ] Implement drag-and-drop with `@dnd-kit/sortable`
- [ ] Calculate and display "Total Duration" in footer

---

## PR-05: Roster & Assignment

**Status:** ⏳ **NOT STARTED**

### Tasks:

- [ ] Create `src/components/builder/RosterColumn.tsx`
  - [ ] Fetch students from mockStudents.json
  - [ ] Display student list with status badges
- [ ] Create `src/components/common/EnrollmentModal.tsx`
  - [ ] Select class schedule for first course
  - [ ] Confirm enrollment
- [ ] Extend `src/api/legacyRoutes.ts`
  - [ ] `getRoster()` endpoint
  - [ ] `getInventory(courseId)` endpoint
- [ ] Implement status badge system (Enrolled/Pending/Unassigned)

---

## PR-06: Student Experience

**Status:** ⏳ **NOT STARTED**

### Tasks:

- [ ] Create `src/components/student/StudentDashboard.tsx`
  - [ ] Main container for student view
- [ ] Create `src/components/student/ActionCenter.tsx`
  - [ ] High-visibility alerts for pending actions
  - [ ] "Book Now" card for class selection
- [ ] Create `src/components/student/Timeline.tsx`
  - [ ] Vertical progress timeline
  - [ ] Course status display (Locked/Active/Complete)
- [ ] Implement student-specific data fetching
  - [ ] Mock logged-in user (ID: 1511)
  - [ ] Fetch assignments from local DB

---

## 🎯 Current Sprint Focus

**Active PR:** PR-03 → PR-04 Transition

**Immediate Next Steps:**

1. Complete PR-03: Ensure all UI placeholders are in place and properly styled
2. Begin PR-04: Create ProgramContext for state management
3. Wire up CatalogColumn to the right column of ProgramBuilder
4. Implement drag-and-drop reordering with dnd-kit
5. Add persistence to json-server

---

## 📝 Notes

- **Architecture Decision:** Hybrid data model (read from Legacy API, write to local json-server)
- **State Management:** React Context for Builder session (no Redux/Zustand needed yet)
- **Styling:** Tailwind utilities + shadcn/ui components + Phillips brand colors
- **Testing:** Manual testing via Vite dev server + json-server running concurrently

---

## 🔄 Synchronization Notes

This document is kept in sync with `SPEC.md`. Both documents reflect the **Code as Source of Truth**:

- When a PR is completed, both SPEC.md (PR status) and IMPLEMENTATION.md (task checklist) are updated
- Component descriptions are derived from actual file contents
- Type definitions match `src/types/models.ts`
- API routes match implementations in `src/api/` files
