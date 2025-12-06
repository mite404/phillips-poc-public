# Implementation Plan

> **Last Updated:** 2025-12-05

**Project:** Phillips Education POC  
**Goal:** High-velocity build of a "Program Builder" & "Student Timeline" demo.  
**Stack:** Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, @dnd-kit, Bun.  
**Data Strategy:** Hybrid (Read Legacy API / Write Local JSON Server).

---

## 1. Directory Structure

```text
/src
  /api
    utils.ts            # ✅ Fetch wrapper (handles base URLs & error parsing)
    legacyRoutes.ts     # ✅ GET calls (Courses) | ⏳ (Schedules, Learners in PR-04)
    localRoutes.ts      # ⏳ GET/POST calls (Programs, Assignments, Enrollments)
  /components
    /builder            # Supervisor Components
      CatalogColumn.tsx        # ✅ Search + Filter + Grid
      WorkbenchColumn.tsx      # ⏳ PR-03
      RosterColumn.tsx         # ⏳ PR-04
    /student            # Student Components (PR-05)
      StudentDashboard.tsx
      ActionCenter.tsx
      Timeline.tsx
    /common             # Shared Components
      CourseCard.tsx           # ✅ Card with Image, Badges, Duration
      EnrollmentModal.tsx      # ⏳ PR-04
      StatusBadge.tsx          # ⏳ PR-04
    /ui                 # ✅ Shadcn/ui component library
  /context
    ProgramContext.tsx  # ⏳ Manage the "Draft" state before saving (PR-03)
  /data                 # ✅ Static Fallbacks (The "Real" JSON snapshots)
    mockCourses.json
    mockStudents.json
    mockSchedules.json
  /types
    models.ts           # ✅ TypeScript Interfaces
```

---

## 2. Data Interfaces (The Contract)

**The Course (Product Catalog):**

```typescript
export interface CourseCatalogItem {
  courseId: number; // The Lego Block ID
  courseTitle: string;
  levelName: string; // "Basic" | "Advanced"
  trainingTypeName: string; // "ILT" | "eLearning"
  totalDays: number;
  hours: number | null;
  previewImageUrl: string | null;
  prices: { isFree: boolean; price?: number; currency?: string }[];
  skills?: { skillName: string }[];
}
```

**The Learner (User):**

```typescript
export interface LearnerProfile {
  learner_Data_Id: number; // Use this Integer for API calls
  learnerId: string; // GUID for Auth/Identity
  learnerName: string;
  location: string;
  status: "Active" | "Inactive";
  currentEnrollment?: {
    productName: string;
    learnerStatusTag: string; // e.g. "Enrolled"
  };
}
```

**The Program (Local Storage):**

```typescript
export interface SupervisorProgram {
  id: string; // UUID
  title: string;
  description: string;
  isPublished: boolean;
  courses: {
    sequenceOrder: number;
    courseId: number;
    // Cache title/image to avoid re-fetching on Student view
    cachedTitle?: string;
  }[];
}
```

---

## 3. Sprint Schedule (Vertical Slices)

### ✅ PR-01: Foundation (Completed)

- [x] Project Scaffold (Vite + Bun)
- [x] Tailwind v4 + Phillips Colors (`--phillips-blue`, `--phillips-red`)
- [x] JSON Server Setup (`db.json` with 3 collections)
- [x] Static Data Population (`src/data/*.json`)
- [x] Shadcn/ui component installation (Card, Badge, Button, Input, Skeleton, Sonner)
- [x] TypeScript configuration with path aliases (`@/*`)

**Deliverables:**

- API utilities (`src/api/utils.ts`) with `fetchApi` wrapper
- Base type definitions (`src/types/models.ts`)
- Development server setup (Vite on 5173, json-server on 3001)

---

### ✅ PR-02: Supervisor Catalog (Completed)

