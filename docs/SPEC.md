# Project Specification & Prompt Context

> **Last Updated:** 2025-12-15  
> **Project Status:** ✅ COMPLETE (v1.0 POC) + Vercel Ready - All Features + Production Deployment + Network-First Resilience

## 📌 Global Context (Paste at start of every session)

**Project:** Phillips Education POC (Supervisor Program Builder)  
**Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, Bun  
**Key Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-router-dom` v7, `json-server`, `lucide-react` (icons), `sonner` (toasts), `shadcn/ui` (dialogs, accordion, progress)

**Architecture:**

- **Philosophy:** Stripped-down, HTML-focused components. Rapid prototyping of layout and functionality before adding complex UI libraries.
- **State Management:** Custom hooks (e.g., `useProgramBuilder`) for business logic; React hooks for component state.
- **Styling:** Pure Tailwind CSS utilities + shadcn/ui components + Phillips brand colors.
- **Drag-and-Drop:** `@dnd-kit` for reordering; vanilla HTML/buttons for interactions.
- **Hybrid Data:** Read from Legacy API (`src/api/legacyRoutes.ts`), Write to Local JSON Server (`src/api/localRoutes.ts`).
- **Resilience:** If Legacy API fails/CORS, catch error and return data from `src/data/*.json`.

**Data Interfaces:**

```typescript
interface CourseCatalogItem {
  courseId: number;
  courseTitle: string;
  levelName: string; // "Basic", "Advanced"
  trainingTypeName: string; // "ILT", "eLearning"
  totalDays: number;
  hours: number | null;
  previewImageUrl: string | null;
  prices: { isFree: boolean; price?: number; currency?: string }[];
  skills?: { skillName: string }[];
}

interface SupervisorProgram {
  id: string; // UUID
  supervisorId: string;
  programName: string;
  description: string;
  tags: string[];
  courseSequence: number[]; // Lightweight: IDs only, not full objects
  published: boolean;
  createdAt: string;
}

interface LearnerProfile {
  learner_Data_Id: number;
  learnerId: string; // GUID
  learnerName: string;
  emailId: string;
  location: string;
  status: "Active" | "Inactive";
  currentEnrollment: { productName: string; learnerStatusTag: string } | null;
}

interface ClassSchedule {
  classId: number;
  location: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  seats: number;
  type: "ILT" | "Online";
}

interface CourseInventory {
  courseId: number;
  classes: ClassSchedule[];
}

interface ProgramAssignment {
  id: string; // UUID
  learnerId: string; // GUID
  programId: string; // UUID
  assignedDate: string; // ISO date
  status: "Pending" | "Registered";
}

interface CourseEnrollment {
  id: string; // UUID
  learnerId: string; // GUID
  programId: string; // UUID
  courseId: number;
  classId: number;
  enrolledDate: string; // ISO date
}
```

---

## 📅 Sprint PRs (Vertical Slices)

### ✅ PR-01: Infrastructure

**Status:** Completed  
**Scope:** Scaffold, Tailwind v4 config, JSON Server, Static Data generation.

**Completed:**

- [x] Project Scaffold (Vite + Bun)
- [x] Tailwind v4 + Phillips brand colors
- [x] JSON Server Setup (`db.json` with custom_programs, assignments, enrollments)
- [x] Static mock data (`src/data/Courses.json`, `Students.json`, `Schedules.json`)
- [x] Shadcn/ui component installation (Card, Badge, Button, Input, Skeleton, Sonner, Progress, Accordion)

---

### ✅ PR-02: Supervisor Catalog (Left Column)

**Status:** Completed  
**Goal:** Implement the "Inventory" view where Supervisors search and select courses.

**Completed:**

- [x] `src/api/utils.ts`: Centralized fetch wrapper with base URLs
- [x] `src/api/legacyRoutes.ts`: `getCatalog()` with automatic fallback to `Courses.json`
- [x] `src/components/common/CourseCard.tsx`: Card showing Image, Title, Duration, Level badge, Training Type, Price/Free indicator
- [x] `src/components/builder/CatalogColumn.tsx`: Search + Level Filter + Grid layout
- [x] Client-side search and filtering
- [x] Skeleton loading states and error handling

---

### ✅ PR-03/03.5: Program Builder UI Shell, Workbench Logic & UX Enhancements

**Status:** Completed  
**Goal:** Build the foundational UI layout with 2-column split-pane, implement workbench state management, add drag-and-drop reordering.

**Completed:**

- [x] `src/hooks/useProgramBuilder.ts`: Custom hook managing all builder logic
- [x] `src/components/ProgramBuilder.tsx`: 2-column split-pane layout (60/40) with modals
- [x] `src/components/SortableCourseItem.tsx`: Wrapper component for drag-and-drop
- [x] `src/components/common/CourseDetailModal.tsx`: Course information modal
- [x] `src/components/PageContent.tsx`: View routing logic
- [x] `src/components/SidebarNav.tsx`: Navigation component with saved programs list
- [x] Drag-and-drop course reordering with dnd-kit
- [x] Editable program title and description
- [x] Total duration calculation and display
- [x] Search and filter functionality for course catalog

---

### ✅ PR-04: Persistence & API Integration

**Status:** Completed  
**Goal:** Implement hybrid data model—read courses from Legacy API, write lightweight programs to Local JSON Server.

**Completed:**

- [x] `src/api/localRoutes.ts`: `saveProgram()` function to POST to json-server
- [x] `src/hooks/useProgramBuilder.ts`: Refactored to fetch from Legacy API with fallback
- [x] Real API data integration with loading states
- [x] Lightweight persistence (store only course IDs)
- [x] UUID generation for program IDs
- [x] Sonner toast notifications for user feedback
- [x] Data transformation on save (rich objects → lightweight IDs)

---

### ✅ PR-05: Program Manager & Enrollment

**Status:** Completed  
**Goal:** Read saved programs, hydrate course data, and enable student enrollment.

**Completed:**

- [x] `src/components/ProgramManager.tsx`: Program viewer with hydration logic
- [x] `src/components/RosterList.tsx`: Student roster with assignment/enrollment UI
- [x] `src/components/common/EnrollmentModal.tsx`: Class selection modal
- [x] `src/api/localRoutes.ts`: Extended with `getProgramById`, `assignProgram`, `enrollStudent`, `updateProgram`
- [x] `src/api/legacyRoutes.ts`: Implemented `getRoster()` and `getInventory()`
- [x] Three-state student status system (Unassigned → Pending → Registered)
- [x] Parallel data fetching for performance
- [x] Course hydration pattern (IDs → full objects)

---

### ✅ PR-06: Student Experience (The Consumer)

**Status:** Completed  
**Goal:** Student view to see assigned programs and book classes.

**Completed:**

- [x] `src/components/student/StudentDashboard.tsx`: Two-column dashboard with Accordion UI
- [x] `src/components/common/CourseDetailModal.tsx`: Updated with optional "Book Class" button
- [x] `src/components/SidebarNav.tsx`: Updated with userType prop for conditional navigation
- [x] Two-step enrollment flow (Course detail → Book class → Enrollment modal)
- [x] Status badges for student enrollment tracking
- [x] Visual feedback for enrolled vs. pending courses

---

### ✅ PR-07: Student Progress Navigation

**Status:** Completed  
**Goal:** Expose the student roster in the Global Sidebar and create the route structure.

**Completed:**

- [x] `src/components/SidebarNav.tsx`: Student progress navigation section
- [x] `src/components/PageContent.tsx`: Route handling for student progress views
- [x] Student roster fetching with fallback
- [x] Click navigation to student progress dashboards

---

### ✅ PR-08: Progress Detail View

**Status:** Completed  
**Goal:** The "At A Glance" Dashboard for a specific student showing program progress.

**Completed:**

- [x] `src/components/progress/StudentProgressView.tsx`: Main progress dashboard
- [x] `src/components/progress/ProgramProgressCard.tsx`: Individual program progress card
- [x] Parallel data fetching and hydration
- [x] Progress percentage calculation with visual progress bars
- [x] Status badges (Completed/Incomplete/Not Enrolled) with color coding
- [x] Interactive demo mode for showcasing progress tracking
- [x] Loading, error, and empty states

---

### ✅ PR-09: Student Polish (Bug Fixes & UI)

**Status:** Completed  
**Goal:** Fix missing "Book Class" button and standardize modal button styling.

**Completed:**

- [x] Fixed "Book Class" button visibility in StudentDashboard
- [x] Updated `handleCourseClick` to properly pass `programId` parameter
- [x] Fixed `onBookClick` prop logic in CourseDetailModal
- [x] Standardized button styling across all modals (CourseDetailModal, EnrollmentModal)
- [x] Applied consistent gray outline button theme
- [x] Verified two-step enrollment flow works correctly

**Button Style Standard:**

```
bg-gray-100! text-slate-700! border-slate-300 outline border-2 outline-gray-400 px-4 py-2 rounded hover:bg-slate-200! hover:border-slate-400
```

**Student Workflow Flow:**
Click Course → Detail Modal Opens → "Book Class" Button Visible (ILT courses only) → Click "Book Class" → Detail Modal Closes → Enrollment Modal Opens with Schedule Selection ✅

---

### ✅ PR-10: Supervisor Polish (Final UX)

**Status:** Completed  
**Goal:** Apply final UI polish to supervisor views for production-ready appearance.

**Completed:**

- [x] **ProgramBuilder.tsx - Catalog Filter Styles:**
  - [x] Active state: `!bg-gray-100 !text-slate-900 border-2 border-slate-300 font-bold shadow-sm`
  - [x] Inactive state: `bg-white text-slate-500 border border-slate-200 hover:bg-slate-50`
  - [x] Improved contrast and visibility for active filters
- [x] **ProgramManager.tsx - Enhanced Interactivity:**
  - [x] Added "Tags included in Program:" label for context
  - [x] Made course cards fully clickable with `onClick` handlers
  - [x] Added `cursor-pointer hover:bg-slate-50 transition-colors` styling
  - [x] Integrated `CourseDetailModal` for course details viewing
  - [x] Added `activeCourse` state management
- [x] **ProgramProgressCard.tsx - Catalog Number Alignment:**
  - [x] Centered catalog number between course title and status badge
  - [x] Right-aligned with fixed width for flush vertical alignment
  - [x] Created even spacing with proper flexbox layout

---

### ✅ PR-11: Batch Actions & Global Headers (Final Polish)

**Status:** Completed  
**Goal:** Complete the UI polish with batch student selection, global headers, and centered action buttons.

**Completed:**

- [x] **ProgramBuilder.tsx - Page Header:**
  - [x] Added "Create Custom Program" header above 2-column layout
  - [x] Styled as `text-3xl font-bold text-slate-800 mb-6` (between h2 and app header)
  - [x] Removed "Publish Program" button from builder (moved to manager)

- [x] **ProgramBuilder.tsx - Global Publish Button:**
  - [x] Moved "Publish Program" button to bottom center of page (outside columns)
  - [x] Styled with `bg-phillips-blue text-white shadow-lg` for visibility
  - [x] Button always visible for demo purposes (doesn't disappear after publishing)
  - [x] Shows "✓ Published" badge next to button when program is published

- [x] **RosterList.tsx - Batch Student Selection:**
  - [x] Added checkbox to the left of every student row (all students, not just unassigned)
  - [x] Added "Select All" checkbox in Student Roster header
  - [x] Checkboxes enabled for all student statuses (Unassigned, Pending, Registered)
  - [x] Track `selectedStudentIds` state array for batch operations

- [x] **RosterList.tsx - Batch Invite Button:**
  - [x] Added "Invite Selected (X)" button to Student Roster header
  - [x] Button shows count of selected students
  - [x] Button only appears when at least one student is selected
  - [x] Clicking button triggers batch invite (assignProgram for each selected student)
  - [x] Toast notification: "Sent invites to X students"
  - [x] Clears selection after successful batch invite

- [x] **RosterList.tsx - Uniform Student Cards:**
  - [x] All student cards now display uniform layout across all programs
  - [x] Checkboxes on left side (for all students, regardless of status)
  - [x] Student info in center (name, email, location)
  - [x] Status badges on right (Pending/Registered) OR Assign button (for unassigned)
  - [x] Status badges styled with color coding (yellow for Pending, green for Registered)

- [x] **ProgramManager.tsx - Publish Button in Saved Programs:**
  - [x] Added "Publish Program" button at bottom center of saved program view
  - [x] Button only shows when `published: false`
  - [x] Shows "✓ Published" badge when `published: true`
  - [x] Button styled with `bg-phillips-blue text-white hover:bg-blue-700`
  - [x] Implements `handlePublishProgram` function that updates program status in database

- [x] **SidebarNav.tsx - Dynamic Program Loading:**
  - [x] Updated to dynamically fetch saved programs from API
  - [x] Shows "DRAFT" badge on unpublished programs
  - [x] Loads all saved programs with their published status
  - [x] Programs list updates when navigating between views

**Implementation Notes:**

- **Batch Invite Logic** (RosterList.tsx:123-156): Loops through `selectedStudentIds` and calls `localApi.assignProgram()` for each, then reloads assignments and clears selection.
- **Global Publish Button** (ProgramManager.tsx:195-212): Button positioned at bottom center with flex layout, calls `handlePublishProgram()` which uses `localApi.updateProgram()` to set `published: true`.
- **Uniform Student Cards** (RosterList.tsx:226-267): Removed conditional checkbox rendering; all students show checkboxes. Status badges and Assign buttons positioned consistently on the right.
- **Dynamic Sidebar** (SidebarNav.tsx:18-33): Uses `useEffect` to fetch programs on mount, displays "DRAFT" badge for unpublished programs using `!program.published` check.

---

### ✅ PR-15: Resilient Persistence Layer

**Status:** Completed  
**Goal:** Implement network-first, localStorage-fallback architecture for Vercel deployment where json-server is unavailable.

**Completed:**

- [x] **Created `src/data/seedData.ts`**
  - [x] Single source of truth for initial database state
  - [x] Mirrors complete structure from `db.json` (programs, program_registrations, enrollments)
  - [x] Contains 7 demo programs with full course sequences
  - [x] Contains 12 program assignments and 6 enrollments for demo purposes
  - [x] Exports `INITIAL_DB` and `LocalDB` TypeScript interface

- [x] **Created `src/api/storageUtils.ts`**
  - [x] `initializeStorage()`: Auto-seeds localStorage with INITIAL_DB on first visit
  - [x] `readDB()`: Retrieves DB from localStorage with validation and fallback to INITIAL_DB
  - [x] `writeDB(db)`: Persists to localStorage with quota error handling
  - [x] `delay(ms)`: Simulates 300ms network latency for UX consistency
  - [x] `clearStorage()`: Debug utility to reset to seed state
  - [x] SSR-safe with `typeof window` checks

- [x] **Refactored `src/api/localRoutes.ts` (All 8 methods)**
  - [x] Implemented network-first, localStorage-fallback pattern for:
    - [x] `getAllPrograms()` - Fetch programs with fallback
    - [x] `getProgramById()` - Fetch single program with fallback
    - [x] `saveProgram()` - Save new program with fallback
    - [x] `updateProgram()` - Update existing program with fallback
    - [x] `getAssignments()` - Fetch all assignments with fallback
    - [x] `assignProgram()` - Create new assignment with fallback
    - [x] `getEnrollments()` - Fetch all enrollments with fallback
    - [x] `enrollStudent()` - Create new enrollment with fallback
  - [x] Uses `import.meta.env.PROD` to detect production mode
  - [x] Development: Tries json-server first, falls back to localStorage
  - [x] Production (Vercel): Skips network entirely, uses localStorage only
  - [x] Proper error handling with console warnings for fallback state

- [x] **Deleted `src/data/mockData.ts`**
  - [x] Replaced by `seedData.ts` to prevent data duplication
  - [x] Ensures single source of truth for demo data

- [x] **Production-Ready Deployment**
  - [x] No localhost API calls in production mode
  - [x] Automatic seed data seeding on first Vercel load
  - [x] Graceful degradation when localStorage quota exceeded
  - [x] 300ms delay for UX consistency between dev and production

---

### ✅ PR-16: Fix Student Progress View (Vercel Deployment)

**Status:** Completed  
**Goal:** Fix CORS errors on Vercel by replacing hardcoded fetch() with localStorage-backed API.

**Completed:**

- [x] **Identified Root Cause**
  - [x] `StudentProgressView.tsx` had hardcoded `fetch("http://localhost:3001/programs")` (lines 118-122)
  - [x] Bypassed the PR-15 localStorage fallback infrastructure
  - [x] Caused CORS errors on Vercel: "Access to fetch at 'http://localhost:3001/programs' from origin 'https://phillips-poc-public.vercel.app' has been blocked by CORS"

- [x] **Implemented Fix**
  - [x] Replaced direct fetch helper with `localApi.getAllPrograms()` call
  - [x] Single-line change leveraged existing infrastructure
  - [x] Now uses network-first, localStorage-fallback pattern from PR-15

- [x] **Verified Production Behavior**
  - [x] No CORS errors on Vercel deployment
  - [x] Student progress loads successfully on production
  - [x] Works in both development and production modes
  - [x] No breaking changes to existing functionality
  - [x] Linting and build passes

---

## 🛠️ Data Dictionary (for reference)

**Legacy API Base URL:**

```
https://phillipsx-pims-stage.azurewebsites.net/api
```

**Legacy API Endpoints:**

- `GET /Course/GetAllPartialValue` → Returns `{ result: CourseCatalogItem[] }`
- `GET /Learner/GetAllPartialValue` → Returns `{ result: LearnerProfile[] }`
- `GET /Class/Machinist/Schedules` → Returns class inventory with dates/locations

**Local JSON-Server Endpoints:**

- `GET/POST /programs` → Supervisor-created programs (now with updateProgram support)
- `GET/POST /program_registrations` → Program assignments to learners
- `GET/POST /enrollments` → Course enrollment records with selected class dates

**Local Server:** `http://localhost:3001`

---

## 📂 Current Directory Structure

```
/src
  /api
    utils.ts                    # ✅ Fetch wrapper (base URLs, error handling)
    legacyRoutes.ts            # ✅ getCatalog(), getRoster(), getInventory() with fallbacks
    localRoutes.ts             # ✅ saveProgram(), getProgramById(), updateProgram(), assignProgram(), enrollStudent()
  /components
    App.tsx                     # ✅ Main app with userType & currentView state
    PageContent.tsx            # ✅ Primary page renderer, routes to ProgramBuilder or ProgramManager
    SidebarNav.tsx             # ✅ Navigation with dynamic program loading and DRAFT badges
    ProgramBuilder.tsx         # ✅ 2-column split-pane builder with "Create Custom Program" header
    ProgramManager.tsx         # ✅ Program viewer with Publish button at bottom center
    RosterList.tsx             # ✅ Student roster with batch selection and invite functionality
    SortableCourseItem.tsx      # ✅ Wrapper for dnd-kit sortable items with GripVertical icon
    /student
      StudentDashboard.tsx     # ✅ Two-column dashboard with accordion UI and Book Class button
    /progress
      StudentProgressView.tsx  # ✅ Student progress dashboard with data hydration
      ProgramProgressCard.tsx  # ✅ Program progress card with interactive status badges
    /common
      CourseDetailModal.tsx    # ✅ Course detail modal with shadcn/ui Dialog and Book Class button
      EnrollmentModal.tsx      # ✅ Class selection modal (used by RosterList and StudentDashboard)
    /ui                        # ✅ Shadcn/ui components
      dialog.tsx
      skeleton.tsx
      progress.tsx
      accordion.tsx
  /hooks
    useProgramBuilder.ts       # ✅ Custom hook managing builder state & actions with saveProgram support
  /context
    ProgramContext.tsx         # ⏳ To be implemented if needed for larger scale
  /data                        # ✅ Static fallback JSON files
    Courses.json               # Fallback for course catalog
    Students.json              # Fallback for student roster
    Schedules.json             # Fallback for class schedules
  /types
    models.ts                  # ✅ TypeScript interfaces (all data models)
```

---

## 🎯 Feature Completion Summary

**v1.0 POC - All Features Complete**

### Supervisor Workflows

- ✅ Search and filter course catalog
- ✅ Build custom programs with drag-and-drop
- ✅ Publish programs to make them available for assignment
- ✅ View and manage student roster
- ✅ Batch assign students to programs (via "Invite Selected")
- ✅ Force enroll students in specific classes
- ✅ Track student progress across programs

### Student Workflows

- ✅ View assigned programs
- ✅ View course details for courses in programs
- ✅ Book classes for ILT courses
- ✅ See enrollment status (Pending/Registered)
- ✅ View progress across assigned programs

### UI/UX Polish (v1.0)

- ✅ Consistent button styling across all modals
- ✅ Dynamic sidebar with program list and DRAFT badges
- ✅ Uniform student roster cards with batch selection
- ✅ Global headers for major sections
- ✅ Centered action buttons for key flows
- ✅ Color-coded status badges
- ✅ Responsive layouts with proper scrolling
- ✅ Toast notifications for all key actions

---

## 📝 Technical Notes

- **Architecture:** Hybrid data model (read from Legacy API, write to local json-server)
- **State Management:** Custom hooks for business logic, React hooks for component state
- **Styling:** Tailwind utilities + shadcn/ui components + Phillips brand colors
- **Data Transformation:** Rich Course objects in UI, lightweight IDs in database
- **Resilience:** Automatic fallback to JSON files if Legacy API fails
- **Demo Features:** Interactive status toggling in progress cards, always-visible publish button for showcasing
- **Batch Operations:** Efficient looping for batch invites with proper state management
