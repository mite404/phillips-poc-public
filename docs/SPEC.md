# Project Specification & Prompt Context

> **Last Updated:** 2025-12-10 (After PR-03.5)

## 📌 Global Context (Paste at start of every session)

**Project:** Phillips Education POC (Supervisor Program Builder)  
**Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, Bun  
**Key Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-router-dom` v7, `json-server`, `lucide-react` (icons)

**Architecture:**

- **Philosophy:** Stripped-down, HTML-focused components. Rapid prototyping of layout and functionality before adding complex UI libraries.
- **State Management:** Custom hooks (e.g., `useProgramBuilder`) for business logic; React hooks for component state.
- **Styling:** Pure Tailwind CSS utilities (no shadcn/ui for now—added later if needed).
- **Drag-and-Drop:** `@dnd-kit` for reordering; vanilla HTML/buttons for interactions.
- **Hybrid Data:** Read from Legacy API (`src/api/legacyRoutes.ts`), Write to Local JSON Server (`src/api/localRoutes.ts`).
- **Resilience:** If Legacy API fails/CORS, catch error and return data from `src/data/*.json`.

**Data Interfaces:**

```typescript
interface CourseCatalogItem {
  courseId: number;
  courseTitle: string;
  levelName: string; // "Basic" | "Advanced"
  trainingTypeName: string; // "ILT" | "eLearning"
  totalDays: number;
  hours: number | null;
  previewImageUrl: string | null;
  prices: { isFree: boolean; price?: number; currency?: string }[];
  skills?: { skillName: string }[];
}

interface SupervisorProgram {
  id: string; // UUID
  title: string;
  description: string;
  isPublished: boolean;
  courses: {
    sequenceOrder: number;
    courseId: number;
    cachedTitle?: string;
  }[];
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
- [x] Static mock data (`src/data/mockCourses.json`, `mockStudents.json`, `mockSchedules.json`)
- [x] Shadcn/ui component installation (Card, Badge, Button, Input, Skeleton, Sonner)

---

### ✅ PR-02: Supervisor Catalog (Left Column)

**Status:** Completed  
**Goal:** Implement the "Inventory" view where Supervisors search and select courses.

**Components Built:**

1.  ✅ `src/api/utils.ts`: Centralized fetch wrapper with base URLs
2.  ✅ `src/api/legacyRoutes.ts`: `getCatalog()` with automatic fallback to `mockCourses.json`
3.  ✅ `src/components/common/CourseCard.tsx`: Card showing Image, Title, Duration, Level badge, Training Type, Price/Free indicator
4.  ✅ `src/components/builder/CatalogColumn.tsx`: Search + Level Filter + Grid layout

**Functional Requirements:**

- [x] Fetch data on mount using `useEffect`
- [x] **Search:** Client-side filter by `courseTitle` (case-insensitive)
- [x] **Filter:** Button toggles for Level (All/Basic/Advanced)
- [x] **Interaction:** "Add to Program" button logs to console (placeholder for Context)
- [x] **Polish:** Skeleton loading states, error handling, results count

**Implementation Notes:**

- Uses Lucide React icons (`Search`, `Plus`)
- Phillips blue branding on Advanced level badges and active filter buttons
- Responsive grid: 1 column (mobile) → 2 columns (md) → 3 columns (lg)
- Training type badge shows ILT vs eLearning
- Duration logic: ILT shows days, eLearning shows hours or "Self-paced"

---

### ✅ PR-03/03.5: Program Builder UI Shell, Workbench Logic & UX Enhancements

**Status:** Completed  
**Goal:** Build the foundational UI layout with 2-column split-pane, implement workbench state management, add drag-and-drop reordering, and enhance UX with program descriptions and course detail modals.

**Components Built:**

1.  ✅ `src/hooks/useProgramBuilder.ts`: Custom hook managing all builder logic
    - State: `programTitle`, `programDescription`, `selectedCourses`, `searchQuery`, `activeFilters`, `filteredCourses`
    - Actions: `addCourse`, `removeCourse`, `reorderCourses`, `updateTitle`, `updateDescription`, `toggleFilter`, `setSearch`, `saveDraft`
    - Mock data: 6 realistic courses with types (ILT/Self-Paced) and levels (Basic/Advanced)
2.  ✅ `src/components/ProgramBuilder.tsx`: 2-column split-pane layout (60/40) with modals
    - **Left Column (Workbench):** Editable title, description textarea, drag-sortable course cards, Remove (✕) button, Save Draft button
    - **Right Column (Catalog):** Search input, filter toggles (Self-Paced, ILT, Advanced), clickable course listing with Add button
    - Integrated DndContext with closestCenter collision detection
    - Integrated SortableContext with verticalListSortingStrategy
    - Click handlers with `e.stopPropagation()` to prevent modal opening on action buttons
    - Renders CourseDetailModal when course is clicked
3.  ✅ `src/components/SortableCourseItem.tsx`: Wrapper component for drag-and-drop
    - Uses `useSortable` hook from dnd-kit
    - Renders GripVertical icon from lucide-react
    - Applies transform, transition, and drag attributes
    - Opacity feedback (50% while dragging)
4.  ✅ `src/components/common/CourseDetailModal.tsx`: Course information modal
    - Uses shadcn/ui Dialog components
    - Displays course title, code, level, type, and description
    - Simple close button in footer
5.  ✅ `src/components/PageContent.tsx`: Updated to render ProgramBuilder by default, with conditional rendering for saved program drafts
6.  ✅ `src/components/SidebarNav.tsx`: Navigation component with "Program Builder" menu item and saved programs list
7.  ✅ `src/App.tsx`: Added `currentView` state management and view routing

**Functional Requirements:**

- [x] **Layout:** Split-pane flexbox layout with left column (60%) and right column (40%)
- [x] **Program Title & Description:** Editable input and textarea for program metadata
- [x] **Workbench:** Display selected courses with metadata (type, level, code)
- [x] **Add Courses:** Click "Add" button to add courses from catalog (duplicate prevention)
- [x] **Remove Courses:** Click "✕" button to remove from selection (with stopPropagation)
- [x] **Reorder:** Drag course cards using GripVertical icon to reorder
- [x] **Search:** Text search filters courses by title (case-insensitive)
- [x] **Filter:** Toggle buttons for type (Self-Paced, ILT) and level (Advanced) with OR/AND logic
- [x] **Course Details Modal:** Click any course card to view details in shadcn/ui Dialog
- [x] **Styling:** Distinct blue styling (bg-blue-50, border-blue-200) for selected courses; cursor-pointer on clickable rows
- [x] **Save Draft:** Button action logs to console and shows alert (persistence to come in PR-04)
- [x] **Responsive:** Both columns independently scrollable, fill screen height minus header

**Architecture Notes:**

- **No Context API:** Used custom hook instead of React Context for simplicity at this stage
- **No shadcn/ui:** Pure Tailwind + vanilla HTML to keep components lightweight and fast to iterate
- **dnd-kit for DX:** Minimal configuration for drag-and-drop (PointerSensor, KeyboardSensor)
- **Mock Data in Hook:** Centralized course definitions make it easy to swap with API data later

**Next Steps (PR-05):**

- [ ] **Persistence:** Implement "Save Draft" to POST to `http://localhost:3001/custom_programs`
- [ ] **API Integration:** Replace mock courses with data from legacy API
- [ ] **Roster:** Build student assignment UI (when program is published)

**Prompt Strategy:**

> "PR-03 completed the full builder loop: search, add, reorder, and remove courses. The UI is clean and HTML-focused. Next, we'll persist the draft to json-server and integrate real course data from the legacy API."

---

### ⏭️ PR-05: Roster & Assignment (Right Column)

**Status:** Not Started  
**Goal:** The "Distribution" phase. Assigning programs to real users.

**Components to Build:**

1.  `src/components/builder/RosterColumn.tsx`: List of students with status indicators
2.  `src/components/common/EnrollmentModal.tsx`: The "Force Enroll" UI
3.  `src/api/legacyRoutes.ts`: Implement `getRoster()` and `getInventory(courseId)`

**Functional Requirements:**

- [ ] **Slide-in:** Sidebar should only be active/visible if `program.isPublished === true`
- [ ] **Data:** Load students from `mockStudents.json` (simulating Legacy API)
- [ ] **Visuals:** Status Badges (Green="Enrolled", Yellow="Pending", Gray="Unassigned")
- [ ] **Force Enroll:**
  - Click "Enroll" button on a student
  - Open Modal with class schedule options
  - Fetch Schedule for the _first_ course in the program via `getInventory(courseId)`
  - User selects a Date → Click Confirm → Update Local State to "Registered"

**Prompt Strategy:**

> "Time for PR-05. Let's build the Roster Sidebar. It needs to fetch students and display their status. Please also build the `EnrollmentModal` which takes a `courseId`, fetches the schedule inventory, and lets me select a class."

---

### ⏭️ PR-06: Student Experience (The Consumer)

**Status:** Not Started  
**Goal:** The view for "Liam" or "Ethan" to see what was assigned.

**Components to Build:**

1.  `src/components/student/StudentDashboard.tsx`: Main container
2.  `src/components/student/ActionCenter.tsx`: High-vis alerts for pending actions
3.  `src/components/student/Timeline.tsx`: Vertical progress view

**Functional Requirements:**

- [ ] **Context:** Mock the logged-in user as "Liam" (ID: 1511)
- [ ] **Fetch:** Get `assignments` from local DB where `learnerId === 1511`
- [ ] **Action Center:** If status is "Pending Selection," show a big "Book Now" card
- [ ] **Timeline:** Render the list of courses. Status = Locked until previous is done (visual only)

**Prompt Strategy:**

> "Let's switch personas for PR-06. Create the Student Dashboard. It needs to read the assignment we created in the previous step. Show an 'Action Center' at the top that prompts the user to book a date for their ILT course."

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

- `GET/POST /custom_programs` → Supervisor-created programs
- `GET/POST /assignments` → Program assignments to learners
- `GET/POST /enrollments` → Course enrollment records with selected class dates

**Local Server:** `http://localhost:3001`

---

## 📂 Current Directory Structure

```
/src
  /api
    utils.ts                    # ✅ Fetch wrapper (base URLs, error handling)
    legacyRoutes.ts            # ✅ getCatalog() with fallback
    localRoutes.ts             # ⏳ To be implemented in PR-05
  /components
    App.tsx                     # ✅ Main app with userType & currentView state
    PageContent.tsx            # ✅ Primary page renderer, shows ProgramBuilder or saved program
    SidebarNav.tsx             # ✅ Navigation with "Program Builder" button and saved programs list
    ProgramBuilder.tsx         # ✅ 2-column split-pane with workbench + catalog + drag-drop
    SortableCourseItem.tsx      # ✅ Wrapper for dnd-kit sortable items with GripVertical icon
    ProgramList.tsx            # ✅ Legacy program listing (from API)
    ProgramCard.tsx            # ✅ Legacy program card display
    /builder
      CatalogColumn.tsx        # ✅ Search + Filter + Course Grid
      WorkbenchColumn.tsx      # ⏳ To be implemented (extracted from ProgramBuilder if needed)
      RosterColumn.tsx         # ⏳ To be implemented in PR-05
    /student                   # ⏳ To be implemented in PR-06
      StudentDashboard.tsx
      ActionCenter.tsx
      Timeline.tsx
    /common
      CourseCard.tsx           # ✅ Course display card with badges
      EnrollmentModal.tsx      # ⏳ To be implemented in PR-05
      StatusBadge.tsx          # ⏳ To be implemented in PR-05
    /ui                        # ⏳ Shadcn/ui components (not used yet)
      badge.tsx
      button.tsx
      card.tsx
      input.tsx
      skeleton.tsx
      sonner.tsx
  /hooks
    useProgramBuilder.ts       # ✅ Custom hook managing builder state & actions
  /context
    ProgramContext.tsx         # ⏳ To be implemented in PR-05 (if needed)
  /data                        # ✅ Static fallback JSON files
    mockCourses.json
    mockStudents.json
    mockSchedules.json
  /types
    models.ts                  # ✅ TypeScript interfaces (LegacyProgram, CourseCatalogItem, SupervisorProgram)
```

**Key Files Added in PR-03/03.5:**

- `src/hooks/useProgramBuilder.ts`: Custom hook with all builder logic (state, filters, actions, description)
- `src/components/ProgramBuilder.tsx`: Core 2-column builder interface (workbench + catalog + modal)
- `src/components/SortableCourseItem.tsx`: Drag-and-drop wrapper component with grip icon
- `src/components/common/CourseDetailModal.tsx`: Course detail modal with shadcn/ui Dialog
- `src/components/PageContent.tsx`: Updated for routing between views
- `src/components/SidebarNav.tsx`: Navigation with currentView state
- `src/lib/utils.ts`: Utility function for className merging (cn helper)
- Removed legacy components: CatalogColumn.tsx, CourseCard.tsx, ProgramCard.tsx, ProgramList.tsx
