# PR #44 Tutorial: Advanced Filter UI

**Objective**: Build a filter bar UI above the course table with text search input and multi-select dropdowns for Status and Level filters.

**Focus**: UI components only. The filter logic from PR #43 is already working — we're just adding the visual controls.

---

## Part 1: React Fundamentals You Need (20 min)

### Goal

Understand two critical React concepts before building the UI: controlled components and immutable state updates.

### 1.1 Controlled Components: React Owns the Value

**The Problem:** HTML inputs normally manage their own state. You type, the input updates itself. React wants to control this.

**The Solution:** A **controlled component** means React decides what the input displays.

**The Pattern:**
```typescript
const [searchText, setSearchText] = useState("");

<Input 
  value={searchText}                              // React tells input what to show
  onChange={(e) => setSearchText(e.target.value)} // User typing updates React's state
/>
```

**The Feedback Loop:**

```
1. User types "r" in the input
        ↓
2. onChange fires with event object
        ↓
3. setSearchText("r") called
        ↓
4. searchText state updates to "r"
        ↓
5. Component re-renders
        ↓
6. value={searchText} tells input to show "r"
        ↓
7. Input displays "r"
```

**Why This Matters:**
- React is the "single source of truth"
- You can programmatically change the value (e.g., clear it with `setSearchText("")`)
- The input always reflects your state
- Without `value={searchText}`, the input would manage its own state (uncontrolled)

**Uncontrolled vs Controlled:**

| Uncontrolled | Controlled |
|--------------|-----------|
| `<input />` | `<input value={state} onChange={setState} />` |
| Input manages its own value | React manages the value |
| Hard to clear programmatically | Easy to clear with `setState("")` |
| Can't validate as user types | Can validate in real-time |

**Film Analogy:** 
- **Uncontrolled** = Actor improvises their lines
- **Controlled** = Actor reads from the script (state), director (onChange) updates the script

### 1.2 Immutable State Updates: Why You Can't Use Push

**The Problem:** React needs to detect when state changes to trigger re-renders.

**How React Detects Changes:**
- React uses **reference equality** (`oldState === newState`)
- If the reference is the same, React thinks nothing changed
- If the reference is different, React re-renders

**Why `.push()` Doesn't Work:**

```typescript
// ❌ WRONG - Mutates the array (same reference)
const addStatus = (status) => {
  selectedStatuses.push(status);           // Modifies existing array
  setSelectedStatuses(selectedStatuses);   // Same reference!
};

// React checks:
oldArray === newArray  // TRUE (same reference)
// Result: No re-render! Table doesn't update.
```

**Why Spread Operator Works:**

```typescript
// ✅ CORRECT - Creates new array (new reference)
const addStatus = (status) => {
  setSelectedStatuses([...selectedStatuses, status]);  // New array
};

// React checks:
oldArray === newArray  // FALSE (different reference)
// Result: Re-renders! Table updates.
```

**The Spread Operator `...`:**
- Takes all items from the old array
- Puts them in a new array
- Adds new items to the new array

**Visual Example:**

```
selectedStatuses = ["Completed"]

// Adding "Incomplete":
[...selectedStatuses, "Incomplete"]
        ↓
["Completed", "Incomplete"]  // NEW array in memory
```

**Removing Items (Filter Method):**

```typescript
// ✅ Remove "Completed" from array
selectedStatuses.filter(s => s !== "Completed")

// How filter works:
["Completed", "Incomplete"].filter(s => s !== "Completed")
        ↓
// Keep items where condition is TRUE
// "Completed" !== "Completed" → FALSE (skip it)
// "Incomplete" !== "Completed" → TRUE (keep it)
        ↓
["Incomplete"]  // NEW array
```

**Key Rules for State Arrays:**
1. ✅ Create new arrays with spread: `[...arr, item]`
2. ✅ Create new arrays with filter: `arr.filter(...)`
3. ✅ Create new arrays with map: `arr.map(...)`
4. ❌ NEVER mutate with push: `arr.push(item)`
5. ❌ NEVER mutate with splice: `arr.splice(...)`

