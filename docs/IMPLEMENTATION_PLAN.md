# Implementation Plan

**Project:** Phillips Education POC
**Goal:** High-velocity build of a "Program Builder" & "Student Timeline" demo.
**Stack:** Vite, React 19, Tailwind v4, shadcn/ui, dnd-kit, Bun.
**Data Strategy:** Hybrid (Read Legacy API / Write Local JSON Server).

---

## 1. Directory Structure

```text
/src
  /api
    utils.ts            # Fetch wrapper (handles base URLs & error parsing)
    legacyRoutes.ts     # GET calls (Courses, Schedules, Learners)
    localRoutes.ts      # GET/POST calls (Programs, Assignments, Enrollments)
  /components
    /builder            # Supervisor Components
      CatalogColumn.tsx
      WorkbenchColumn.tsx
      RosterColumn.tsx
    /student            # Student Components
      Timeline.tsx
      ActionCenter.tsx
    /common             # Shared Components
      CourseCard.tsx
      StatusBadge.tsx
      AppHeader.tsx
  /context
    ProgramContext.tsx  # Manage the "Draft" state before saving
  /data                 # Static Fallbacks (The "Real" JSON snapshots)
    mockCourses.json
    mockStudents.json
    mockSchedules.json
  /types
    models.ts           # TypeScript Interfaces
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
  prices: { isFree: boolean; price: number; currency: string }[];
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

### ✅ PR-01: Foundation (Day 1)

- [x] Project Scaffold (Vite + Bun).
- [x] Tailwind v4 + Phillips Colors.
- [x] JSON Server Setup (`db.json`).
- [x] Static Data Population (`src/data/*.json`).

### 🚧 PR-02: Supervisor Catalog (Day 2)

- **Focus:** Left Column (Inventory).
- **Tasks:**
  1.  Implement `legacyRoutes.getCatalog()`.
  2.  Build `CourseCard` component (Image, Level Badge, Duration).
  3.  Implement Client-side Search (Filter by Title) and Filter (by Level).
- **Success Criteria:** Supervisor can see the list of "Real" courses and filter them.

### ⏭️ PR-03: The Workbench (Day 2/3)

- **Focus:** Center Column (Process).
- **Tasks:**
  1.  Create `ProgramContext` to hold the `selectedCourses` array.
  2.  Implement "Add to Program" button on Catalog cards.
  3.  Setup `dnd-kit` for reordering courses in the Center column.
  4.  Implement "Save Draft" & "Publish" (`POST /custom_programs`).
- **Success Criteria:** Supervisor can drag 3 courses, reorder them, and click "Publish" (persisting to `db.json`).

### ⏭️ PR-04: Roster & Assignment (Day 4)

- **Focus:** Right Column (Output).
- **Tasks:**
  1.  Fetch Learners via `legacyRoutes.getRoster()`.
  2.  Display List with Status Badges (Green="Enrolled", Gray="Unassigned").
  3.  **Hard Part:** The "Force Enroll" Modal.
      - Fetch `legacyRoutes.getInventory(courseId)`.
      - Display specific Dates/Locations.
      - POST to local `/enrollments`.
- **Success Criteria:** Supervisor can assign a program to "Liam" and force-enroll "Ethan" into a specific Mumbai class.

### ⏭️ PR-05: Student View (Day 5)

- **Focus:** The "Consumer" Experience.
- **Tasks:**
  1.  Fetch assigned programs for the current user.
  2.  Render "Action Center" (High priority items needing date selection).
  3.  Render Vertical Timeline of the program.
- **Success Criteria:** Student sees the program created in PR-03 and can book a date for an ILT course.

---

## 4. Critical Technical Decisions

1.  **Styling Strategy:**
    - Use `shadcn/ui` for complex interactives (Dialog, Popover, Toast).
    - Use raw Tailwind grid/flex for main layout containers.
2.  **State Management:**
    - Use React Context (`ProgramBuilderContext`) for the Builder view.
    - Avoid Redux/Zustand for this POC scope; Context is sufficient for a single-page builder.

3.  **Mocking & Resilience:**
    - The `legacyRoutes.ts` functions must have a `try/catch` block.
    - If the Real API fails (CORS/Network), catch the error and return data from `src/data/*.json` automatically. This ensures the demo **never breaks** during a presentation.
