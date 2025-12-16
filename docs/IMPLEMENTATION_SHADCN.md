# Implementation Plan: UI Modernization (Shadcn/UI)

**Goal:** Refactor the existing "Bare-Bones" HTML layout into a professional "Application-Grade" UI using `shadcn/ui` components.
**Constraint:** **DO NOT** change business logic (`useProgramBuilder`, `localRoutes`, etc.). Only change the JSX/CSS.
**Timeline:** 3 Days.

---

## 🛠️ Phase 0: Installation & Prep

_Before starting, ensure all base primitives are installed._

1.  **Install Core Primitives:**
    ```bash
    bunx shadcn@latest add sidebar button card badge separator scroll-area input textarea dialog accordion sheet avatar dropdown-menu
    ```
2.  **Verify Tailwind:** Ensure `src/index.css` has the correct color variables (Phillips Blue/Red) mapped to the `:root` so Shadcn components pick them up automatically.

---

## 🗓️ Phase 1: The App Shell (Day 1)

_Goal: Replace the manual "Flexbox Sidebar" with the responsive, accessible `Sidebar` component. This instantly makes the app look like a SaaS product._

### 1. Create `src/components/layout/AppSidebar.tsx`

- **Source:** Port logic from `SidebarNav.tsx`.
- **Shadcn Mapping:**
  - Container → `<Sidebar>`
  - Navigation Group → `<SidebarGroup>`
  - Navigation Item → `<SidebarMenuButton>`
  - "Program Builder" Toggle → `<SidebarMenuSub>` (Nest the saved programs here).
- **Key Change:** Instead of manual `onClick` state for the dropdown, use Shadcn's native `Collapsible` trigger if desired, or keep your simple state inside the new structure.

### 2. Create `src/components/layout/SiteHeader.tsx`

- **New Component:** A consistent top bar living inside the `SidebarInset`.
- **Content:**
  - `<SidebarTrigger>` (The hamburger menu - comes for free).
  - `<Separator orientation="vertical" />`
  - Breadcrumbs (e.g., "Supervisor > Builder").
  - User Avatar (Right side).

### 3. Refactor `App.tsx`

- **Action:** Delete the manual `<div className="flex h-screen">`.
- **Replace with:**
  ```tsx
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      <div className="p-4 flex-1 overflow-hidden">
        <PageContent />
      </div>
    </SidebarInset>
  </SidebarProvider>
  ```

---

## 🗓️ Phase 2: The Builder & Layouts (Day 2)

_Goal: Remove raw `div` scrolling and borders. Use `Card` and `ScrollArea` to manage screen real estate._

### 1. Refactor `CourseCard.tsx`

- **Current:** `div` with border classes.
- **New:** `<Card>`
  - Title/Image → `<CardHeader>`
  - Metadata badges → `<CardContent>` (Use `<Badge variant="secondary">`)
  - Add Button → `<CardFooter>`
- **Polish:** This instantly standardizes padding, shadows, and borders across the app.

### 2. Refactor `ProgramBuilder.tsx` (The 2-Column Layout)

- **The Container:** Keep the Flexbox/Grid for the split (it works).
- **The Columns:** Replace `overflow-y-auto` divs with `<ScrollArea className="h-[calc(100vh-theme(spacing.32))]">`.
  - _Why:_ Shadcn's ScrollArea looks distinct (thinner bars) and handles cross-browser styling better.
- **Inputs:** Replace standard `<input>` with `<Input />` and `<Textarea />`. This gives you consistent focus rings (Phillips Blue).

---

## 🗓️ Phase 3: The Lists & Dashboards (Day 3)

_Goal: Clean up the Student View and Roster._

### 1. Refactor `StudentDashboard.tsx`

- **Current:** Custom Accordion logic (if any) or raw lists.
- **New:** Use `<Accordion type="single" collapsible>`.
  - Map `AccordionItem`, `AccordionTrigger` (Program Title), and `AccordionContent` (Course List).
  - This provides smooth open/close animations out of the box.

### 2. Refactor `RosterList.tsx`

- **Current:** `div` rows or raw `table`.
- **New:** Use the `<Table>` component (`TableHeader`, `TableRow`, `TableCell`).
  - It handles alignment and border separators automatically.
- **Status Badges:** Use `<Badge>` with dynamic classes:
  - `bg-green-100 text-green-800` (Registered)
  - `bg-yellow-100 text-yellow-800` (Pending)

---

## ⚠️ Risk Management & Tips

1.  **Drag & Drop Context:** When refactoring `ProgramBuilder.tsx`, be careful **not** to remove the `<DndContext>` or `<SortableContext>` wrappers. The Shadcn components (`Card`) should live _inside_ your `SortableCourseItem`.
2.  **Contrast Check:** Shadcn defaults to dark text on light backgrounds. Ensure your "Active" states (like the selected filter button) explicitly set `text-white` if the background is dark blue.
3.  **One File at a Time:** Don't delete `SidebarNav.tsx` until `AppSidebar.tsx` is fully working.

## 🚀 Execution Order

1.  **Run Phase 0** (Install dependencies).
2.  **Run Phase 1** (The Shell). This gives you the biggest visual win immediately.
3.  **Check in.** Verify the app navigates correctly.
4.  **Run Phase 2** (The Components).
5.  **Run Phase 3** (The Details).
