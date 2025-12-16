# Getting Started with PR-04: Persistence & API Integration

> **Last Updated:** 2025-12-10  
> **Target Audience:** Developers onboarding to the Phillips Education POC

This guide walks you through the key features and architecture decisions made in PR-04, which implemented the hybrid data model (read from Legacy API, write to local JSON server).

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [The Hybrid Data Model](#the-hybrid-data-model)
3. [Core Files & Their Roles](#core-files--their-roles)
4. [Data Flow: From API to UI to Persistence](#data-flow-from-api-to-ui-to-persistence)
5. [Code Deep Dive](#code-deep-dive)
6. [Testing the Implementation](#testing-the-implementation)
7. [Common Patterns & Best Practices](#common-patterns--best-practices)

---

## Overview

**PR-04 Goal:** Connect the Program Builder to real data sources and enable persistent storage.

**What Changed:**
- Replaced hardcoded mock data with live API calls
- Implemented lightweight persistence (store IDs only, not full objects)
- Added loading states and user feedback (toast notifications)
- Calculated real-time duration based on selected courses

**Tech Stack:**
- **Read:** Phillips X PIMS Legacy API (with fallback to `Courses.json`)
- **Write:** json-server running on `localhost:3001`
- **UI Feedback:** Sonner toast library
- **Type Safety:** Full TypeScript coverage

---

## The Hybrid Data Model

### Why Hybrid?

We don't control the Legacy API, so we can't write to it. But we need to store custom programs. Solution: **Read from one source, write to another.**

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID DATA FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Legacy API (Phillips X PIMS)          Local json-server   │
│  ↓ READ Course Catalog                 ↑ WRITE Programs    │
│                                                             │
│  GET /Course/GetAllPartialValue        POST /programs       │
│  Returns: Full course objects          Accepts: IDs only   │
│                                                             │
│  ┌─────────────────────────┐           ┌─────────────────┐ │
│  │ {                       │           │ {               │ │
│  │   courseId: 116,        │           │   courseSeq...: │ │
│  │   courseTitle: "CNC",   │           │   [116, 11, 9]  │ │
│  │   levelName: "Basic",   │           │ }               │ │
│  │   totalDays: 7,         │           └─────────────────┘ │
│  │   previewImageUrl: ...  │                               │
│  │   skills: [...]         │           Lightweight!        │
│  │ }                       │           (IDs only)          │
│  └─────────────────────────┘                               │
│                                                             │
│  Rich Objects                          Minimal Payload     │
│  (For UI rendering)                    (Prevents duplication)│
└─────────────────────────────────────────────────────────────┘
```

### The Lightweight Principle

**Problem:** If we store full course objects in `db.json`, we duplicate data and risk it going stale.

**Solution:** Store only course IDs. When we need to display a program, we:
1. Fetch the program (gets us `courseSequence: [116, 11, 9]`)
2. Fetch the course catalog from the Legacy API
3. Match IDs to reconstruct the rich objects

This is implemented in PR-04 for the **write** side. The **read** side (reconstructing programs) will come in a future PR.

---

## Core Files & Their Roles

### 1. `src/api/localRoutes.ts` (NEW)

**Purpose:** Handle all writes to the local json-server.

```typescript
import { fetchApi, LOCAL_API_BASE } from "./utils";
import type { SupervisorProgram } from "@/types/models";

export async function saveProgram(program: SupervisorProgram): Promise<SupervisorProgram> {
  try {
    const response = await fetchApi<SupervisorProgram>(
      `${LOCAL_API_BASE}/programs`,  // http://localhost:3001/programs
      {
        method: "POST",
        body: JSON.stringify(program),
      }
    );
    return response;
  } catch (error) {
    console.error("Failed to save program:", error);
    throw error;
  }
}

export const localApi = {
  saveProgram,
};
```

**Key Points:**
- Uses the centralized `fetchApi` wrapper from `utils.ts`
- Posts to `LOCAL_API_BASE` (defined as `http://localhost:3001`)
- Returns the saved program (json-server adds metadata)
- Throws errors for the caller to handle

---

### 2. `src/hooks/useProgramBuilder.ts` (REFACTORED)

**Purpose:** Central state management for the Program Builder UI.

#### Key Changes in PR-04:

**Before (PR-03):**
```typescript
const MOCK_COURSES: Course[] = [
  { id: "1", title: "Haas CNC Mill", code: "C101", type: "ILT", level: "Basic" },
  // ... hardcoded data
];

const filteredCourses = MOCK_COURSES.filter(...);
```

**After (PR-04):**
```typescript
import { getCatalog } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { toast } from "sonner";

export function useProgramBuilder() {
  const [isLoading, setIsLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  // Fetch courses from Legacy API on mount
  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const catalogItems = await getCatalog(); // Hits Legacy API
        
        // Transform CourseCatalogItem[] to Course[] (add string ID for dnd-kit)
        const courses: Course[] = catalogItems.map((item) => ({
          ...item,
          id: String(item.courseId), // dnd-kit needs string IDs
        }));
        
        setAvailableCourses(courses);
      } catch (error) {
        console.error("Failed to load catalog:", error);
        toast.error("Failed to load course catalog");
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalog();
  }, []);
}
```

**What's Happening:**
1. On component mount, `useEffect` fires
2. Calls `getCatalog()` which hits the Legacy API
3. If API fails, `getCatalog()` automatically falls back to `Courses.json`
4. Transforms numeric `courseId` to string `id` for dnd-kit compatibility
5. Updates state, UI re-renders with real data

---

#### The Save Transformation

**The Critical Logic:**

```typescript
const saveDraft = async () => {
  // Validation
  if (!programTitle.trim()) {
    toast.error("Program title is required");
    return;
  }

  if (selectedCourses.length === 0) {
    toast.error("Please add at least one course");
    return;
  }

  try {
    toast.loading("Saving program...");

    // 🔥 THE TRANSFORMATION: Rich Objects → Lightweight Payload
    const payload: SupervisorProgram = {
      id: crypto.randomUUID(), // Generate UUID
      supervisorId: "pat_mann_guid", // Hardcoded for POC
      programName: programTitle,
      description: programDescription,
      tags: [], // TODO: Add tag functionality later
      courseSequence: selectedCourses.map((course) => course.courseId), // ⭐ Extract IDs only
      published: false,
      createdAt: new Date().toISOString(),
    };

    // Save to json-server
    await localApi.saveProgram(payload);

    toast.dismiss();
    toast.success(`Program "${programTitle}" saved successfully!`);
  } catch (error) {
    toast.dismiss();
    toast.error("Failed to save program");
    console.error("Save error:", error);
  }
};
```

**Line-by-Line Breakdown:**

```typescript
courseSequence: selectedCourses.map((course) => course.courseId)
```

- `selectedCourses` is an array of rich `Course` objects (with title, level, skills, etc.)
- `.map((course) => course.courseId)` extracts **only** the numeric ID
- Result: `[116, 11, 9]` instead of `[{courseId: 116, courseTitle: "CNC", ...}, ...]`

**Why This Matters:**

Without this transformation:
```json
// ❌ BAD: Duplicates all course data
{
  "courseSequence": [
    {
      "courseId": 116,
      "courseTitle": "CNC Machining & Repair",
      "levelName": "Basic",
      "totalDays": 7,
      "previewImageUrl": "https://...",
      "skills": [...]
    }
  ]
}
```

With transformation:
```json
// ✅ GOOD: Stores only IDs
{
  "courseSequence": [116, 11, 9]
}
```

---

### 3. `src/components/ProgramBuilder.tsx` (ENHANCED)

**Purpose:** The main UI component. Now handles loading states and real-time calculations.

#### Loading State:

```typescript
export function ProgramBuilder() {
  const {
    isLoading,
    filteredCourses,
    // ... other state
  } = useProgramBuilder();

  return (
    <div className="flex h-full gap-4">
      {/* Right Column - Course Catalog */}
      <div className="flex-[0.4] flex flex-col border border-slate-300 rounded-lg">
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCourses.map((course) => (
                <div key={course.id}>
                  {/* Course card */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**What's Happening:**
- While `isLoading` is true, show skeleton placeholders
- Once data loads, render actual course cards
- Prevents "No courses found" flash before data arrives

---

#### Duration Calculation:

```typescript
const calculateTotalDuration = () => {
  let totalDays = 0;
  let totalHours = 0;

  selectedCourses.forEach((course) => {
    if (course.trainingTypeName === "ILT") {
      totalDays += course.totalDays || 0;
    } else if (course.trainingTypeName === "eLearning") {
      totalHours += course.hours || 0;
    }
  });

  const parts: string[] = [];
  if (totalDays > 0) {
    parts.push(`${totalDays} day${totalDays !== 1 ? "s" : ""}`);
  }
  if (totalHours > 0) {
    parts.push(`${totalHours} hour${totalHours !== 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join(" + ") : "0 hours";
};
```

**Example Outputs:**
- ILT only: `"17 days"`
- eLearning only: `"3 hours"`
- Mixed: `"17 days + 3 hours"`
- Empty: `"0 hours"`

**Displayed in Footer:**

```tsx
<div className="p-4 border-t border-slate-300 bg-white space-y-2">
  {selectedCourses.length > 0 && (
    <div className="text-sm text-slate-600">
      <span className="font-semibold">Total Duration:</span> {calculateTotalDuration()}
    </div>
  )}
  <button onClick={saveDraft} className="bg-phillips-blue text-white px-6 py-2 rounded">
    Save Draft
  </button>
</div>
```

---

### 4. `src/components/common/CourseDetailModal.tsx` (UPDATED)

**Purpose:** Display detailed course information when a course card is clicked.

**Before (PR-03):**
```typescript
<DialogTitle>{course.title}</DialogTitle>
<p>{course.code}</p>
<p>{course.level}</p>
<p>{course.type}</p>
```

**After (PR-04):**
```typescript
<DialogTitle>{course.courseTitle}</DialogTitle>
<p>#{course.courseId}</p>
<p>{course.levelName}</p>
<p>{course.trainingTypeName}</p>

{/* NEW: Show duration */}
<p>
  {course.trainingTypeName === "ILT"
    ? `${course.totalDays} day${course.totalDays !== 1 ? "s" : ""}`
    : course.hours
    ? `${course.hours} hour${course.hours !== 1 ? "s" : ""}`
    : "Self-paced"}
</p>

{/* NEW: Show skills */}
{course.skills && course.skills.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {course.skills.map((skill, idx) => (
      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
        {skill.skillName}
      </span>
    ))}
  </div>
)}
```

**Key Changes:**
- Updated property names to match `CourseCatalogItem` interface
- Added duration display logic (ILT vs eLearning)
- Added skills badges from API data

---

### 5. `src/App.tsx` (TOASTER ADDED)

**Purpose:** Add toast notification system to the app.

```typescript
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Rest of app */}
    </>
  );
}
```

**Why This Matters:**
- `toast.loading()`, `toast.success()`, `toast.error()` now work globally
- Provides user feedback for async operations
- Positioned top-right to avoid blocking UI

---

### 6. `src/api/legacyRoutes.ts` (UPDATED)

**Purpose:** Fetch course catalog from Phillips X PIMS API.

**Change:**
```typescript
// Before
import mockCoursesData from "@/data/mockCourses.json";

// After
import coursesData from "@/data/Courses.json";
```

**Fallback Logic:**
```typescript
export async function getCatalog(): Promise<CourseCatalogItem[]> {
  try {
    const response = await fetchApi<{ result: CourseCatalogItem[] }>(
      `${LEGACY_API_BASE}/Course/GetAllPartialValue`,
    );
    return response.result || [];
  } catch (error) {
    console.warn("Legacy API failed, using fallback data:", error);
    return coursesData as CourseCatalogItem[];
  }
}
```

**What Happens:**
1. Try to fetch from `https://phillipsx-pims-stage.azurewebsites.net/api/Course/GetAllPartialValue`
2. If it fails (CORS, network, 500 error), catch the error
3. Return local `Courses.json` instead
4. User doesn't see an error—they just get fallback data

---

### 7. `src/components/SidebarNav.tsx` (TYPESCRIPT FIXED)

**Change:** Fixed function signature to properly type props.

**Before:**
```typescript
export function SidebarNav({ currentView, onNavigate }): SidebarNavProps {
  // ❌ TypeScript error: implicit 'any' type
}
```

**After:**
```typescript
export function SidebarNav({ currentView, onNavigate }: SidebarNavProps) {
  // ✅ Properly typed
}
```

---

### 8. `src/components/PageContent.tsx` (CLEANUP)

**Change:** Removed unused variables to fix TypeScript warnings.

**Before:**
```typescript
const { userType, setUserType, currentView } = props;
const coursesForMockProgram = [/* unused */];
```

**After:**
```typescript
const { setUserType, currentView } = props;
// Removed coursesForMockProgram
```

---

## Data Flow: From API to UI to Persistence

Let's trace a complete user journey:

### Step 1: User Opens Program Builder

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Component Mounts                                         │
│    ↓                                                        │
│ 2. useEffect() fires                                        │
│    ↓                                                        │
│ 3. Calls getCatalog()                                       │
│    ↓                                                        │
│ 4. Tries Legacy API                                         │
│    ├─ Success? → Returns CourseCatalogItem[]               │
│    └─ Failure? → Returns Courses.json                      │
│    ↓                                                        │
│ 5. Transform: Add string ID for dnd-kit                    │
│    courseId: 116 → id: "116"                               │
│    ↓                                                        │
│ 6. setAvailableCourses(courses)                            │
│    ↓                                                        │
│ 7. setIsLoading(false)                                     │
│    ↓                                                        │
│ 8. UI re-renders: Skeleton → Course List                   │
└─────────────────────────────────────────────────────────────┘
```

**Code Path:**
```
ProgramBuilder.tsx
  → useProgramBuilder()
    → useEffect(() => loadCatalog())
      → getCatalog() [in legacyRoutes.ts]
        → fetchApi(LEGACY_API_BASE)
          ↓ (if fails)
        → return coursesData [from Courses.json]
      → map(item => ({...item, id: String(item.courseId)}))
    → setAvailableCourses(courses)
  → {isLoading ? <Skeleton /> : <CourseList />}
```

---

### Step 2: User Selects Courses

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Add" button on a course                    │
│    ↓                                                        │
│ 2. onClick={(e) => {                                        │
│      e.stopPropagation();  // Prevent modal                │
│      addCourse(course);                                     │
│    }}                                                       │
│    ↓                                                        │
│ 3. addCourse() checks for duplicates                       │
│    if (!selectedCourses.find(c => c.id === course.id))     │
│    ↓                                                        │
│ 4. setSelectedCourses([...prev, course])                   │
│    ↓                                                        │
│ 5. UI re-renders:                                          │
│    - Course appears in left column                         │
│    - Duration updates in footer                            │
└─────────────────────────────────────────────────────────────┘
```

**State at this point:**
```typescript
selectedCourses = [
  {
    id: "116",
    courseId: 116,
    courseTitle: "CNC Machining & Repair",
    levelName: "Basic",
    trainingTypeName: "ILT",
    totalDays: 7,
    // ... all other properties
  },
  // ... more courses
]
```

---

### Step 3: User Saves Program

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Save Draft"                                │
│    ↓                                                        │
│ 2. saveDraft() validates input                             │
│    - Check programTitle not empty                          │
│    - Check selectedCourses.length > 0                      │
│    ↓                                                        │
│ 3. toast.loading("Saving program...")                      │
│    ↓                                                        │
│ 4. 🔥 TRANSFORMATION:                                       │
│    courseSequence = selectedCourses.map(c => c.courseId)   │
│    Result: [116, 11, 9]                                    │
│    ↓                                                        │
│ 5. Build payload:                                          │
│    {                                                        │
│      id: crypto.randomUUID(),                              │
│      supervisorId: "pat_mann_guid",                        │
│      programName: "My Program",                            │
│      description: "...",                                   │
│      courseSequence: [116, 11, 9],  // ⭐ IDs only         │
│      published: false,                                     │
│      createdAt: "2025-12-10T..."                           │
│    }                                                        │
│    ↓                                                        │
│ 6. await localApi.saveProgram(payload)                     │
│    ↓                                                        │
│ 7. POST http://localhost:3001/programs                     │
│    ↓                                                        │
│ 8. json-server receives, validates, writes to db.json     │
│    ↓                                                        │
│ 9. Returns saved program                                   │
│    ↓                                                        │
│ 10. toast.dismiss() + toast.success("Saved!")              │
└─────────────────────────────────────────────────────────────┘
```

**Network Request:**
```http
POST http://localhost:3001/programs
Content-Type: application/json

{
  "id": "31d1bce9-d0aa-4057-b3a9-91e96b94cf9a",
  "supervisorId": "pat_mann_guid",
  "programName": "My Program",
  "description": "",
  "tags": [],
  "courseSequence": [116, 11, 9],
  "published": false,
  "createdAt": "2025-12-11T00:00:33.394Z"
}
```

**What Gets Stored in `db.json`:**
```json
{
  "programs": [
    {
      "id": "31d1bce9-d0aa-4057-b3a9-91e96b94cf9a",
      "supervisorId": "pat_mann_guid",
      "programName": "My Program",
      "description": "",
      "tags": [],
      "courseSequence": [116, 11, 9],
      "published": false,
      "createdAt": "2025-12-11T00:00:33.394Z"
    }
  ]
}
```

---

## Testing the Implementation

### 1. Start the Development Servers

```bash
bun dev
```

**You should see:**
```
✓ Vite running at http://localhost:5173
✓ json-server running at http://localhost:3001
```

### 2. Test API Fetch

1. Open browser DevTools (Network tab)
2. Navigate to `http://localhost:5173`
3. Click "Education Supervisor"
4. Watch the Network tab:
   - Should see request to `https://phillipsx-pims-stage.azurewebsites.net/api/Course/GetAllPartialValue`
   - If it fails (CORS), check Console—should say "using fallback data"
5. Course catalog should appear after loading

### 3. Test Course Selection

1. Search for a course (e.g., "CNC")
2. Click "Add" button
3. Course should appear in left column
4. Click "Add" again—should NOT duplicate (check console for validation)
5. Footer should show duration (e.g., "7 days")

### 4. Test Drag-and-Drop

1. Add 3+ courses
2. Grab the grip icon (⋮⋮) on left side of a course
3. Drag to reorder
4. Order should persist in UI
5. Footer duration should remain accurate

### 5. Test Save Functionality

1. Enter a program title: "Test Program"
2. Add description (optional)
3. Click "Save Draft"
4. Watch for toast notifications:
   - Should see "Saving program..." briefly
   - Then "Program 'Test Program' saved successfully!"
5. Open `db.json` in your editor
6. Should see new entry in `programs` array with:
   - Generated UUID
   - Your title/description
   - `courseSequence` with IDs only (e.g., `[116, 11, 9]`)

### 6. Test Error Handling

**Empty Title:**
1. Clear the program title
2. Click "Save Draft"
3. Should see error toast: "Program title is required"

**No Courses:**
1. Remove all courses
2. Click "Save Draft"
3. Should see error toast: "Please add at least one course"

**Network Error (simulate):**
1. Stop json-server: `pkill -f json-server`
2. Try to save
3. Should see error toast: "Failed to save program"
4. Restart: `bun run server`

---

## Common Patterns & Best Practices

### 1. The Transformation Pattern

**When to use:**  
Whenever you need to convert rich UI state to lightweight persistence.

```typescript
// ✅ GOOD: Extract only what's needed
const payload = {
  items: selectedItems.map(item => item.id),
};

// ❌ BAD: Store full objects
const payload = {
  items: selectedItems, // Duplicates all data!
};
```

### 2. The Fallback Pattern

**When to use:**  
Whenever you depend on an external API you don't control.

```typescript
export async function fetchData() {
  try {
    return await externalApi.getData();
  } catch (error) {
    console.warn("External API failed, using fallback");
    return fallbackData;
  }
}
```

**Benefits:**
- Resilient to network failures
- Works offline during development
- No broken UI if API changes

### 3. The Loading State Pattern

**When to use:**  
Whenever you fetch data asynchronously.

```typescript
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  async function load() {
    setIsLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } finally {
      setIsLoading(false); // Always runs, even on error
    }
  }
  load();
}, []);

// In JSX:
{isLoading ? <Skeleton /> : <DataDisplay data={data} />}
```

### 4. The Toast Feedback Pattern

**When to use:**  
For any async operation that takes >500ms.

```typescript
try {
  toast.loading("Saving...");
  await saveData();
  toast.dismiss();
  toast.success("Saved!");
} catch (error) {
  toast.dismiss();
  toast.error("Save failed");
}
```

**Why:**
- User knows operation is in progress
- Clear success/failure feedback
- Doesn't block the UI

---

## What's Next?

**PR-05 will add:**
- Reading saved programs from `db.json`
- Displaying the roster of students
- Assigning programs to learners

**Key Challenge:**  
When we load a saved program, we'll need to:
1. Fetch `courseSequence: [116, 11, 9]` from json-server
2. Fetch full course catalog from Legacy API
3. Match IDs to reconstruct rich Course objects
4. Populate the UI

This is the inverse of what we built in PR-04!

---

## Questions?

**Q: Why not just fetch courses every time we need them?**  
A: We do! The catalog is fetched fresh on mount. But we don't store full courses in `db.json` because they could change in the Legacy API.

**Q: What if a course ID in `courseSequence` doesn't exist anymore?**  
A: Great question—PR-05 will handle this with error handling (skip missing courses or show a warning).

**Q: Can I run json-server on a different port?**  
A: Yes! Update `package.json`:
```json
"dev": "concurrently \"vite\" \"json-server --watch db.json --port 4000\""
```
And update `src/api/utils.ts`:
```typescript
export const LOCAL_API_BASE = 'http://localhost:4000';
```

**Q: How do I reset the database?**  
A: Just delete the extra entries from `db.json` manually. json-server will pick up the changes automatically (thanks to `--watch`).

---

**🎉 Congratulations!** You now understand the hybrid data architecture and how all 8 files work together to enable persistent program creation.
