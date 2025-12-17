# SPEC.md - Project Specification

**Last Updated**: 2025-12-16

## Project Overview

Phillips Education POC is a React + TypeScript + Vite application for managing educational programs. The application integrates with the legacy Phillips API for program catalogs and uses a local JSON server for mock data management.

## Core Features

- **Program Discovery**: Browse and filter programs from Phillips X PIMS staging API
- **Program Management**: Create custom programs with course sequences, manage builder workbench
- **Student Roster Management**: Manage student assignments, track progress, handle enrollments
- **Responsive UI**: Built with shadcn/ui components and Tailwind CSS v4

## Recent Changes

### PR #39: Refactor CourseDetailModal Layout

**Objective**: Modernize course detail display with improved information hierarchy and responsive 2-column design.

**Changes**:
- Converted vertical CardHeader/CardContent/CardFooter layout to responsive 2-column grid
- Left column (7 cols): Metadata grid (2x2) displaying Course ID, Level, Type, Duration; Full course description
- Right column (5 cols): Skills display with styled badges; Testimonials section with scrollable card deck
- Updated button styling to use shadcn Button component with `variant="outline"`
- Maintained `onBookClick` logic for ILT course detail interactions

**Components Updated**: `src/components/common/CourseDetailModal.tsx`

---

### PR #40: Horizontal Course Card Redesign

**Objective**: Implement consistent horizontal "flight ticket" style cards for course display across ProgramManager and ProgramBuilder, improving visual consistency and space efficiency.

**Changes**:
- **ProgramManager Course Cards**: Refactored from simple div rows to wide horizontal Card components
  - Layout: Sequence badge → Thumbnail image (24×16) → Course title + badges + duration → Level/ID badges
  - Column split adjusted from 50:40 to 50:50 for balanced layout
  - Cards use flex row layout with hover shadow transition
  
- **ProgramBuilder Catalog Cards**: Created inline horizontal Card layout (not using CourseCard component)
  - Layout: Course image (20×14) → Title + badges + metadata → Add button (right-aligned)
  - Column split adjusted from 60:40 to 50:50
  - Maintains consistent styling with ProgramManager cards

- **CourseCard Component Enhancement**: Added `variant` prop system
  - `variant="default"`: Original vertical CardHeader/CardContent/CardFooter layout
  - `variant="workbench"`: Optimized for Workbench display with drag handle integration
  - Workbench layout: Title (centered bold) → Drag handle + badges + duration → Remove button

- **SortableCourseItem Refactor**: Switched from wrapper div approach to cloneElement-based prop injection
  - Drag handle button with GripVertical icon passed via props to child CourseCard
  - Maintains dnd-kit opacity and transform styling for drag feedback

**Components Updated**: `src/components/ProgramManager.tsx`, `src/components/ProgramBuilder.tsx`, `src/components/common/CourseCard.tsx`, `src/components/SortableCourseItem.tsx`

---

### PR #41: Deduplicate Student Assignments

**Objective**: Prevent duplicate program cards when students have multiple assignments to the same program.

**Changes**:
- Added deduplication logic using `reduce()` in StudentProgressView
- Filter assignments by unique `programId` before rendering progress cards
- Implemented same deduplication pattern in StudentDashboard for consistency
- Maintains all assignment data while eliminating duplicate program displays

**Components Updated**: `src/components/progress/StudentProgressView.tsx`, `src/components/student/StudentDashboard.tsx`

---

## Component Architecture

**Container Components**:
- `ProgramList`: Fetches and displays programs from legacy API
- `ProgramManager`: Manages custom programs with course sequence editor
- `ProgramBuilder`: Allows creation/editing of program course sequences
- `StudentDashboard`: Displays student's enrolled programs and progress
- `RosterList`: Displays student roster with status management

**Presentational Components**:
- `ProgramCard`: Individual program card display
- `CourseCard`: Flexible course display with variant system (default/workbench)
- `ProgramProgressCard`: Course progress visualization
- `StudentProgressView`: Student assignment and progress tracking

**UI Primitives** (shadcn/ui):
- Card, Badge, Button, Input, Textarea, ScrollArea, Dialog, Accordion, Table

## Data Flow

1. **Program Discovery**: ProgramList → Legacy API → Program grid display
2. **Custom Programs**: ProgramBuilder → json-server → Custom program storage
3. **Student Progress**: StudentDashboard → Assignments from json-server → Deduped progress view
4. **Course Management**: ProgramManager → Course sequence editor → Workbench with drag/drop

## Styling System

- **Tailwind CSS v4** with @tailwindcss/vite plugin
- **Brand Colors** (CSS custom properties in src/index.css):
  - `--phillips-blue`: #005596
  - `--phillips-red`: #D31245
- **Dark Mode**: Configured with custom variant in Tailwind config
- **shadcn/ui**: New York style with Lucide icons

---

**Status**: ✅ Actively maintained
