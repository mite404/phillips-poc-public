# Product Requirements Document (PRD)

**Project:** Phillips Education – Custom Program Builder POC
**Target Audience:** Education Supervisors (Customers) & Learners (Employees)
**Timeline:** 2-Week Sprint
**Tech Stack:** React 19, Tailwind v4, Bun, JSON Server (Local Mock DB)

---

## 1. Executive Summary

**The Problem:** Education Supervisors cannot currently curate training paths. They rely on manual emails to Phillips support to bundle courses or enroll students.
**The Solution:** A "Self-Service Program Builder" that allows Supervisors to drag-and-drop existing courses into a custom playlist and assign them to their team.
**The "Wow" Factor:** We solve the complex logistics of "Instructor-Led Training" (ILT) by decoupling **Assignment** (Boss says "Do this") from **Registration** (Worker picks "Nov 20th in Mumbai").

---

## 2. The Demo Script (Success Criteria)

_We build exactly what is needed to tell this story._

**Scene 1: The Curator (Supervisor)**

1.  **Search:** Supervisor searches "Haas" in the Catalog. Results filter instantly.
2.  **Build:** Drags "Haas Maintenance" and "Advanced Mill" into the "Workbench."
3.  **Visual Feedback:** The "Total Duration" badge updates instantly (e.g., "7 Days").
4.  **Page Header:** "Create Custom Program" header above the 2-column layout.
5.  **Publish:** Clicks "Publish Program" at bottom center. Toast confirms publication.

**Scene 2: The Batch Assignment (Supervisor)**

1.  **Sidebar Navigation:** Views saved programs in sidebar. DRAFT badges distinguish unpublished programs.
2.  **Navigate to Saved Program:** Clicks a published program. Roster appears on the right.
3.  **Batch Select:** Supervisor checks the "Select All" checkbox to select all students.
4.  **Batch Invite:** Clicks "Invite Selected (8)" button. Toast confirms: "Sent invites to 8 students."
5.  **Individual Assign:** Can also select individual students and invite them separately.
6.  **Individual Enroll:** Can still click "Force Enroll" on individual students for immediate enrollment.
7.  **The Modal:** A modal appears showing **Real Dates/Locations** (e.g., "Nov 20 - Bensalem, PA").
8.  **Confirm:** Supervisor confirms. Toast notification: "Ethan enrolled in Bensalem session."

**Scene 3: The Student View (Learner)**

1.  **Action Center:** Student logs in. Sees assigned programs with course sequences.
2.  **Course Interaction:** Clicks on a course to see detailed information and course metadata.
3.  **Booking:** For ILT courses, clicks "Book Class," selects a date/location, and status flips to "Enrolled."
4.  **Progress Tracking:** Supervisor can view student progress showing enrollment status across all assigned courses.
5.  **Demo Interaction:** Click on course status badges to toggle completion status (demo mode).

---

## 3. Functional Requirements

### 3.1 Supervisor Builder View

- **Page Header:** "Create Custom Program" displayed above 2-column layout.
- **Left Column (Catalog):**
  - Display `CourseCatalogItem` cards (Title, Image, Level).
  - Client-side filtering by Text and Level (Basic/Advanced).
  - Search functionality with instant filtering.
- **Center Column (Workbench):**
  - Drag-and-drop sortable list of selected courses.
  - Editable Program Title & Description.
  - "Save Draft" button to persist to local `db.json`.
  - Total Duration calculation (ILT days + eLearning hours).
  - Course detail modal on click (interactive exploration).
- **Publish Button:** Positioned at bottom center of page (after Save Draft).
  - Updates program published status to true.
  - Shows "✓ Published" badge when complete.
  - Available only for saved/draft programs.

### 3.2 Supervisor Program Manager View

- **Dynamic Sidebar:** Shows saved programs with DRAFT badges on unpublished programs.
- **Left Column (Course Sequence):**
  - Display program metadata (title, description, tags).
  - Sequence numbers with circular badges.
  - Clickable course cards with detail modal integration.
