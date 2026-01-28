# Phillips POC UI Overhaul - Lyra Theme Migration

## Overview

Migrate the Phillips Education POC from the current warm orange/beige theme to shadcn/ui's **Lyra theme** with neutral colors, sharp corners, and Inter typography. Add a new **SupervisorDashboard** as the default landing page for supervisors with "at a glance" metrics.

## Key Requirements

- **Theme**: Lyra (neutral grays, corporate aesthetic)
- **Border Radius**: 0 (sharp corners throughout)
- **Typography**: Inter font family
- **Accent Color**: Keep Phillips orange (#ff5000)
- **Icons**: Keep all existing Lucide icons unchanged
- **Business Logic**: No changes to functionality, styling only

## Implementation Plan

### Phase 1: CSS Theme Foundation

**File**: `src/index.css`

#### 1.1 Update Font Imports
Replace Work Sans with Inter:
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Inconsolata:wght@400;700&display=swap");
```

#### 1.2 Update CSS Variables (Lyra Neutral Theme)

**Font variables:**
```css
--font-sans: "Inter", ui-sans-serif, sans-serif, system-ui;
--font-serif: ui-serif, serif;
--font-mono: "Inconsolata", ui-monospace, monospace;
```

**Color scheme (replace warm tones with neutrals):**
```css
/* Base Colors */
--background: #ffffff;           /* Pure white */
--foreground: #0a0a0a;          /* Near black */

--card: #ffffff;
--card-foreground: #0a0a0a;
--card-background: #fafafa;      /* Subtle gray */

--primary: #ff5000;              /* Phillips orange - KEEP */
--primary-foreground: #ffffff;

--secondary: #f5f5f5;            /* Neutral gray-50 */
--secondary-foreground: #0a0a0a;
--secondary-hover: #e5e5e5;      /* Neutral gray-200 */

--muted: #f5f5f5;                /* Neutral-100 */
--muted-foreground: #737373;     /* Neutral-500 */

--accent: #f5f5f5;
--accent-foreground: #0a0a0a;

--border: #e5e5e5;               /* Neutral-200 */
--input: #e5e5e5;
--ring: #ff5000;                 /* Phillips orange focus */

--radius: 0rem;                  /* SHARP CORNERS */
```

**Sidebar colors:**
```css
--sidebar: #fafafa;              /* Light gray */
--sidebar-foreground: #0a0a0a;
--sidebar-primary: #ff5000;      /* Phillips orange */
--sidebar-primary-foreground: #ffffff;
--sidebar-accent: #f5f5f5;
--sidebar-accent-foreground: #0a0a0a;
--sidebar-border: #e5e5e5;
```

**Chart colors (neutral tones):**
```css
--chart-1: #525252;  /* Neutral-600 */
--chart-2: #737373;  /* Neutral-500 */
--chart-3: #a3a3a3;  /* Neutral-400 */
--chart-4: #d4d4d4;  /* Neutral-300 */
--chart-5: #e5e5e5;  /* Neutral-200 */
```

---

### Phase 2: Component Cleanup

#### 2.1 Card Component Fix
**File**: `src/components/ui/card.tsx`

Remove hardcoded warm colors and use CSS variables:
```tsx
// BEFORE:
className={cn(
  "rounded-xl border bg-card-background text-card-foreground border-amber-100",
  className,
)}

// AFTER:
className={cn(
  "rounded-[--radius] border bg-card-background text-card-foreground border-border",
  className,
)}
```

#### 2.2 Global Style Cleanup

Search and replace patterns across all components:

**Border colors:**
- `border-amber-100` → `border-border`
- `border-slate-200` → `border-border`
- `border-slate-300` → `border-border`

**Rounding:**
- `rounded-xl` → `rounded-[--radius]`
- `rounded-lg` → `rounded-[--radius]`
- `rounded-md` → `rounded-[--radius]`
- Keep `rounded-full` for avatars/badges

**Color references:**
- `bg-amber-*` → Use neutral equivalents or `bg-muted`
- `text-orange-*` → `text-primary` (for Phillips orange)

---

### Phase 3: SupervisorDashboard Component (NEW)

**File**: `src/components/SupervisorDashboard.tsx`

Create new dashboard component with metrics and quick actions.

**Structure:**
```tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { localApi } from "@/api/localRoutes";
import { legacyApi } from "@/api/legacyRoutes";
import { Users, FileText, UserCheck, CheckCircle, Plus } from "lucide-react";

interface DashboardMetrics {
  totalStudents: number;
  pendingInvites: number;
  enrolledStudents: number;
  programsCreated: number;
}

export function SupervisorDashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  // State, data loading, metric calculation
  // Metrics grid (4 cards)
  // Quick Actions section
  // "Create Program" button
}
```

**Metrics to Display:**
1. **Total Students** - Count from roster API
2. **Pending Invites** - Students with assignments but no enrollments
3. **Enrolled Students** - Unique students with enrollments
4. **Programs Created** - Published programs count

**Data Sources:**
- `legacyApi.getRoster()` - Student roster
- `localApi.getAssignments()` - Program assignments
- `localApi.getEnrollments()` - Course enrollments
- `localApi.getAllPrograms()` - Custom programs

**Layout:**
- Page header with "Supervisor Dashboard" title
- "Create Program" button (top right)
- 4-column metrics grid (responsive)
- Quick Actions card with buttons

---

### Phase 4: Sidebar Footer Enhancement

**File**: `src/components/layout/AppSidebar.tsx`

Add user profile section at bottom with Settings, Get Help, Search, and user avatar.

**New imports:**
```tsx
import { Settings, HelpCircle, Search, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**Footer structure:**
```tsx
<SidebarFooter>
  <SidebarMenu>
    {/* Settings - placeholder */}
    <SidebarMenuItem>
      <SidebarMenuButton className="text-sm font-medium">
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </SidebarMenuButton>
    </SidebarMenuItem>

    {/* Get Help - placeholder */}
    <SidebarMenuItem>
      <SidebarMenuButton className="text-sm font-medium">
        <HelpCircle className="h-4 w-4" />
        <span>Get Help</span>
      </SidebarMenuButton>
    </SidebarMenuItem>

    {/* Search - placeholder */}
    <SidebarMenuItem>
      <SidebarMenuButton className="text-sm font-medium">
        <Search className="h-4 w-4" />
        <span>Search</span>
      </SidebarMenuButton>
    </SidebarMenuItem>

    {/* User Profile with dropdown */}
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="h-auto py-2">
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">shadcn</span>
                <span className="text-xs text-muted-foreground">m@example.com</span>
              </div>
            </div>
            <MoreVertical className="h-4 w-4 ml-auto group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Account Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            clearStorage();
            window.location.reload();
          }}>
            Reset Demo Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

**Note:** All items except "Reset Demo Data" are placeholder UI (no functionality).

---

### Phase 5: Routing Updates

#### 5.1 Update Default View
**File**: `src/App.tsx`

Change supervisor default from "builder" to "dashboard":
```tsx
const handleSetUserType = (type: "supervisor" | "student" | null) => {
  setUserType(type);
  if (type === "student") {
    setCurrentView("programs");
  } else if (type === "supervisor") {
    setCurrentView("dashboard");  // Changed from "builder"
  }
};
```

#### 5.2 Add Dashboard Route
**File**: `src/components/PageContent.tsx`

**Add import:**
```tsx
import { SupervisorDashboard } from "./SupervisorDashboard";
```

**Update props:**
```tsx
export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
  onProgramSaved?: () => void;
  onNavigate: (view: string) => void;  // ADD THIS
})
```

**Add dashboard route:**
```tsx
return (
  <main className="flex-1 overflow-hidden flex flex-col">
    <div className="flex-1 overflow-hidden">
      {userType === "student" && currentView === "programs" ? (
        <StudentDashboard />
      ) : currentView === "dashboard" ? (
        <SupervisorDashboard onNavigate={onNavigate} />
      ) : isStudentProgressView && studentId ? (
        <StudentProgressView studentId={studentId} />
      ) : isProgramView ? (
        <ProgramManager programId={currentView} />
      ) : (
        <div className="h-full p-8">
          <ProgramBuilder onProgramSaved={onProgramSaved} />
        </div>
      )}
    </div>
    {/* ... footer ... */}
  </main>
);
```

**Update isProgramView check:**
```tsx
const isProgramView =
  currentView !== "builder" &&
  currentView !== "programs" &&
  currentView !== "dashboard" &&  // ADD THIS
  !isStudentProgressView &&
  (currentView.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
    ["prog_101", "prog_102", "prog_103"].includes(currentView));
