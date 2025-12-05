# Project Specification & Prompt Context

## 📌 Global Context (Paste at start of every session)

**Project:** Phillips Education POC (Supervisor Program Builder)
**Stack:** Vite, React 19, Tailwind CSS v4, shadcn/ui, Bun.
**Architecture:**

- **Hybrid Data:** Read from Legacy API (`src/api/legacyRoutes.ts`), Write to Local JSON Server (`src/api/localRoutes.ts`).
- **Resilience:** If Legacy API fails/CORS, catch error and return data from `src/data/*.json`.
- **Styling:** Shadcn components for interactives; Tailwind grid/flex for layout.
- **State:** React Context for the Builder session.

**Data Interfaces:**

```typescript
interface CourseCatalogItem {
  courseId: number;
  courseTitle: string;
  levelName: string; // "Basic" | "Advanced"
  totalDays: number;
  hours: number | null;
  previewImageUrl: string | null;
  prices: { isFree: boolean }[];
}

interface SupervisorProgram {
  id: string; // UUID
  title: string;
  isPublished: boolean;
  courses: { sequenceOrder: number; courseId: number }[];
}
```

---

## 📅 Sprint PRs (Vertical Slices)

### ✅ PR-01: Infrastructure

**Status:** Completed
**Scope:** Scaffold, Tailwind v4 config, JSON Server, Static Data generation.

---

### 🚧 PR-02: Supervisor Catalog (Left Column)

**Goal:** Implement the "Inventory" view where Supervisors search and select courses.

**Components to Build:**

1.  `src/api/legacyRoutes.ts`: Implement `getCatalog()` with fallback logic.
2.  `src/components/common/CourseCard.tsx`: A draggable or clickable card showing Image, Title, Duration, Level.
3.  `src/components/builder/CatalogColumn.tsx`: The container with Search Input + Grid.

**Functional Requirements:**

- [ ] Fetch data on mount using `useEffect`.
- [ ] **Search:** Filter the list client-side based on `courseTitle` input.
- [ ] **Filter:** Add a simple Toggle/Select for "Level" (Basic vs Advanced).
- [ ] **Interaction:** clicking "Add (+)" on a card should log to console (until Context is ready).
- [ ] **Polish:** Use `Skeleton` component while loading.

**Prompt Strategy:**

> "Let's build PR-02. Please create `legacyRoutes.ts` with the fetch wrapper we discussed, ensuring it falls back to `mockCourses.json` on error. Then, build the `CourseCard` using shadcn Card, and the `CatalogColumn` with a search filter."

---

### ⏭️ PR-03: The Workbench (Center Column)

**Goal:** The "Canvas" where the Program is assembled and saved.

**Components to Build:**

1.  `src/context/ProgramContext.tsx`: Store `selectedCourses[]` and `programMeta`.
2.  `src/components/builder/WorkbenchColumn.tsx`: The drop zone.
3.  `src/api/localRoutes.ts`: Implement `createProgram()`.

**Functional Requirements:**

- [ ] **State:** Create a Context Provider wrapping the BuilderLayout.
- [ ] **Add:** Update `CatalogColumn` to dispatch `ADD_COURSE` to context.
- [ ] **Reorder:** Use `@dnd-kit` to allow dragging items up/down in the list.
- [ ] **Remove:** "X" button on items in the Workbench.
- [ ] **Stats:** Real-time calculation of "Total Duration" in the footer.
- [ ] **Save:** "Publish" button POSTs the payload to `http://localhost:3001/custom_programs`.

**Prompt Strategy:**

> "We are moving to PR-03. Create a `ProgramContext` to manage the array of selected courses. Then, implement the `WorkbenchColumn` using `dnd-kit` Sortable strategy. Finally, wire up the Publish button to save to our json-server."

---

### ⏭️ PR-04: Roster & Assignment (Right Column)

**Goal:** The "Distribution" phase. Assigning the program to real users.

**Components to Build:**

1.  `src/components/builder/RosterColumn.tsx`: List of students.
2.  `src/components/common/EnrollmentModal.tsx`: The "Force Enroll" UI.
3.  `src/api/legacyRoutes.ts`: Implement `getRoster()` and `getInventory(courseId)`.

**Functional Requirements:**

- [ ] **Slide-in:** Sidebar should only be active/visible if `program.isPublished === true`.
- [ ] **Data:** Load students from `mockStudents.json` (simulating Legacy API).
- [ ] **Visuals:** Status Badges (Green="Enrolled", Yellow="Pending").
- [ ] **Force Enroll:**
  - Click "Enroll" button on a student.
  - Open Modal.
  - Fetch Schedule for the _first_ course in the program.
  - User selects a Date -> Click Confirm -> Update Local State to "Registered".

**Prompt Strategy:**

> "Time for PR-04. Let's build the Roster Sidebar. It needs to fetch students and display their status. Please also build the `EnrollmentModal` which takes a `courseId`, fetches the schedule inventory, and lets me select a class."

---

### ⏭️ PR-05: Student Experience (The Consumer)

**Goal:** The view for "Liam" or "Ethan" to see what was assigned.

**Components to Build:**

1.  `src/components/student/StudentDashboard.tsx`: Main container.
2.  `src/components/student/ActionCenter.tsx`: High-vis alerts.
3.  `src/components/student/Timeline.tsx`: Vertical progress view.

**Functional Requirements:**

- [ ] **Context:** Mock the logged-in user as "Liam" (ID: 1511).
- [ ] **Fetch:** Get `assignments` from local DB where `learnerId === 1511`.
- [ ] **Action Center:** If status is "Pending Selection," show a big "Book Now" card.
- [ ] **Timeline:** Render the list of courses. Status = Locked until previous is done (visual only).

**Prompt Strategy:**

> "Let's switch personas for PR-05. Create the Student Dashboard. It needs to read the assignment we created in the previous step. Show an 'Action Center' at the top that prompts the user to book a date for their ILT course."

---

## 🛠️ Data Dictionary (for reference)

**Legacy API Endpoints:**

- GET `/Course/GetAllPartialValue` (Catalog)
- GET `/Learner/GetAllPartialValue` (Roster)
- GET `/Class/Machinist/Schedules` (Inventory)

**Local JSON-Server Endpoints:**

- POST `/custom_programs`
- POST `/assignments`
- POST `/enrollments`