- **Right Column (Student Roster):**
  - List `LearnerProfile` items with uniform card styling.
  - **Batch Selection:** Checkbox on left of each student (all statuses).
  - **Select All Checkbox:** Select entire roster at once.
  - **Batch Invite Button:** Shows count (e.g., "Invite Selected (5)") when students selected.
  - **Tristate Status:** Unassigned (Gray) → Pending Selection (Yellow) → Registered (Green).
  - **Individual Actions:** "Assign" button for unassigned, "Force Enroll" for pending/registered.
  - **Batch Operations:** Single click to invite all selected students to the program.

### 3.3 Student Dashboard View

- **Accordion UI:** Assigned programs displayed as collapsible sections.
- **Program Cards:** Show program title, description, and course list.
- **Course Interaction:** Click course to see details and availability.
- **Book Class Button:** Available for ILT courses only; opens enrollment modal.
- **Status Badges:** Visual indicators for enrollment status (Pending/Registered/Completed).

---

## 4. Data Strategy (The Hybrid Model)

**A. Read-Only (Legacy API)**

- **Courses:** Source of Truth for Title, Images, Metadata.
- **Inventory:** Real-time class schedules (Dates, Locations, Seats).
- **Learners:** Real user profiles from the customer's org.

**B. Write-Enabled (Local JSON)**

- **Programs:** New entity. Defines the bundle.
- **Assignments:** Links `Program` to `Learner`.
- **Enrollments:** Links `Learner` to specific `ClassInstance` (The "Booking").

---

## 5. Success Criteria (v1.0 Feature Complete)

### Supervisor Workflows ✅

- [x] Search and filter course catalog by text and level
- [x] Drag-and-drop courses into custom program workbench
- [x] See total duration calculated and updated in real-time
- [x] Save programs as drafts with all metadata
- [x] Publish programs to make them available for assignment
- [x] Navigate to saved programs via sidebar (with DRAFT badges)
- [x] View student roster for each program
- [x] Batch select students for bulk operations
- [x] Batch invite students to programs with single button click
- [x] Individually assign students to programs
- [x] Individually enroll students in specific classes with date/location selection
- [x] View course details with metadata and pricing
- [x] Track student progress across programs with completion status

### Student Workflows ✅

- [x] View assigned programs in accordion layout
- [x] View course details for each course in a program
- [x] Click "Book Class" to select a date/location for ILT courses
- [x] See enrollment status (Pending/Registered) with visual indicators
- [x] Understand which courses require action vs. already enrolled

### UI/UX Polish (v1.0) ✅

- [x] Global page headers for major sections ("Create Custom Program")
- [x] Dynamic sidebar showing saved programs with DRAFT badges
- [x] Uniform student roster cards across all programs
- [x] Batch selection checkboxes visible for all students
- [x] Batch action button shows count of selected items
- [x] Centered action buttons (Publish, Invite Selected) at page bottom
- [x] Color-coded status badges (Yellow=Pending, Green=Registered)
- [x] Phillips brand blue styling for primary action buttons
- [x] Toast notifications for all key operations
- [x] Interactive course detail modals throughout the app
- [x] Responsive layouts with proper scrolling and spacing

---

## 6. Known Constraints & Logic

1.  **Auth:** Mocked. We assume "Pat Mann" is logged in.
2.  **Data ID Mapping:**
    - User Identity = GUID (e.g., `fc067...`)
    - Database ID = Int (e.g., `1512`) -> **Use this for Roster operations.**
3.  **Logic:** "Force Enroll" requires selecting a specific `classId` (Date/Location), not just a `courseId`.
4.  **Batch Operations:** All selected students receive the same "Invite" status; individual enrollment modal appears per student if using Force Enroll.
5.  **Demo Mode:** Status badges in ProgramProgressCard are clickable to toggle completion status for demonstration purposes.
