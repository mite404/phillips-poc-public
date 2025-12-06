# Project Specification & Prompt Context

> **Last Updated:** 2025-12-05

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

### 🚧 PR-03: The Workbench (Center Column)

**Status:** Not Started  
**Goal:** The "Canvas" where the Program is assembled and saved.

**Components to Build:**

1.  `src/context/ProgramContext.tsx`: Store `selectedCourses[]` and `programMeta`
2.  `src/components/builder/WorkbenchColumn.tsx`: The drop zone with sortable course list
3.  `src/api/localRoutes.ts`: Implement `createProgram()` POST endpoint

**Functional Requirements:**

- [ ] **State:** Create a Context Provider wrapping the BuilderLayout
- [ ] **Add:** Update `CatalogColumn` to dispatch `ADD_COURSE` to context
- [ ] **Reorder:** Use `@dnd-kit/sortable` to allow dragging items up/down
- [ ] **Remove:** "X" button on each item in the Workbench
- [ ] **Stats:** Real-time calculation of "Total Duration" in footer
- [ ] **Save:** "Publish" button POSTs payload to `http://localhost:3001/custom_programs`

**Prompt Strategy:**

> "We are moving to PR-03. Create a `ProgramContext` to manage the array of selected courses. Then, implement the `WorkbenchColumn` using `dnd-kit` Sortable strategy. Finally, wire up the Publish button to save to our json-server."

---

### ⏭️ PR-04: Roster & Assignment (Right Column)

**Status:** Not Started  
**Goal:** The "Distribution" phase. Assigning the program to real users.

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

> "Time for PR-04. Let's build the Roster Sidebar. It needs to fetch students and display their status. Please also build the `EnrollmentModal` which takes a `courseId`, fetches the schedule inventory, and lets me select a class."

---

### ⏭️ PR-05: Student Experience (The Consumer)

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

> "Let's switch personas for PR-05. Create the Student Dashboard. It needs to read the assignment we created in the previous step. Show an 'Action Center' at the top that prompts the user to book a date for their ILT course."

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
    localRoutes.ts             # ⏳ To be implemented in PR-03
  /components
    /builder
      CatalogColumn.tsx        # ✅ Search + Filter + Course Grid
      WorkbenchColumn.tsx      # ⏳ To be implemented in PR-03
      RosterColumn.tsx         # ⏳ To be implemented in PR-04
    /student                   # ⏳ To be implemented in PR-05
      StudentDashboard.tsx
      ActionCenter.tsx
      Timeline.tsx
    /common
      CourseCard.tsx           # ✅ Course display card with badges
      EnrollmentModal.tsx      # ⏳ To be implemented in PR-04
      StatusBadge.tsx          # ⏳ To be implemented in PR-04
    /ui                        # ✅ Shadcn/ui components
      badge.tsx
      button.tsx
      card.tsx
      input.tsx
      skeleton.tsx
      sonner.tsx
  /context
    ProgramContext.tsx         # ⏳ To be implemented in PR-03
  /data                        # ✅ Static fallback JSON files
    mockCourses.json
    mockStudents.json
    mockSchedules.json
  /types
    models.ts                  # ✅ TypeScript interfaces
```
