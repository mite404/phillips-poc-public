# Project Specification & Prompt Context

> **Last Updated:** 2025-12-10

## 📌 Global Context (Paste at start of every session)

**Project:** Phillips Education POC (Supervisor Program Builder)  
**Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Bun  
**Key Dependencies:** `@dnd-kit` (drag-drop), `react-router-dom` v7, `sonner` (toasts), `json-server`, `lucide-react` (icons)

**Architecture:**

- **Hybrid Data:** Read from Legacy API (`src/api/legacyRoutes.ts`), Write to Local JSON Server (`src/api/localRoutes.ts`).
- **Resilience:** If Legacy API fails/CORS, catch error and return data from `src/data/*.json`.
- **Styling:** Shadcn/ui components for interactives; Tailwind grid/flex for layout.
- **State:** React Context for the Builder session.

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

### 🚧 PR-03: Program Builder UI Shell & Navigation

**Status:** In Progress  
**Goal:** Build the foundational UI layout with 2-column split-pane and navigation state management.

**Components Built:**

1.  ✅ `src/components/ProgramBuilder.tsx`: 2-column split-pane layout (60/40)
    - Left Column: "My Program" workbench with editable title input and "Save Draft" button
    - Right Column: "Course Catalog" with search input and filter placeholder
2.  ✅ `src/components/PageContent.tsx`: Updated to render ProgramBuilder by default, with conditional rendering for saved program drafts
3.  ✅ `src/components/SidebarNav.tsx`: Navigation component with "Program Builder" menu item and saved programs list
4.  ✅ `src/App.tsx`: Added `currentView` state management and view routing

**Functional Requirements:**

- [x] **Layout:** Split-pane flexbox layout with left column (60%) and right column (40%)
- [x] **Default View:** ProgramBuilder displayed on login as "New Program"
- [x] **Navigation:** SidebarNav with Program Builder button and saved program links
- [x] **Saved Programs:** Conditional rendering for clicked saved programs (prog_101, prog_102, prog_103)
- [x] **Responsive:** Both columns independently scrollable, fill screen height minus header
- [x] **Polish:** Tailwind styling with border, padding, and spacing utilities

**Next Steps (PR-04):**

- [ ] **State:** Create `ProgramContext` to manage selected courses
- [ ] **Integration:** Wire Course Catalog (CatalogColumn) to right column
- [ ] **Reorder:** Use `@dnd-kit/sortable` for drag-and-drop course ordering
- [ ] **Save:** Implement "Save Draft" button to persist to json-server

**Prompt Strategy:**

> "PR-03 establishes the UI shell. The ProgramBuilder component is now ready. Next, we'll integrate the Course Catalog into the right column and implement state management for selected courses. Then we'll add drag-and-drop reordering and persistence."

---

### ⏭️ PR-04: Course Management & Drag-and-Drop

**Status:** Not Started  
**Goal:** Integrate Course Catalog into the builder, implement state management, and enable drag-and-drop reordering.

**Components to Build/Update:**

1.  `src/context/ProgramContext.tsx`: Store `selectedCourses[]` and `programMeta`
2.  `src/components/builder/WorkbenchColumn.tsx`: Drop zone with sortable course list
3.  `src/components/ProgramBuilder.tsx`: Wire up CatalogColumn to right column
4.  `src/api/localRoutes.ts`: Implement `createProgram()` and `saveDraft()` endpoints

**Functional Requirements:**

- [ ] **State:** Create Context Provider with ADD_COURSE, REMOVE_COURSE, REORDER_COURSE actions
- [ ] **Integration:** Render CatalogColumn in right column of ProgramBuilder
- [ ] **Add:** CatalogColumn "Add to Program" dispatches to context
- [ ] **Reorder:** Use `@dnd-kit/sortable` for drag-and-drop course ordering
- [ ] **Remove:** "X" button on each course in left column workbench
- [ ] **Stats:** Real-time calculation of "Total Duration" in footer
- [ ] **Save:** "Save Draft" button POSTs payload to `http://localhost:3001/custom_programs`

**Prompt Strategy:**

> "PR-04 wires up the builder. Create a ProgramContext to manage selected courses. Integrate the Course Catalog component into the right column. Add drag-and-drop reordering with dnd-kit. Finally, implement persistence to json-server."

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
    localRoutes.ts             # ⏳ To be implemented in PR-04
  /components
    App.tsx                     # ✅ Main app with userType & currentView state
    PageContent.tsx            # ✅ Primary page renderer, shows ProgramBuilder or saved program
    SidebarNav.tsx             # ✅ Navigation with "Program Builder" button and saved programs list
    ProgramBuilder.tsx         # ✅ 2-column split-pane UI (60/40 layout)
    ProgramList.tsx            # ✅ Legacy program listing (from API)
    ProgramCard.tsx            # ✅ Legacy program card display
    /builder
      CatalogColumn.tsx        # ✅ Search + Filter + Course Grid
      WorkbenchColumn.tsx      # ⏳ To be implemented in PR-04
      RosterColumn.tsx         # ⏳ To be implemented in PR-05
    /student                   # ⏳ To be implemented in PR-06
      StudentDashboard.tsx
      ActionCenter.tsx
      Timeline.tsx
    /common
      CourseCard.tsx           # ✅ Course display card with badges
      EnrollmentModal.tsx      # ⏳ To be implemented in PR-05
      StatusBadge.tsx          # ⏳ To be implemented in PR-05
    /ui                        # ✅ Shadcn/ui components
      badge.tsx
      button.tsx
      card.tsx
      input.tsx
      skeleton.tsx
      sonner.tsx
  /context
    ProgramContext.tsx         # ⏳ To be implemented in PR-04
  /data                        # ✅ Static fallback JSON files
    mockCourses.json
    mockStudents.json
    mockSchedules.json
  /types
    models.ts                  # ✅ TypeScript interfaces (LegacyProgram, CourseCatalogItem, SupervisorProgram)
```

**Key Files Added in PR-03:**

- `src/components/ProgramBuilder.tsx`: Core 2-column builder interface
- `src/components/PageContent.tsx`: Updated for routing between views
- `src/components/SidebarNav.tsx`: Navigation with currentView state