- **Focus:** Left Column (Inventory)
- **Tasks:**
  - [x] Implement `legacyRoutes.getCatalog()` with try/catch fallback
  - [x] Build `CourseCard` component (Image, Level Badge, Training Type, Duration, Price)
  - [x] Implement Client-side Search (Filter by Title)
  - [x] Implement Level Filter (All/Basic/Advanced button toggles)
  - [x] Add loading states (Skeleton components)
  - [x] Add error handling UI
  - [x] Display results count

**Success Criteria:** ✅ Supervisor can see 5 courses from mock data, search by title, and filter by level. Add button logs to console.

**Implementation Details:**

- `CatalogColumn` uses local state (`useState`) for courses, search, and filter
- Responsive grid layout (1/2/3 columns based on breakpoint)
- Phillips blue branding on Advanced badges and active filters
- Duration calculation: ILT = days, eLearning = hours or "Self-paced"

---

### ⏳ PR-03: The Workbench (Not Started)

- **Focus:** Center Column (Process)
- **Tasks:**
  - [ ] Create `ProgramContext` with reducer to hold `selectedCourses[]` array
  - [ ] Implement "Add to Program" action (dispatch from `CatalogColumn`)
  - [ ] Build `WorkbenchColumn.tsx` with sortable list
  - [ ] Setup `@dnd-kit/sortable` for reordering courses
  - [ ] Add "Remove" button (X icon) on each course item
  - [ ] Calculate and display "Total Duration" (sum of `totalDays`)
  - [ ] Implement `localRoutes.createProgram()` POST function
  - [ ] Wire "Publish" button to save to `http://localhost:3001/custom_programs`

**Success Criteria:** Supervisor can add 3 courses, drag to reorder, remove items, and click "Publish" to persist to `db.json`.

**Technical Notes:**

- Use Context + useReducer pattern (avoid Redux for this POC)
- `@dnd-kit` dependencies already installed: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- POST payload should match `SupervisorProgram` interface
- Generate UUID for program ID (consider using `crypto.randomUUID()`)

---

### ⏳ PR-04: Roster & Assignment (Not Started)

- **Focus:** Right Column (Output)
- **Tasks:**
  - [ ] Implement `legacyRoutes.getRoster()` with fallback to `mockStudents.json`
  - [ ] Build `RosterColumn.tsx` with student list
  - [ ] Create `StatusBadge` component (Green/Yellow/Gray variants)
  - [ ] Display student enrollment status
  - [ ] Build `EnrollmentModal` component (Dialog from shadcn/ui)
  - [ ] Implement `legacyRoutes.getInventory(courseId)` with fallback to `mockSchedules.json`
  - [ ] Display class schedule options (dates, locations) in modal
  - [ ] POST enrollment selection to `http://localhost:3001/enrollments`
  - [ ] Update local state to reflect "Enrolled" status

**Success Criteria:** Supervisor can assign a program to "Liam" (learner 1511) and force-enroll "Ethan" into a specific Mumbai class on a selected date.

**Technical Notes:**

- Sidebar should be conditional: only visible when `program.isPublished === true`
- Consider adding a "Select All" checkbox for bulk assignment
- Modal should fetch inventory for the **first course** in the program sequence

---

### ⏳ PR-05: Student View (Not Started)

- **Focus:** The "Consumer" Experience
- **Tasks:**
  - [ ] Create `StudentDashboard.tsx` layout
  - [ ] Mock authentication context (hardcode `currentUser = { id: 1511, name: "Liam" }`)
  - [ ] Fetch assignments from `http://localhost:3001/assignments?learnerId=1511`
  - [ ] Build `ActionCenter.tsx` component (high-priority alerts)
  - [ ] Show "Book Now" CTA for courses with status "Pending Selection"
  - [ ] Build `Timeline.tsx` with vertical stepper UI
  - [ ] Display course sequence with lock icons (visual only, no actual gating logic)
  - [ ] Show completion status (Completed/In Progress/Locked)

**Success Criteria:** Student (Liam) sees the program created in PR-03, with an action prompt to book a date for the first ILT course.

**Technical Notes:**