```

**Pass onNavigate in App.tsx:**
```tsx
<PageContent
  userType={userType}
  setUserType={handleSetUserType}
  currentView={currentView}
  onProgramSaved={handleProgramSaved}
  onNavigate={setCurrentView}  // ADD THIS
/>
```

#### 5.3 Add Dashboard Menu Item
**File**: `src/components/layout/AppSidebar.tsx`

**Add import:**
```tsx
import { LayoutDashboard } from "lucide-react";
```

**Add menu item (first in supervisor section):**
```tsx
{userType === "supervisor" && (
  <>
    {/* Dashboard */}
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Dashboard"
        isActive={currentView === "dashboard"}
        className="text-sm font-medium"
        onClick={() => onNavigate("dashboard")}
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Dashboard</span>
      </SidebarMenuButton>
    </SidebarMenuItem>

    {/* Create Program */}
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Create Program"
        isActive={currentView === "builder"}
        className="text-sm font-medium"
        onClick={() => onNavigate("builder")}
      >
        <Plus className="h-4 w-4" />
        <span>Create Program</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
    {/* ... rest of menu ... */}
  </>
)}
```

---

### Phase 6: Student View Styling

**File**: `src/components/student/StudentDashboard.tsx`

Update styling to match Lyra theme:

**Accordion styling:**
```tsx
// Update border and background
className="border border-border rounded-[--radius] overflow-hidden bg-card-background"
```

**Sequence number styling:**
```tsx
<div className="flex-shrink-0 w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center text-sm font-semibold">
  {idx + 1}
