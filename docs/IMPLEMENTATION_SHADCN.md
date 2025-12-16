# Implementation Plan: UI Modernization (Shadcn/UI)

**Goal:** Refactor the existing "Bare-Bones" HTML layout into a professional "Application-Grade" UI using `shadcn/ui` components.

**Constraint:** **DO NOT** change business logic (`useProgramBuilder`, `localRoutes`, etc.). Only change the JSX/CSS.

**Timeline:** 3 Days.

**Last Updated:** 2025-01-16

---

## 🛠️ Phase 0: Installation & Prep

_Before starting, ensure all base primitives are installed._

- [x] **Install Core Primitives:**
  ```bash
  bunx shadcn@latest add sidebar button card badge separator scroll-area input textarea dialog accordion sheet avatar dropdown-menu collapsible
  ```
- [x] **Verify Tailwind:** Ensure `src/index.css` has the correct color variables (Phillips Blue/Red) mapped to the `:root` so Shadcn components pick them up automatically.

---

## 🗓️ Phase 1: The App Shell (Day 1) ✅ COMPLETED

_Goal: Replace the manual "Flexbox Sidebar" with the responsive, accessible `Sidebar` component. This instantly makes the app look like a SaaS product._

### 1. Create `src/components/layout/AppSidebar.tsx` ✅

- [x] **Ported logic from `SidebarNav.tsx`:**
  - State: `savedPrograms`, `students`, `isBuilderOpen`, `isProgressOpen`
  - Data loading: `loadSavedPrograms()`, `loadStudents()` with `refreshTrigger` dependency
  - Navigation: `onNavigate`, `currentView`, `userType` props
- [x] **Shadcn Component Mapping:**

  ```tsx
  <Sidebar>
    <SidebarHeader>{/* Phillips logo + "Phillips Education" branding */}</SidebarHeader>

    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Account</SidebarMenuButton>
        </SidebarMenuItem>

        {/* Collapsible: Create Program */}
        <Collapsible open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton>
                Create Program
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Nested saved programs list with DRAFT badges */}
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarContent>

    <SidebarFooter>{/* Reset Demo Data button */}</SidebarFooter>
  </Sidebar>
  ```

- [x] **Key Implementation:** Used `<Collapsible>` from Radix UI for "Create Program" and "Invite / Manage Students" sections, maintaining existing state logic.

### 2. Create `src/components/layout/SiteHeader.tsx` ✅

- [x] **Component Structure:**

  ```tsx
  <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
    <SidebarTrigger className="-ml-1" />
    <Separator orientation="vertical" className="mr-2 h-4" />
    <div className="flex items-center gap-2">
      <span className="font-semibold">Phillips Education</span>
    </div>
  </header>
  ```

- [x] **Features:**
  - Sticky positioning with `h-16` height
  - `<SidebarTrigger />` automatically handles mobile/desktop hamburger menu
  - Simple breadcrumb text (Avatar to be added in future iteration)

### 3. Refactor `App.tsx` ✅

- [x] **Removed old layout:**
  - Deleted `<SidebarNav />` import and usage
  - Removed manual `<div className="flex flex-1 overflow-hidden">` wrapper

- [x] **New shell structure:**

  ```tsx
  <SidebarProvider>
    <AppSidebar
      currentView={currentView}
      onNavigate={setCurrentView}
      userType={userType}
      refreshTrigger={refreshTrigger}
    />
    <SidebarInset>
      <SiteHeader />
      <div className="flex flex-1 p-4 overflow-auto">
        <PageContent
          userType={userType}
          setUserType={handleSetUserType}
          currentView={currentView}
          onProgramSaved={handleProgramSaved}
        />
      </div>
    </SidebarInset>
  </SidebarProvider>
  ```

- [x] **Preserved business logic:** All state management, navigation, and refresh triggers remain unchanged.

**Mobile Responsiveness:** Sidebar automatically becomes a Sheet (drawer overlay) on mobile. Desktop users can collapse sidebar to icon mode.

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
