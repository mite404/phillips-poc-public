# Implementation Plan: UI Modernization (Shadcn/UI)

**Goal:** Refactor the existing "Bare-Bones" HTML layout into a professional "Application-Grade" UI using `shadcn/ui` components.

**Constraint:** **DO NOT** change business logic (`useProgramBuilder`, `localRoutes`, etc.). Only change the JSX/CSS.

**Timeline:** 3 Days.

**Last Updated:** 2025-01-16 (PR-S2 Completed)

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

## 🗓️ Phase 2: The Builder & Layouts (Day 2) ✅ COMPLETED

_Goal: Remove raw `div` scrolling and borders. Use `Card` and `ScrollArea` to manage screen real estate._

### 1. Create `src/components/common/CourseCard.tsx` ✅

- [x] **Standardized card component for course display:**
  - Props: `course: Course`, `action: "add" | "remove"`, `onAction: () => void`, `onClick?: () => void`
  - Reusable across workbench and catalog views
- [x] **Component Structure:**

  ```tsx
  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
    <CardHeader>
      {/* Image thumbnail (w-16 h-16, 3:2 ratio if available) */}
      <img src={course.previewImageUrl} />

      {/* Title + Level Badge */}
      <h3>{course.courseTitle}</h3>
      <Badge variant={course.levelName === "Advanced" ? "default" : "secondary"}>
        {course.levelName}
      </Badge>
    </CardHeader>

    <CardContent>
      {/* Training Type, Duration (ILT=days, eLearning=hours), Course ID */}
      <div>Type: {course.trainingTypeName}</div>
      <div>Duration: {course.totalDays || course.hours}</div>
      <div>ID: #{course.courseId}</div>
    </CardContent>

    <CardFooter>
      <Button
        variant={action === "remove" ? "destructive" : "outline"}
        onClick={handleActionClick}
      >
        {action === "remove" ? "Remove" : "Add"}
      </Button>
    </CardFooter>
  </Card>
  ```

### 2. Refactor `ProgramBuilder.tsx` (The 2-Column Layout) ✅

- [x] **Inputs upgraded to shadcn components:**

  ```tsx
  // Program Title
  <Input
    value={programTitle}
    onChange={...}
    className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
  />

  // Program Description
  <Textarea
    value={programDescription}
    onChange={...}
    className="text-sm resize-none border-none shadow-none focus-visible:ring-0 px-0"
  />

  // Search Input
  <Input
    placeholder="Search courses..."
    value={searchQuery}
    onChange={...}
    disabled={isLoading}
  />
  ```

- [x] **Filter buttons use Button component:**

  ```tsx
  <Button
    variant={activeFilters[filterKey] ? "secondary" : "ghost"}
    size="sm"
    className="flex-1"
    onClick={() => toggleFilter(filterKey)}
  >
    {filterKey}
  </Button>
  ```

- [x] **ScrollArea replaces raw overflow-y-auto:**

  ```tsx
  <ScrollArea className="flex-1">
    <div className="p-4 space-y-3">{/* Course cards go here */}</div>
  </ScrollArea>
  ```

- [x] **Course lists now use CourseCard:**

  ```tsx
  // Workbench (left column - sortable)
  <SortableContext items={selectedCourses.map(c => c.id)} strategy={verticalListSortingStrategy}>
    <div className="space-y-3">
      {selectedCourses.map(course => (
        <SortableCourseItem key={course.id} id={course.id}>
          <CourseCard
            course={course}
            action="remove"
            onAction={() => removeCourse(course.id)}
            onClick={() => setActiveCourse(course)}
          />
        </SortableCourseItem>
      ))}
    </div>
  </SortableContext>

  // Catalog (right column - scrollable)
  <ScrollArea className="flex-1">
    <div className="p-4 space-y-3">
      {filteredCourses.map(course => (
        <CourseCard
          key={course.id}
          course={course}
          action="add"
          onAction={() => addCourse(course)}
          onClick={() => setActiveCourse(course)}
        />
      ))}
    </div>
  </ScrollArea>
  ```

- [x] **Save Draft button upgraded:**

  ```tsx
  <Button
    variant="outline"
    size="sm"
    className="w-full"
    onClick={async () => {
      await saveDraft();
      onProgramSaved?.();
    }}
  >
    Save Draft
  </Button>
  ```

- [x] **Key Pattern Preserved:** `@dnd-kit` context fully maintained:
  - `<DndContext>`, `<SortableContext>`, `<SortableCourseItem>` wrapper all intact
  - Drag sensors (PointerSensor, KeyboardSensor) unchanged
  - `CourseCard` is a pure presentation component inside sortable wrapper
  - This separation maintains clean drag-and-drop functionality

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