</div>
```

**Card borders:**
```tsx
className="cursor-pointer border border-border rounded-[--radius] p-4 bg-card-background transition-colors"
```

---

### Phase 7: Additional Component Updates

Apply Lyra styling to remaining components:

**Files to update:**
- `src/components/ProgramBuilder.tsx`
- `src/components/ProgramManager.tsx`
- `src/components/progress/StudentProgressView.tsx`
- `src/components/common/CourseCard.tsx`
- `src/components/common/CourseDetailModal.tsx`

**Pattern:**
- Replace `border-slate-*` with `border-border`
- Replace `rounded-*` with `rounded-[--radius]`
- Remove warm color references
- Use neutral theme variables

---

## Critical Files to Modify

### Primary (Must Edit):
1. `src/index.css` - Theme variables, fonts, colors
2. `src/components/SupervisorDashboard.tsx` - NEW component
3. `src/App.tsx` - Default view routing
4. `src/components/PageContent.tsx` - Dashboard route
5. `src/components/layout/AppSidebar.tsx` - Footer + Dashboard menu

### Secondary (Styling):
6. `src/components/ui/card.tsx` - Remove warm colors
7. `src/components/student/StudentDashboard.tsx` - Lyra styling
8. `src/components/ProgramBuilder.tsx` - Neutralization
9. `src/components/ProgramManager.tsx` - Neutralization
10. `src/components/progress/StudentProgressView.tsx` - Neutralization

---

## Verification Steps

After implementation:

### Visual Checks:
- [ ] All corners are sharp (no rounding except avatars)
- [ ] Neutral gray color scheme throughout
- [ ] Phillips orange used for primary actions
- [ ] Inter font displayed correctly
- [ ] Sidebar footer shows all new items
- [ ] Dashboard displays metrics correctly

### Functional Checks:
- [ ] Supervisor default view is dashboard
- [ ] Dashboard "Create Program" button navigates to builder
- [ ] Sidebar navigation works
- [ ] Student view remains functional
- [ ] All existing features work unchanged

### Responsive Checks:
- [ ] Dashboard metrics grid responsive
- [ ] Sidebar collapsible behavior intact
- [ ] Student dashboard two-column layout responsive

---

## Design Principles

**Color Strategy:**
- Neutral grays for all backgrounds and borders
- Phillips orange (#ff5000) for primary actions only
- High contrast (near-black on white) for readability

**Typography Hierarchy:**
- Inter font family throughout
- Use font weight for visual hierarchy
- Maintain existing size scales

**Sharp Corners:**
- Border radius: 0 throughout
- Exception: Avatars remain circular
- Badges can remain rounded-full

**Minimal Aesthetic:**
- Clean, corporate look
- Reduce visual noise
- Focus on content hierarchy

---

## Implementation Order

1. **CSS variables** (index.css) - Foundation
2. **Card component** fix - Core UI primitive
3. **SupervisorDashboard** creation - New feature
4. **Routing updates** (App.tsx, PageContent.tsx)
5. **Sidebar** updates (footer + dashboard menu)
6. **Student view** styling
7. **Global cleanup** (all components)
8. **Testing** and verification

---

## Estimated Effort

- **CSS/Theme**: 30 minutes
- **SupervisorDashboard**: 1 hour
- **Routing**: 30 minutes
- **Sidebar**: 45 minutes
- **Component cleanup**: 1.5 hours
- **Testing**: 1 hour

**Total**: ~5 hours
