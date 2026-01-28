# PR #43 Tutorial: Advanced Filtering Logic

**Objective**: Implement text search and enrollment status filtering in StudentProgressView with AND logic combination.

**Focus**: Filter behavior only (no UI components). This teaches you syntax fluency and when to break code into granular steps.

---

## Part 1: Understanding the Foundation (15 min)

### Goal

Understand how the existing `selectedPrograms` filter works as a blueprint for what we'll build.

### 1.1 The Current Filter System

Open `src/components/progress/StudentProgressView.tsx` and find the `filteredCourses` around line 190-193:

```typescript
const filteredCourses =
  selectedPrograms.length > 0
    ? flatCourses.filter((row) => selectedPrograms.includes(row.program.id))
    : flatCourses;
```

**What's happening here?**

This is using a **ternary operator** pattern: `condition ? whenTrue : whenFalse`

- **Condition**: Is `selectedPrograms.length > 0`? (Are any programs selected?)
- **When True**: Filter flatCourses to only rows where the program ID is in selectedPrograms
- **When False**: Show all flatCourses unfiltered

**Why is this "derived state"?**

`filteredCourses` is **not** stored in state (no `useState`). Instead, it's **computed** from other state on every render. When `selectedPrograms` changes, React re-computes `filteredCourses` automatically.

**Visual Data Flow**:

```
[flatCourses] → [selectedPrograms.length > 0?]
                      ↓ YES                    ↓ NO
            [filter by program]          [show all]
                      ↓
              [filteredCourses] → [Table renders]
```

### 1.2 Breaking Down `.filter()`

The `.filter()` method is like a **bouncer at a club**: it keeps only items that pass a test.

**Anatomy**:

```typescript
array.filter((item) => booleanTest);
```

The arrow function `(row) => ...` receives each item and must return `true` (keep it) or `false` (remove it).

In our case:

```typescript
.filter((row) => selectedPrograms.includes(row.program.id))
```

This translates to: "Keep only rows where the program ID is inside the selectedPrograms array."

**The `.includes()` method**: Checks if an array contains a value. Returns `true` or `false`.

---

### 🎬 Exercise: Pseudocode Practice

**Write pseudocode** (not real code, just the logic in English) for:

> "Filter courses to only show those where the status is 'Completed'"

Think about:

- What array are you filtering?
- What condition must pass?
- What field are you checking?

(Write this down before continuing.)

---

## Part 2: Adding New State Variables (5 min)

### Goal

Add state for text search and status filtering. These will drive the new filter logic.

### 2.1 Where to Add Them

Open `StudentProgressView.tsx` and find the other state declarations around lines 25-40:

```typescript
const [student, setStudent] = useState<LearnerProfile | null>(null);
const [hydratedPrograms, setHydratedPrograms] = useState<HydratedProgram[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [selectedPrograms, setSelectedPrograms] = useState<Array<string>>([]);
const [flatCourses, setFlatCourses] = useState<Array<CourseRow>>([]);
```

**After the existing state declarations**, add your three new variables:

```typescript
const [searchText, setSearchText] = useState<string>("");
const [selectedStatuses, setSelectedStatuses] = useState<CourseStatus[]>([]);
const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
```

### 2.2 Understanding These Declarations

**Why `""` (empty string)?**

- `searchText` starts empty because there's no search yet
- Empty string means "no filtering by search"

**Why `[]` (empty array)?**

- `selectedStatuses` and `selectedLevels` start empty because no options are selected yet
- Empty array means "no filtering active" for that dropdown

**Why `CourseStatus[]` for statuses but `string[]` for levels?**

- `CourseStatus` is a TypeScript type defined in `src/types/models.ts`
- It's a union type: `"Completed" | "Incomplete" | "Not Enrolled"`
- Using `CourseStatus[]` is more **type-safe** than `string[]`
- If someone tries to add `"Pending"` (not a valid status), TypeScript will error
- `selectedLevels` uses `string[]` because levels like "Basic" and "Advanced" are simple strings without a dedicated type

**When do we need angle brackets `<type>`?**

- `useState<string>("")` - TypeScript can infer it's a string from `""`
- `useState<CourseStatus[]>([])` - TypeScript **cannot** infer this from `[]` alone (is it string[], number[], CourseStatus[]?)
- Rule: If TypeScript can't figure it out, use angle brackets

---

### ✍️ Your Task

Write these three state declarations in your code at the correct location.

---

## Part 3: The Search Helper Function (20 min)

### Goal

Build a reusable function that checks if a **single course row** matches the search text.

