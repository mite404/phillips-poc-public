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
4.  **Publish:** Clicks "Publish." The Roster sidebar slides in smoothly.

**Scene 2: The Assignment (Supervisor)**

1.  **Select:** Supervisor selects "Ethan Anderson" (Real User).
2.  **Action:** Clicks "Force Enroll" for a specific course.
3.  **The Modal:** A modal appears showing **Real Dates/Locations** (e.g., "Nov 20 - Bensalem, PA").
4.  **Confirm:** Supervisor confirms. Toast notification: "Ethan enrolled in Bensalem session."

**Scene 3: The Student View (Learner)**

1.  **Action Center:** Student logs in. Sees "⚠️ Action Required: Select Date for CNC Repair."
2.  **Booking:** Clicks "Select Session," picks a date, and the status flips to "Enrolled."

---

## 3. Functional Requirements

### 3.1 Supervisor Builder View

- **Left Column (Catalog):**
  - Display `CourseCatalogItem` cards (Title, Image, Level).
  - Client-side filtering by Text and Level (Basic/Advanced).
- **Center Column (Workbench):**
  - Drag-and-drop sortable list.
  - Editable Program Title & Description.
  - "Save/Publish" persists to local `db.json`.
- **Right Column (Roster):**
  - Slides in only when Program is Published.
  - List `LearnerProfile` items (Name, Status).
  - **Tristate Status:** Unassigned (Gray) -> Pending Selection (Yellow) -> Registered (Green).

### 3.2 Student Dashboard View

- **Timeline:** Vertical visualization of the assigned program.
- **Action Center:** High-priority cards for courses that require date selection.
- **Integration:** Deep links to the legacy LMS for "Start Course" (eLearning).

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

## 5. Known Constraints & Logic

1.  **Auth:** Mocked. We assume "Pat Mann" is logged in.
2.  **Data ID Mapping:**
    - User Identity = GUID (e.g., `fc067...`)
    - Database ID = Int (e.g., `1512`) -> **Use this for Roster operations.**
3.  **Logic:** "Force Enroll" requires selecting a specific `classId` (Date/Location), not just a `courseId`.