**Film Analogy:**
- **Mutation** = Editing the same script page (React doesn't notice the change)
- **Immutable Update** = Printing a new script page (React sees the new page and updates)

### 1.3 The Toggle Pattern (Combining Add + Remove)

When a checkbox is clicked, you need to:
- **Add** the item if it's NOT in the array
- **Remove** the item if it IS in the array

**The Pattern:**

```typescript
const toggleStatus = (status) => {
  setSelectedStatuses((prev) =>
    prev.includes(status)              // Is it already selected?
      ? prev.filter(s => s !== status) // YES → Remove it
      : [...prev, status]              // NO → Add it
  );
};
```

**Breaking This Down:**

1. `prev.includes(status)` - Check if status is in the array (returns true/false)
2. `? ... : ...` - Ternary operator (like an if/else)
3. If TRUE (already selected): `prev.filter(s => s !== status)` removes it
4. If FALSE (not selected): `[...prev, status]` adds it

**Why Use `prev` Parameter?**

```typescript
setSelectedStatuses((prev) => ...)
```

The setter function can take a **function** that receives the previous state:
- `prev` is always the most recent state value
- Safer for rapid updates (if user clicks multiple checkboxes quickly)
- Pattern recommended by React team

**Example Walkthrough:**

```
Initial: selectedStatuses = []

User checks "Completed":
  → prev.includes("Completed") → FALSE
  → [...prev, "Completed"]
  → Result: ["Completed"]

User checks "Incomplete":
  → prev.includes("Incomplete") → FALSE
  → [...prev, "Incomplete"]
  → Result: ["Completed", "Incomplete"]

User unchecks "Completed":
  → prev.includes("Completed") → TRUE
  → prev.filter(s => s !== "Completed")
  → Result: ["Incomplete"]
```

---

## Part 2: Understanding the Foundation (10 min)

### Goal

Understand how the existing filter state from PR #43 will connect to the UI components you're about to build.

### 2.1 The State Contract from PR #43

Open `src/components/progress/StudentProgressView.tsx` and find the state variables around lines 30-40:

```typescript
const [searchText, setSearchText] = useState<string>("");
const [selectedStatuses, setSelectedStatuses] = useState<CourseStatus[]>([]);
const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
```

**What's already working?**

- `filteredCourses` is computed using these three state variables
- `clearFilters()` function resets all three
- Filter logic uses AND logic to combine all active filters

**What we're building:**

UI components that **call the setter functions** to update these state values:
- Text input calls `setSearchText(userTypedValue)`
- Status dropdown calls `setSelectedStatuses([...selectedArray])`
- Level dropdown calls `setSelectedLevels([...selectedArray])`

### 2.2 The Film Set Analogy

Think of PR #43 as building the **camera rig and lighting** (invisible infrastructure). PR #44 is adding the **actors and props** (visible UI) that interact with that infrastructure.

**The Contract:**
- **State** = The script (what should be filtered)
- **Setter functions** = Director's cues (how to change the state)
- **UI components** = Actors (execute the cues when user interacts)

When the user types in the search box, the Input component (actor) calls `setSearchText()` (director's cue), which updates `searchText` state (the script), which triggers a re-render that recomputes `filteredCourses` (the final scene).

---

## Part 3: Understanding Shadcn/UI Components (15 min)

### Goal

Learn which UI components you'll use and how they work together.

### 3.1 The Component Toolkit

You'll use **4 main shadcn/ui components**:

**1. Input** (`src/components/ui/input.tsx`)
- For text search box
- Built-in focus states and placeholder styling
- Connects to `searchText` state

**2. DropdownMenu** (`src/components/ui/dropdown-menu.tsx`)
- For Status and Level multi-select dropdowns
- Includes `DropdownMenuCheckboxItem` for checkboxes
- Portal-based (floats above content)

**3. Badge** (`src/components/ui/badge.tsx`)
- For showing active filter count (e.g., "Status (2)")
- Outline variant for subtle display

**4. Button** (`src/components/ui/button.tsx`)
- For "Clear Filters" action
- Already used in the component (you'll move it)

### 3.2 Import Statements

At the top of `StudentProgressView.tsx`, you'll need to add:

```typescript
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**Note**: Badge and Button are already imported.

### 3.3 The Sharp Corner Styling (Lyra Theme)

This project uses **sharp corners** (no border radius) as defined in `src/index.css`:

```css
--radius: 0rem;
```

All components will render with square corners automatically. You don't need to override this — it's the design system.

**Brand Colors Available:**
- `--primary`: Orange (#ff5000) - main action color
- `--phillips-blue`: #005596
- `--phillips-red`: #D31245
- `--muted`: Light gray backgrounds
- `--border`: Light gray borders (#e5e5e5)

---

## Part 4: Building the Text Search Input (15 min)

### Goal

Create a controlled text input that updates `searchText` state as the user types.

### 4.1 Understanding Controlled Inputs (Review from Part 1)

Remember from Part 1: A **controlled input** means React manages its value.

```typescript
<Input
  value={searchText}           // React controls what's displayed (Part 1.1)
  onChange={(e) => setSearchText(e.target.value)}  // User typing updates state
/>
```

**The Controlled Component Loop (Review):**
1. User types → onChange fires
2. setSearchText() updates state
3. Component re-renders
4. value={searchText} tells input what to show
5. filteredCourses recomputes with new searchText
6. Table updates

**Why `e.target.value`?** (From your answer to Q3)
- `e` = the event object React passes to onChange
- `e.target` = the input element itself
- `e.target.value` = the text currently in the input (what user just typed)

**The Flow with Filter Logic:**
```
User types "react"
    ↓
onChange fires with event (e.target.value = "react")
    ↓
setSearchText("react") called
    ↓
searchText state updates to "react"
    ↓
Component re-renders
    ↓
filteredCourses recomputes (matchesSearchText checks "react")
    ↓
Table shows filtered results
```

### 4.2 The Input Component Structure

**Where to place it:** After the metrics cards section, before the table (around line 320).

Look for this comment or the section with the "Clear Filters" button:

```typescript
{/* FILTER BAR GOES HERE */}
```

**Basic structure** (you'll build this step by step):

```typescript
<div className="flex items-center gap-2 mb-4">
  {/* Search input */}
  <Input
    placeholder="Search by Course ID, Title, or Program..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="max-w-sm"
  />
  
  {/* Status and Level dropdowns will go here */}
  {/* Clear Filters button will go here */}
</div>
```

### 4.3 Understanding the Event Object

When you type in an input, React passes an **event object** to `onChange`:

```typescript
onChange={(e) => setSearchText(e.target.value)}
```

**Breaking this down:**
- `e` = the event object
- `e.target` = the input element itself
- `e.target.value` = the current text in the input

**Why use `e.target.value` instead of just `value`?**
- `value` is a prop you pass TO the input
- `e.target.value` is what the user JUST typed
- You extract the new value from the event and pass it to the setter

### 4.4 Placeholder Text Best Practices

The placeholder should describe **what can be searched**:

```typescript
placeholder="Search by Course ID, Title, or Program..."
```

This matches the three fields checked by `matchesSearch()` from PR #43:
- `courseId` (Course ID)
- `courseTitle` (Title)
- `programName` (Program)

**Why include this?** Users need to know what they can search for. If they try searching by status ("Completed") and get no results, they'll be confused — status is a dropdown, not a text search.

### ✍️ Your Task

Create the filter bar container div with the search input. Use the structure from 4.2 above.

**Tips:**
- Place it after the metrics cards (around line 320)
- Use `flex items-center gap-2` for horizontal layout
- Use `mb-4` to add space before the table
- Use `max-w-sm` on the Input to constrain its width (384px)

---

## Part 5: Building the Status Dropdown (25 min)

### Goal

Create a multi-select dropdown with checkboxes for the three CourseStatus values.

### 5.1 Understanding DropdownMenu Structure

The DropdownMenu component has **two main parts**:

**1. Trigger** - The button you click to open the menu
**2. Content** - The menu that appears (checkboxes, labels, etc.)

**Basic pattern:**

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      {/* Button content */}
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent>
    {/* Checkbox items */}
  </DropdownMenuContent>
</DropdownMenu>
```

**Why `asChild`?** This tells Radix UI to use the Button as the trigger element instead of creating a new wrapper element. It's a pattern for better accessibility and DOM structure.

### 5.2 The Trigger Button with Active Count

The trigger should show:
- The label "Status"
- A badge with the count of selected statuses (e.g., "(2)")
- A chevron icon indicating it's a dropdown

**Structure:**

```typescript
<DropdownMenuTrigger asChild>
  <Button variant="outline" className="gap-2">
    Status
    {selectedStatuses.length > 0 && (
      <Badge variant="outline" className="ml-1">
        {selectedStatuses.length}
      </Badge>
    )}
  </Button>
</DropdownMenuTrigger>
```

**Breaking this down:**
- `variant="outline"` = Border style (not filled)
- `className="gap-2"` = Space between text and badge
- Conditional render: `{condition && <Component />}` = Only show badge if statuses are selected
- `selectedStatuses.length` = Count how many statuses are selected

**Why show the count?**
- Visual feedback that filters are active
- User knows how many statuses they've selected
- Encourages them to use the "Clear Filters" button

### 5.3 The DropdownMenuContent Structure

The content includes:
- A label (section header)
- Three checkbox items (one for each status)
- Separator (optional visual divider)

**Pattern:**

```typescript
<DropdownMenuContent className="w-48">
  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
  <DropdownMenuSeparator />
  
  {/* Checkbox items */}
  <DropdownMenuCheckboxItem
    checked={selectedStatuses.includes("Completed")}
    onCheckedChange={(checked) => {
      /* update state */
    }}
  >
    Completed
  </DropdownMenuCheckboxItem>
  
  {/* More items... */}
</DropdownMenuContent>
```

**Key props:**
- `className="w-48"` = Fixed width (192px) for consistent dropdown size
- `checked={boolean}` = Whether the checkbox is checked
- `onCheckedChange={(checked) => {...}}` = Function called when user clicks

### 5.4 Handling Multi-Select State (Immutable Updates from Part 1)

When a user clicks a checkbox, you need to:
- **Add** the status to the array if it's not there
- **Remove** the status from the array if it's already there

**The toggle pattern:**

```typescript
onCheckedChange={(checked) => {
  if (checked) {
    // Add to array (Part 1.2: Immutable update with spread operator)
    setSelectedStatuses([...selectedStatuses, "Completed"]);
  } else {
    // Remove from array (Part 1.2: Immutable update with filter)
    setSelectedStatuses(selectedStatuses.filter(s => s !== "Completed"));
  }
}}
```

**Why this works:**
- `checked` parameter is `true` when user checks, `false` when unchecks
- `[...selectedStatuses, "Completed"]` = Spread operator creates **new array** with added item
- `selectedStatuses.filter(s => s !== "Completed")` = Creates **new array** without "Completed"

**Review from Part 1.2: Why not push/splice?**
```typescript
// ❌ WRONG
selectedStatuses.push("Completed");           // Mutates array (same reference)
setSelectedStatuses(selectedStatuses);        // React doesn't see change!

// ✅ CORRECT
setSelectedStatuses([...selectedStatuses, "Completed"]);  // New array reference
```

Remember: React uses **reference equality** to detect changes. Mutation keeps the same reference, so React won't re-render the table!

### 5.5 Creating a Toggle Helper Function (The Pattern from Part 1.3)

Instead of repeating the toggle logic for each checkbox, create a helper using the pattern from Part 1.3:

```typescript
function toggleStatus(status: CourseStatus) {
  setSelectedStatuses((prev) =>
    prev.includes(status)                // Is status already in array? (Part 1.3)
      ? prev.filter((s) => s !== status) // YES → Remove it (immutable)
      : [...prev, status]                // NO → Add it (immutable)
  );
}
```

**Review from Part 1.3: Why use `prev` parameter?**
- `setSelectedStatuses()` can take a **function** that receives the previous state
- `prev` is always the most recent value (safer for rapid clicks)
- Pattern recommended by React team

**The Ternary Breakdown (Part 1.3):**
1. `prev.includes(status)` → Check if already selected (returns true/false)
2. `? ... : ...` → Ternary operator (if-else shorthand)
3. If TRUE: `prev.filter(s => s !== status)` → Remove by creating new array without it
4. If FALSE: `[...prev, status]` → Add by creating new array with it

**Using the helper:**

```typescript
<DropdownMenuCheckboxItem
  checked={selectedStatuses.includes("Completed")}
  onCheckedChange={() => toggleStatus("Completed")}
>
  Completed
</DropdownMenuCheckboxItem>
```

**Note:** We don't need the `checked` parameter anymore since the helper handles both add/remove automatically based on current state.

### 5.6 Putting It All Together

**Full Status dropdown structure:**

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      Status
      {selectedStatuses.length > 0 && (
        <Badge variant="outline" className="ml-1">
          {selectedStatuses.length}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent className="w-48">
    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    <DropdownMenuCheckboxItem
      checked={selectedStatuses.includes("Completed")}
      onCheckedChange={() => toggleStatus("Completed")}
    >
      Completed
    </DropdownMenuCheckboxItem>
    
    <DropdownMenuCheckboxItem
      checked={selectedStatuses.includes("Incomplete")}
      onCheckedChange={() => toggleStatus("Incomplete")}
    >
      Incomplete
    </DropdownMenuCheckboxItem>
    
    <DropdownMenuCheckboxItem
      checked={selectedStatuses.includes("Not Enrolled")}
      onCheckedChange={() => toggleStatus("Not Enrolled")}
    >
      Not Enrolled
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### ✍️ Your Task

1. Create the `toggleStatus()` helper function near your other functions (around line 225)
2. Add the Status dropdown to your filter bar (next to the search input)
3. Test it by clicking checkboxes and watching the table filter

---

## Part 6: Building the Level Dropdown (20 min)

### Goal

Create a second multi-select dropdown for course levels, following the same pattern as Status.

### 6.1 Understanding the Difference

The Status dropdown uses `CourseStatus[]` type:
- Strongly typed: `"Completed" | "Incomplete" | "Not Enrolled"`

The Level dropdown uses `string[]` type:
- Simple strings: `"Basic"`, `"Advanced"`, etc.
- Values come from `row.course.levelName`

**Why the difference?**
- `CourseStatus` has a dedicated type in `models.ts` because it's critical to the business logic
- Levels are just descriptive strings from the course catalog
- TypeScript allows both patterns

### 6.2 What Level Values Exist?

You'll need to determine what level values are actually in the data. Common patterns:
- "Basic", "Advanced"
- "Beginner", "Intermediate", "Advanced"
- "Level 1", "Level 2", "Level 3"

**How to find out:**

Add a temporary `console.log` to see what's in your data:

```typescript
useEffect(() => {
  const uniqueLevels = Array.from(new Set(flatCourses.map(row => row.course.levelName)));
  console.log("Available levels:", uniqueLevels);
}, [flatCourses]);
```

**What this does:**
- `flatCourses.map(row => row.course.levelName)` = Get all level names
- `new Set(...)` = Remove duplicates
- `Array.from(...)` = Convert Set back to array
- Logs the unique levels

**For this tutorial, we'll assume:** `["Basic", "Advanced"]`

### 6.3 Creating the Toggle Helper

Same pattern as Status, but for strings:

```typescript
function toggleLevel(level: string) {
  setSelectedLevels((prev) =>
    prev.includes(level)
      ? prev.filter((l) => l !== level)
      : [...prev, level]
  );
}
```

**Difference from `toggleStatus`:**
- Parameter type is `string` instead of `CourseStatus`
- Variable name is `l` instead of `s` (for clarity)
- Otherwise identical logic

### 6.4 The Level Dropdown Structure

**Same pattern as Status dropdown:**

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      Level
      {selectedLevels.length > 0 && (
        <Badge variant="outline" className="ml-1">
          {selectedLevels.length}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent className="w-48">
    <DropdownMenuLabel>Filter by Level</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    <DropdownMenuCheckboxItem
      checked={selectedLevels.includes("Basic")}
      onCheckedChange={() => toggleLevel("Basic")}
    >
      Basic
    </DropdownMenuCheckboxItem>
    
    <DropdownMenuCheckboxItem
      checked={selectedLevels.includes("Advanced")}
      onCheckedChange={() => toggleLevel("Advanced")}
    >
      Advanced
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Note:** If your data has different level names, adjust the checkbox items accordingly.

### 6.5 Dynamic Level Rendering (Optional Advanced)

Instead of hardcoding level names, you can generate them dynamically:

```typescript
const availableLevels = Array.from(new Set(flatCourses.map(row => row.course.levelName)));

{/* In your dropdown content: */}
{availableLevels.map((level) => (
  <DropdownMenuCheckboxItem
    key={level}
    checked={selectedLevels.includes(level)}
    onCheckedChange={() => toggleLevel(level)}
  >
    {level}
  </DropdownMenuCheckboxItem>
))}
```

**Why this is better:**
- Automatically adapts to your data
- No need to hardcode level names
- Won't break if data changes

**Why this is harder:**
- Requires understanding `.map()` for rendering lists
- Need to compute `availableLevels` from data
- Adds complexity

**For learning, start with hardcoded levels**. You can refactor to dynamic later.

### ✍️ Your Task

1. Create the `toggleLevel()` helper function
2. Add the Level dropdown to your filter bar (after Status dropdown)
3. Test by selecting levels and watching the table filter

---

## Part 7: Moving the Clear Filters Button (10 min)

### Goal

Move the existing "Clear Filters" button into your new filter bar.

### 7.1 Finding the Existing Button

Search for this code (around line 327):

```typescript
{selectedLevels.length > 0 || selectedStatuses.length > 0 || searchText !== "" && (
  <Button size="sm" onClick={() => clearFilters()} className="gap-2">
    Clear Filters
    <X className="h-5 w-5" />
  </Button>
)}
```

**Current location:** It's likely below the filter bar area, separate from the other controls.

### 7.2 Understanding the Conditional Render

This button only shows when at least one filter is active:

```typescript
{condition && <Component />}
```

**The condition:**
```typescript
selectedLevels.length > 0 || selectedStatuses.length > 0 || searchText !== ""
```

**Breaking this down:**
- `||` means "OR" (any one can be true)
- If any filter has a value, show the button
- If all filters are empty, hide the button

**Why hide it when filters are empty?**
- No need to clear if nothing is filtered
- Cleaner UI (less visual clutter)
- Clear intent (button appears when filters are active)

### 7.3 Moving to Filter Bar

**Cut** the button code from its current location and **paste** it into your filter bar div:

```typescript
<div className="flex items-center gap-2 mb-4">
  {/* Search input */}
  <Input ... />
  
  {/* Status dropdown */}
  <DropdownMenu>...</DropdownMenu>
  
  {/* Level dropdown */}
  <DropdownMenu>...</DropdownMenu>
  
  {/* Clear Filters button */}
  {(selectedLevels.length > 0 || selectedStatuses.length > 0 || searchText !== "") && (
    <Button size="sm" onClick={() => clearFilters()} className="gap-2">
      Clear Filters
      <X className="h-5 w-5" />
    </Button>
  )}
</div>
```

**Note:** Added parentheses around the condition for readability. This is optional but recommended for complex conditions.

### 7.4 Adjusting Button Styling

The current button uses:
- `size="sm"` = Small size (h-8)
- `className="gap-2"` = Space between text and icon

Consider changing the variant to match the filter bar:

```typescript
<Button 
  variant="outline"      // Match other filter controls
  size="sm" 
  onClick={() => clearFilters()} 
  className="gap-2"
>
  Clear Filters
  <X className="h-5 w-5" />
</Button>
```

**Why `variant="outline"`?**
- Matches the Status/Level dropdown buttons
- Visual consistency (all filter controls look similar)
- Less prominent than filled primary button (it's a secondary action)

### ✍️ Your Task

Move the Clear Filters button into your filter bar and adjust the variant to "outline".

---

## Part 8: Layout and Spacing (10 min)

### Goal

Polish the filter bar layout to ensure proper alignment with the table.

### 8.1 Current Filter Bar Structure

You should now have:

```typescript
<div className="flex items-center gap-2 mb-4">
  <Input ... />
  <DropdownMenu>...</DropdownMenu>
  <DropdownMenu>...</DropdownMenu>
  <Button>...</Button>
</div>
```

**Layout properties:**
- `flex` = Horizontal layout (items in a row)
- `items-center` = Vertically center items
- `gap-2` = 8px space between items
- `mb-4` = 16px margin below (space before table)

### 8.2 Responsive Behavior

On smaller screens, this layout might overflow. Consider wrapping:

```typescript
<div className="flex flex-wrap items-center gap-2 mb-4">
```

**What `flex-wrap` does:**
- Items wrap to next line if not enough space
- Prevents horizontal scrolling
- Maintains gap spacing

### 8.3 Input Width Considerations

The search input uses `max-w-sm` (384px max width). You might want to adjust:

**Options:**
- `max-w-xs` (320px) - Narrower for compact layouts
- `max-w-md` (448px) - Wider for more search text visibility
- `flex-1` - Takes up remaining space (grows to fill)

**Recommendation:** Keep `max-w-sm` unless the filter bar feels cramped.

### 8.4 Adding a Separator (Optional)

For visual separation between filter bar and table, add a separator:

```typescript
import { Separator } from "@/components/ui/separator";

{/* After filter bar */}
<Separator className="mb-4" />
```

**This adds:**
- A thin horizontal line
- Visual boundary between controls and content
- Professional polish

### 8.5 Alignment with Table

The table starts with this structure (around line 340):

```typescript
<div className="border rounded-lg">
  <Table>...</Table>
</div>
```

Your filter bar should be **outside** this div, **above** it:

```
<div className="flex items-center gap-2 mb-4">
  {/* Filter bar */}
</div>

<div className="border rounded-lg">
  <Table>...</Table>
</div>
```

**Why?**
- Filter bar is a control panel (separate from table content)
- Table border doesn't include filters
- Clear visual hierarchy

### ✍️ Your Task

Verify your filter bar is positioned correctly and add flex-wrap for responsive behavior.

---

## Part 9: Testing Your Implementation (15 min)

### Goal

Test all filter interactions and verify the table updates correctly.

### 9.1 Test Scenarios

**Scenario 1: Text Search**
1. Type "react" in the search box
2. Table should show only courses with "react" in ID, Title, or Program
3. Clear the search → all courses reappear

**Scenario 2: Status Filter Only**
1. Click Status dropdown
2. Check "Completed"
3. Table shows only completed courses
4. Check "Incomplete" as well
5. Table shows completed OR incomplete (not Not Enrolled)
6. Uncheck both → all courses reappear

**Scenario 3: Level Filter Only**
1. Click Level dropdown
2. Check "Advanced"
3. Table shows only advanced courses
4. Check "Basic" as well
5. Table shows basic OR advanced courses
6. Uncheck both → all courses reappear

**Scenario 4: Combined Filters (AND Logic)**
1. Type "program" in search
2. Select Status: "Completed"
3. Select Level: "Advanced"
4. Table shows only courses that match ALL THREE:
   - Contains "program" in searchable fields
   - Status is "Completed"
   - Level is "Advanced"
5. Uncheck one filter → results expand (fewer filters = more results)

**Scenario 5: Clear All**
1. Apply multiple filters (search + status + level)
2. Click "Clear Filters" button
3. All filters reset:
   - Search box empties
   - Status checkboxes uncheck
   - Level checkboxes uncheck
   - Table shows all courses

**Scenario 6: Empty Results**
1. Search for "zzzzz" (nonsense text)
2. Table should show "No courses found" (not "No courses assigned")
3. Clear filters → courses reappear

### 9.2 Visual Feedback Checks

**Active Filter Badges:**
- Status dropdown shows "(1)" when 1 status selected
- Status dropdown shows "(2)" when 2 statuses selected
- Level dropdown shows count similarly
- Badge disappears when no options selected

**Clear Filters Button:**
- Hidden when no filters active
- Appears when any filter active
- Disappears after clicking (all filters cleared)

**Dropdown States:**
- Checkmarks appear when option selected
- Checkmarks disappear when option unselected
- Dropdown closes after clicking outside

### 9.3 Console Logging for Debug

Add temporary logs to verify state updates:

```typescript
useEffect(() => {
  console.log("Filter state:", {
    searchText,
    selectedStatuses,
    selectedLevels,
    filteredCount: filteredCourses.length,
  });
}, [searchText, selectedStatuses, selectedLevels, filteredCourses]);
```

**What this shows:**
- Current values of all three filter states
- How many courses match the filters
- Updates every time filters change

**Remove this after testing.**

### 9.4 React DevTools Inspection

If React DevTools work for you:
1. Find `StudentProgressView` component
2. Check "Hooks" panel
3. Watch state values update as you interact
4. Verify `filteredCourses` recomputes correctly

### 9.5 Common Issues

**Issue: Table doesn't update when typing**
- Check: Is Input using `value={searchText}`?
- Check: Is `onChange` calling `setSearchText(e.target.value)`?
- Check: Is `matchesSearch()` returning correct values?

**Issue: Checkboxes don't toggle**
- Check: Is `checked` prop using `selectedStatuses.includes(status)`?
- Check: Is `onCheckedChange` calling the toggle function?
- Check: Is toggle function using spread operator (not push)?

**Issue: Multiple dropdowns interfere**
- Each DropdownMenu should be independent
- Don't share state between Status and Level dropdowns

**Issue: Clear Filters doesn't work**
- Check: Is `clearFilters()` resetting all three state variables?
- Check: Are you calling `clearFilters()` (with parentheses)?

---

## Key Concepts Summary

### 1. Controlled Components

UI components that React manages:
- `value={state}` = Display current state
- `onChange={setState}` = Update state when user interacts
- React is the "single source of truth"

### 2. Multi-Select State Management

Arrays of selected values:
- Check with `.includes(item)`
- Add with spread: `[...prev, item]`
- Remove with `.filter(i => i !== item)`
- Toggle combines both (add if missing, remove if present)

### 3. Conditional Rendering

Show/hide components based on state:
- `{condition && <Component />}` = Show only if condition is true
- `{condition ? <A /> : <B />}` = Show A or B based on condition

### 4. DropdownMenu Pattern

Two-part structure:
- `DropdownMenuTrigger` = Button to open
- `DropdownMenuContent` = Menu that appears
- `DropdownMenuCheckboxItem` = Individual checkbox option

### 5. Badge for Visual Feedback

Small indicator showing active state:
- Show count of selected items
- Only render when count > 0
- Use outline variant for subtle display

---

## Success Checklist

By the end, you should have:

- ✅ Text search input that filters as you type
- ✅ Status dropdown with 3 checkbox options
- ✅ Level dropdown with 2+ checkbox options
- ✅ Active count badges on dropdown buttons
- ✅ Clear Filters button that resets all filters
- ✅ Filters combine with AND logic
- ✅ Empty state shows correct message
- ✅ Filter bar styled with sharp corners (Lyra theme)
- ✅ Responsive layout with flex-wrap
- ✅ All filter interactions update the table in real-time

---

## Files You'll Modify

- `src/components/progress/StudentProgressView.tsx` (add filter bar UI, toggle functions)

**Lines to modify:**
- Import statements (top of file)
- Add toggle helper functions (around line 225)
- Add filter bar UI (around line 320, before table)
- Move Clear Filters button into filter bar

---

## Estimated Time

- Part 1: 20 minutes (React fundamentals - controlled components & immutable state)
- Part 2: 10 minutes (understanding the foundation)
- Part 3: 15 minutes (shadcn/ui components overview)
- Part 4: 15 minutes (text search input)
- Part 5: 25 minutes (status dropdown)
- Part 6: 20 minutes (level dropdown)
- Part 7: 10 minutes (clear button)
- Part 8: 10 minutes (layout polish)
- Part 9: 15 minutes (testing)
- **Total: 2.5 hours** (with breaks)

Note: Part 1 is foundational learning that will help with all future React work, not just this PR.

---

## What's Next

Once PR #44 is complete:

- **PR #45** will improve empty state messages based on active filters
- Future enhancements: sorting, saved filter presets, filter history

You now have a fully functional advanced filter system! 🎬