**Context**: This function is **specifically for text search only**. Later in Part 5, we'll combine this with dropdown filters (Status, Level) using AND logic. See section 3.1 below for clarification.

### 3.1 Understanding the Problem

We need to search across **three specific fields**:

```
CourseRow
  ├─ course.courseId        ← search here (Course ID, converted to string)
  ├─ course.courseTitle     ← search here (Course Name)
  └─ program.programName    ← search here (Program Name)
```

**Why only these fields?**

- **Status** and **Level** will have their own dedicated dropdown menus (like the screenshot you shared)
- The **text search box** is for free-text queries across IDs, names, and titles
- This prevents confusion and gives users a clear visual of all available Status/Level options

**Requirements**:

- Search should be **case-insensitive** (lowercase and UPPERCASE should both match)
- If the search box is empty, everything matches (no filtering)
- If ANY field contains the search text, return true

### 3.2 Building the Function Step-by-Step

**Where to place it**: Before the `filteredCourses` logic (around line 195)

### Step 1: Function Signature

Write the function declaration:

```typescript
function matchesSearch(row: CourseRow, search: string): boolean {
  // We'll fill this in next
}
```

**What this means**:

- **Input**: Takes a `CourseRow` (one course) and a `search` string
- **Output**: Returns `true` or `false` depending on whether it matches

### Step 2: Handle the Empty Search Edge Case

**Early return pattern**: Return immediately if the condition is met, instead of wrapping everything in an if statement.

```typescript
function matchesSearch(row: CourseRow, search: string): boolean {
  // If search is empty or just whitespace, everything matches
  if (search.trim() === "") {
    return true;
  }

  // Rest of function goes here
}
```

**Why do this?**

- Clarity: "If search is empty, exit early" is obvious
- Avoids nesting: Rest of code isn't indented inside an if block

**What is `.trim()`?**

- Removes whitespace from both ends: `"  hello  ".trim()` → `"hello"`
- Useful because user might type spaces: `"  "`

### Step 3: Convert Search to Lowercase ONCE

```typescript
function matchesSearch(row: CourseRow, search: string): boolean {
  if (search.trim() === "") {
    return true;
  }

  // Convert to lowercase ONCE and store
  const searchLower = search.toLowerCase();

  // Rest of function goes here
}
```

**Why store it in a variable?**

- **Performance**: We're about to check 3 fields. If we call `.toLowerCase()` 3 times, we're doing the same work 3 times
- **Readability**: `searchLower` is clearer than `search.toLowerCase()` repeated everywhere

### Step 4: Check Each Field

Now we check if any field matches. Use the `||` (OR) operator:

```typescript
function matchesSearch(row: CourseRow, search: string): boolean {
  if (search.trim() === "") {
    return true;
  }

  const searchLower = search.toLowerCase();

  // If ANY field matches, return true
  return (
    row.course.courseId.toString().includes(searchLower) ||
    row.course.courseTitle.toLowerCase().includes(searchLower) ||
    row.program.programName.toLowerCase().includes(searchLower)
  );
}
```

**Breaking this down**:

- `row.course.courseId.toString()` converts the numeric ID to a string (so we can search "101")
- `.toLowerCase()` converts text fields to lowercase for case-insensitive search
- `.includes(searchLower)` checks if that field contains the search text
- `||` (OR) means: if **ANY** of these is true, the whole expression is true

**Why `.toString()` but not `.toLowerCase()` for courseId?**

- `courseId` is a `number` type, not a string
- Numbers don't have a `.toLowerCase()` method
- We convert to string first, then check if it includes the search text
- Since IDs are numeric, they're already "case-insensitive"

**Trade-off: One-liner vs Multi-line**

Above, we wrote it as one `return` statement with `||`. We **could** break it down more:

```typescript
const matchesId = row.course.courseId.toString().includes(searchLower);
const matchesTitle = row.course.courseTitle.toLowerCase().includes(searchLower);
const matchesProgram = row.program.programName.toLowerCase().includes(searchLower);

return matchesId || matchesTitle || matchesProgram;
```

**Which is better?**

- **One-liner**: More concise, but requires reading all conditions at once
- **Multi-variable**: More granular, easier to debug (can console.log each check)

**For learning**, the multi-variable approach is better. You'll get fluency with the one-liner later.

---

### ✍️ Your Task

Implement the `matchesSearch` function using the 4-step structure. Start granular (multiple variables for each field check). You can condense it later once it works.

---

## Part 4: Understanding AND Logic with Multiple Filters (15 min)

### Goal

