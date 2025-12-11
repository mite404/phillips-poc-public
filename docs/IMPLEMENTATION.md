# Implementation Progress Tracker

> **Last Updated:** 2025-12-10 (Updated after PR-03 & PR-03.5)

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

### Architecture Decisions:

- **Custom Hook over Context:** Used `useProgramBuilder` for simplicity and testability
- **Pure Tailwind + HTML:** No shadcn/ui components except Dialog for modal
- **dnd-kit Integration:** Minimal config (PointerSensor, KeyboardSensor)
- **Mock Data in Hook:** Centralized course definitions for easy API swap later
- **shadcn/ui Dialog:** Single shadcn component for course detail modal
- **Event Handling:** Proper `stopPropagation()` to prevent modal on action buttons

---

## PR-03.5: UX Enhancements (Program Description & Course Detail Modal)

**Status:** ✅ **COMPLETE**

### Completed:

- [x] Add `programDescription` state to `useProgramBuilder`
- [x] Add `updateDescription(text)` action to hook
- [x] Add textarea in ProgramBuilder header for description
  - [x] Styling: transparent bg, no resize, no border except on focus
  - [x] Positioned below title input
- [x] Create `CourseDetailModal` component using shadcn/ui Dialog
  - [x] Display course code, level, type, and description
  - [x] Simple close button
  - [x] Grid layout for metadata
- [x] Wire up modal interactions in ProgramBuilder
  - [x] Add `activeCourse` state for modal trigger
  - [x] Make course rows clickable with `onClick={() => setActiveCourse(course)}`
  - [x] Add `e.stopPropagation()` to "Add" and "Remove" buttons
  - [x] Add `cursor-pointer` styling to clickable rows
  - [x] Render modal at bottom of component
- [x] Install shadcn/ui infrastructure
  - [x] Create `src/lib/utils.ts` with `cn()` helper
  - [x] Install Dialog component via shadcn CLI
  - [x] Install clsx and tailwind-merge dependencies
- [x] Add path alias resolution
  - [x] Configure `@/` alias in vite.config.ts
- [x] Clean up legacy components
  - [x] Removed CatalogColumn.tsx, CourseCard.tsx, ProgramCard.tsx, ProgramList.tsx

---

## PR-04: Persistence & API Integration

**Status:** ✅ **COMPLETE**

### Completed:

- [x] Implement "Save Draft" to POST to `http://localhost:3001/programs`
  - [x] Create `src/api/localRoutes.ts` with `saveProgram()` endpoint
  - [x] Wire "Save Draft" button to make actual API call
  - [x] Add error handling and success toast notifications (using sonner)
- [x] Replace mock courses with data from legacy API
  - [x] Update `useProgramBuilder` to fetch from `src/api/legacyRoutes.ts`
  - [x] Implement fallback to Courses.json if API fails
  - [x] Add loading/error states during fetch
- [x] Calculate and display "Total Duration" in footer
  - [x] Updated Course interface to extend CourseCatalogItem
  - [x] Sum courses by type (ILT days vs eLearning hours)
- [x] Implement lightweight data model
  - [x] Transform UI state (Rich Course objects) to lightweight payload (courseSequence: number[])
  - [x] Store only course IDs in db.json, not full course objects
  - [x] Generate UUID for program ID
  - [x] Include program metadata (title, description, tags, supervisorId, createdAt)
- [x] Install and configure sonner for toast notifications
- [x] Update CourseDetailModal to use correct Course properties from API
- [x] Fix TypeScript errors and build successfully

### Architecture Notes:

- **Hybrid Data Model:** READ from Legacy API (getCatalog), WRITE to local json-server
- **Lightweight Persistence:** Only store course IDs (courseSequence: number[]), not full objects
- **Data Transformation:** UI maintains rich Course objects, save operation extracts IDs only
- **Fallback Strategy:** Automatically falls back to Courses.json if Legacy API fails
- **Toast Notifications:** Using sonner for user feedback (loading, success, error states)

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

**Active PR:** PR-04 Completed ✅ → PR-05 Ready to Start

**Completed in PR-04:**

- Hybrid data architecture fully implemented (read from Legacy API, write to local json-server)
- Course catalog fetches from Phillips X PIMS staging API with fallback to Courses.json
- Lightweight persistence model (storing only course IDs, not full objects)
- Real-time duration calculation based on selected courses
- Toast notifications for save operations (loading, success, error)
- Full TypeScript type safety with Course extending CourseCatalogItem
- Loading states with skeleton UI during API fetch
- Data transformation logic (rich UI objects → lightweight payload)

**Immediate Next Steps (PR-05):**

1. Create `src/components/builder/RosterColumn.tsx` for student assignment
2. Build `src/components/common/EnrollmentModal.tsx` for class selection
3. Implement `getRoster()` and `getInventory(courseId)` in legacyRoutes
4. Add status badge system (Enrolled/Pending/Unassigned)
5. Test roster and assignment flow end-to-end

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