- Use `react-router-dom` for `/student` route
- Timeline could use a stepper component (or custom vertical list with lines)
- Consider adding icons from `lucide-react`: `CheckCircle`, `Clock`, `Lock`

---

## 4. Critical Technical Decisions

### 4.1 Styling Strategy

- **Shadcn/ui** for complex interactives (Dialog, Popover, Toast, Skeleton)
- **Raw Tailwind** grid/flex for main layout containers
- **Phillips Brand Colors** via CSS custom properties in `src/index.css`:
  ```css
  --phillips-blue: 206 100% 29%; /* #005596 */
  --phillips-red: 344 84% 45%; /* #D31245 */
  ```

### 4.2 State Management

- **React Context** (`ProgramBuilderContext`) for the Builder view
- **useReducer** for managing course list actions (ADD, REMOVE, REORDER)
- **Avoid** Redux/Zustand for this POC scope
- Context is sufficient for a single-page builder with 2-3 columns

### 4.3 Mocking & Resilience

- **Critical:** All `legacyRoutes.ts` functions MUST have `try/catch`
- **Fallback Logic:** If Real API fails (CORS/Network), automatically return data from `src/data/*.json`
- **Why:** Ensures the demo **never breaks** during client presentations
- **Example:**
  ```typescript
  export async function getCatalog(): Promise<CourseCatalogItem[]> {
    try {
      const response = await fetchApi<{ result: CourseCatalogItem[] }>(
        `${LEGACY_API_BASE}/Course/GetAllPartialValue`,
      );
      return response.result || [];
    } catch (error) {
      console.warn("Legacy API failed, using fallback data:", error);
      return mockCoursesData as CourseCatalogItem[];
    }
  }
  ```

### 4.4 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Legacy API (Read-Only)                                 │
│  https://phillipsx-pims-stage.azurewebsites.net/api     │
│  ├─ /Course/GetAllPartialValue                         │
│  ├─ /Learner/GetAllPartialValue                        │
│  └─ /Class/Machinist/Schedules                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  src/api/       │
         │  legacyRoutes.ts│ ◄──── Fallback to src/data/*.json
         └─────────────────┘
                   │
                   ▼
         ┌─────────────────────────────────────┐
         │  React Components                   │
         │  ├─ CatalogColumn (reads catalog)   │
         │  ├─ RosterColumn (reads learners)   │
         │  └─ EnrollmentModal (reads schedule)│
         └─────────────────┬───────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ ProgramContext  │
                 │ (Draft State)   │
                 └────────┬────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │  src/api/localRoutes.ts  │
            │  POST to json-server     │
            └──────────┬───────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  json-server (Write Target) │
         │  http://localhost:3001      │
         │  ├─ /custom_programs        │
         │  ├─ /assignments            │
         │  └─ /enrollments            │
         └─────────────────────────────┘
```

---

## 5. Known Issues & Future Improvements

**Current Limitations:**

- No authentication/authorization (mocked user context)
- No real-time updates (would need WebSockets or polling)
- No offline support (no service worker)
- Limited error recovery UI (basic toast notifications)

**Future Enhancements (Post-POC):**

- Add React Query for server state caching
- Implement optimistic UI updates
- Add form validation with Zod schemas
- Create a proper "Draft Autosave" mechanism
- Add analytics tracking (course views, completion rates)
- Implement proper user roles (Supervisor, Admin, Student)

---

## 6. Development Workflow

**Starting Development:**

```bash
bun dev              # Runs both Vite (5173) and json-server (3001)
```

**Build & Quality Checks:**

```bash
bun run build        # TypeScript compilation + Vite build
bun run lint         # ESLint check
```

**Accessing Services:**

- Frontend: `http://localhost:5173`
- JSON Server: `http://localhost:3001`
- JSON Server Dashboard: `http://localhost:3001` (shows available endpoints)

**Data Reset:**
To reset the local database, restore `db.json` to its initial state with empty arrays:

```json
{
  "custom_programs": [],
  "assignments": [],
  "enrollments": []
}
```