Understand how **three separate filters combine** to narrow down results.

### 4.1 The Mental Model: Three Bouncers at the Club

Imagine a VIP club with three security checkpoints:

- **Bouncer 1** (Program Filter): Checks if your program badge is in the VIP list
- **Bouncer 2** (Status Filter): Checks if your status badge matches what we're looking for
- **Bouncer 3** (Search Filter): Checks if your name appears in the search results

A course must pass **ALL THREE** bouncers to make it into the final filtered list.

```
Course → Bouncer 1 (Program?) → Bouncer 2 (Status?) → Bouncer 3 (Search?) → Filtered List
           YES/NO                YES/NO               YES/NO
```

### 4.2 AND Logic (`&&`) Explained

**AND logic rules**:

```
true  && true  && true   = true   (all pass)
true  && false && true   = false  (one fails)
false && true  && true   = false  (one fails)
true  && true  && false  = false  (one fails)
```

All must be `true` for the result to be `true`. One `false` ruins everything.

**This is different from OR logic (`||`)**:

```
true  || false || false  = true   (only one needs to be true)
false || false || false  = false  (all fail)
```

### 4.3 "Matches All" vs "Matches Any"

**Matches ALL (AND logic)**:

- Course must match program **AND** status **AND** search
- Progressive narrowing: start with all, remove non-matches
- Example: "Show me React courses that are Incomplete and have 'advanced' in the name"

**Matches ANY (OR logic)**:

- Course matches program **OR** status **OR** search
- Progressive expansion: keep anything that qualifies
- Example: "Show me React courses OR Java courses OR Python courses"

**We're using AND** because we want to filter progressively.

### 4.4 Breaking Down the Combined Filter Pattern

**Important Clarification**: Right now in your code, you have the **old ternary-based filteredCourses** from earlier in the project:

```typescript
const filteredCourses =
  selectedPrograms.length > 0
    ? flatCourses.filter((row) => selectedPrograms.includes(row.program.id))
    : flatCourses;
```

In **Part 5**, you'll **replace this entire thing** with the new combined filter pattern shown below. This section (4.4) shows you what the **new structure will look like**.

Instead of a big nested ternary, we'll structure our filter like this:

```typescript
const filteredCourses = flatCourses.filter((row) => {
  // Check 1: Does this row pass the program filter?
  const matchesLevel = /* boolean */;

  // Check 2: Does this row pass the status filter?
  const matchesStatus = /* boolean */;

  // Check 3: Does this row pass the search filter?
  const matchesSearchText = /* boolean */;

  // Combine with AND: must pass ALL THREE
  return matchesLevel && matchesStatus && matchesSearchText;
});
```

**Why break into named variables?**

1. **Readability**: Each boolean's name explains what it checks
2. **Debugging**: Can console.log each one individually
3. **Understanding**: Easy to see the three separate concerns

**Granular vs Condensed**:

- Could write: `return check1 && check2 && check3;` (one line)
- Could write: separate variables (multiple lines + return)
- **Trade-off**: Clarity vs brevity

For learning, granular is better. You'll recognize the pattern and can condense later.

---

## Part 5: Implementing the Combined Filter (25 min)

### Goal

Replace the old `filteredCourses` with new logic that combines all three filters.

### 5.1 The Big Picture

**Understanding the Three Layers of Filtering**:

```
LAYER 1: DROPDOWN FILTERS (Categorical)
├─ matchesStatus     ← Status dropdown (Completed, Incomplete, Not Enrolled)
└─ matchesLevel      ← Level dropdown (Basic, Advanced, etc.) [future PR #44]

LAYER 2: TEXT SEARCH (Free-text)
└─ matchesSearchText ← Calls matchesSearch() helper from Part 3
                       Searches only: courseId, courseTitle, programName
                       User types in text input

LAYER 3: COMBINE WITH AND LOGIC
└─ All checks must be true for a course to be included in filtered results
```

**How it works together**:

- **Status & Level dropdowns** handle enumerated/categorical values (checkboxes for fixed options)
- **Text search** handles free-text queries (user can type anything in the search box)
- **AND logic** means a course must pass ALL active filters to appear in results

**Note**: The old `selectedPrograms` (Programs dropdown) is being replaced by Status and Level dropdowns in this PR.

---

**Current code** (the old version you need to replace):

```typescript
const filteredCourses =
  selectedPrograms.length > 0
    ? flatCourses.filter((row) => selectedPrograms.includes(row.program.id))
    : flatCourses;
```

**What we're building** (the new combined filter):

```typescript
const filteredCourses = flatCourses.filter((row) => {
  // LAYER 1: Dropdown Filters (categorical/enumerated values)
  const matchesStatus = /* ... */;     // Check: Is this course's status selected?
  const matchesLevel = /* ... */;      // Check: Is this course's level selected?

  // LAYER 2: Text Search (free-text across specific fields)
  const matchesSearchText = /* ... */; // Check: Does courseId/courseTitle/programName match search?

  // LAYER 3: Combine with AND
  // Course only appears if it passes ALL checks
  return matchesStatus && matchesLevel && matchesSearchText;
});
```

**Key differences**:

1. **Delete the old ternary** — it only filters by program
2. **Write the new filter** — it combines BOTH dropdown filters AND text search with AND logic
3. **Structure**: We're always calling `.filter()`, not using a ternary. The logic for "show all when filter is empty" is **inside** each individual check (we'll see this in 5.2)

### 5.2 Building Each Check

#### Check 1: matchesStatus

**Logic**:

- If no statuses are selected, show all courses → match
- If statuses are selected, show only those statuses → check if row's status is in the list

**Pattern**:

```typescript
const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
```

**Why `||` here but `&&` later?**

- This is **one check** with a fallback: "If the filter is empty **OR** this course matches the filter"
- Then later, all checks combine with `&&`

Think of it as: "Does this course pass the status check?"

- If no status filter is active, answer is always "yes" (true)
- If a status filter is active, answer is "yes" only if it's in the list

#### Check 2: matchesLevel (Future PR #44)

**Same pattern as matchesStatus**:

```typescript
const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(row.course.levelName);
```

**Logic**:

- If no levels are selected, show all → match
- If levels are selected, show only those levels → check if row's level is in the list

**Note**: In this PR (#43), you'll focus on Status. The Level dropdown will be added in future PR #44.

#### Check 3: matchesSearchText

**Call the helper function we wrote earlier**:

```typescript
const matchesSearchText = matchesSearch(row, searchText);
```

**Simple!** We already did the complex logic in the helper function (Part 3).

**Important**: `matchesSearch()` only cares about the three text fields:

- `courseId` (converted to string)
- `courseTitle`
- `programName`

It doesn't know about Status or Level — those are handled by separate checks above (`matchesStatus`, and future `matchesLevel`).

### 5.3 Putting It All Together

```typescript
const filteredCourses = flatCourses.filter((row) => {
  const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
  const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(row.course.levelName);
  const matchesSearchText = matchesSearch(row, searchText);

  return matchesStatus && matchesLevel && matchesSearchText;
});
```

**How this works**:

1. For each course in flatCourses
2. Calculate three separate boolean values:
   - `matchesStatus` ← Status dropdown filter check (Bouncer 1)
   - `matchesLevel` ← Level dropdown filter check (Bouncer 2) [future PR #44]
   - `matchesSearchText` ← Text search check (Bouncer 3)
3. Return `true` only if all three are `true` (AND logic)
4. Keep only courses that passed all three checks

**Reminder: The Three Layers**:

```
Dropdown Filters (matchesStatus, matchesLevel)
        ↓
Text Search (matchesSearchText via matchesSearch() helper)
        ↓
AND Logic (all must be true)
        ↓
filteredCourses result
```

**Short-circuit evaluation bonus**:
If `matchesStatus` is `false`, JavaScript doesn't even check the other two. It knows the result is `false` already. This is a small performance optimization.

---

### ✍️ Your Task

1. Delete the old `filteredCourses` ternary operator (lines 190-193)
2. Implement the new filter with three named boolean variables
3. Return the combined result with AND logic

---

## Part 6: Where the UI Will Hook In (10 min)

### Goal

Understand how the UI components will **connect** to this logic in PRs #44-45.

### 6.1 The State Contract

Right now, we've created state but nothing **sets** these values:

```typescript
const [searchText, setSearchText] = useState<string>("");
const [selectedStatuses, setSelectedStatuses] = useState<CourseStatus[]>([]);
```

In **PR #44** (Advanced Filter UI), we'll add components that **call the setters**:

- **Text Input Component** → calls `setSearchText(userTypedText)`
- **Status Dropdown** → calls `setSelectedStatuses([...selectedArray])`

Then the magic happens automatically:

**Data Flow Diagram**:

```
USER TYPES "react" IN SEARCH BOX
        ↓
Input component calls: setSearchText("react")
        ↓
searchText state updates to "react"
        ↓
Component re-renders
        ↓
filteredCourses re-computes (because searchText is different)
        ↓
Table gets new filtered data
        ↓
Table re-renders with fewer rows
```

### 6.2 Why Separate Logic from UI?

We could write search logic **inside** an Input component, but we're separating concerns:

**Testability**:

- Can test filter logic without rendering components
- Don't need a real Input to test search functionality

**Flexibility**:

- Could swap the Input component for a different one
- Could use filter logic in multiple places

**Clarity**:

- Each PR has a clear boundary:
  - **PR #43** = Filter logic and state
  - **PR #44** = Filter bar UI components
  - **PR #45** = Empty state messaging

### 🎬 Film Analogy

- **PR #43**: Building the camera rig and lighting setup (invisible infrastructure)
- **PR #44**: Adding actors and props to the scene (visible UI)
- The rig works independently; actors just need to hit their marks

---

## Part 7: Testing Your Implementation (10 min)

### Goal

Verify your filter logic works before UI components are added.

### 7.1 Manual Console Testing

Add temporary console.logs to debug:

```typescript
const filteredCourses = flatCourses.filter((row) => {
  const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(row.course.levelName);
  const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
  const matchesSearchText = matchesSearch(row, searchText);

  // Debug: log the state and results
  console.log("Filters active:", { searchText, selectedLevels, selectedStatuses });
  console.log("Row checks:", { matchesLevel, matchesStatus, matchesSearchText });

  return matchesProgram && matchesStatus && matchesSearchText;
});

console.log("Filtered results:", filteredCourses.length);
```

**Remove these logs once you're confident the logic works.**

### 7.2 React DevTools Practice

You can't type into the filter UI yet (no PR #44), but you can **manually edit state** in React DevTools:

1. Open React DevTools browser extension
2. Find StudentProgressView component
3. Click the component in the tree
4. In the console, manually change state:
   ```javascript
   // Find the state setter (React stores this)
   // Then call it manually to test
   ```

Or simpler: **Directly edit the state value** in the DevTools panel and watch `filteredCourses` update.

### 7.3 Test Scenarios

**Scenario 1**: Empty filters (defaults)

- `searchText = ""`
- `selectedPrograms = []`
- `selectedStatuses = []`
- **Expected**: Should show all courses from flatCourses

**Scenario 2**: Only search filter

- Use DevTools to set `searchText = "react"`
- Keep others empty
- **Expected**: Should show only courses with "react" in title/level/type/program

**Scenario 3**: Only status filter

- Use DevTools to set `selectedStatuses = ["Completed"]`
- Keep others empty
- **Expected**: Should show only completed courses

**Scenario 4**: All three filters

- Combine all above
- **Expected**: Only courses that match ALL THREE conditions should appear

---

## Key Concepts Summary

### 1. Derived State Pattern

- `filteredCourses` is **not** stored in state
- It's **computed** from other state on every render
- When dependencies change, it automatically re-computes

### 2. Granular vs Condensed Code

- Start with **multiple variables** for clarity
- Later, you can **condense** for brevity
- Named booleans are "self-documenting" — the code explains itself

### 3. Filter Combination Patterns

- **Single filter**: Can use ternary operator
- **Multiple filters**: Always filter, use boolean logic inside
- **Default behavior**: "Show all when filter is empty" goes inside each check

### 4. Helper Function Benefits

- **Reusable**: Can use `matchesSearch` elsewhere
- **Testable**: Can test in isolation
- **Readable**: Name explains the purpose

---

## Success Checklist

By the end, you should be able to:

- ✅ Add state variables with correct TypeScript types
- ✅ Write a helper function with early returns and string operations
- ✅ Understand when to break code into multiple statements vs one-liners
- ✅ Implement multi-condition filtering with AND logic
- ✅ Explain the difference between stored state and derived state
- ✅ Understand how UI will connect to this logic in future PRs
- ✅ Test the implementation using React DevTools

---

## Files You'll Modify

- `src/components/progress/StudentProgressView.tsx` (add state, helper function, update filteredCourses)

---

## Estimated Time

- Part 1-2: 20 minutes (foundation + state setup)
- Part 3-4: 35 minutes (search function + AND logic understanding)
- Part 5: 25 minutes (combined filter implementation)
- Part 6-7: 20 minutes (UI contract + testing)
- **Total: 90-100 minutes** (1.5-2 hours with breaks)

---

## What's Next

Once PR #43 is complete:

- **PR #44** will add the filter UI bar (search input, status dropdown)
- **PR #45** will improve empty state messages based on active filters

These will hook into the state and logic you build here in PR #43.

Good luck! 🎬
