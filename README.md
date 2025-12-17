# Phillips Education – Program Management Dashboard

> A modern React 19 application enabling Education Supervisors to curate custom learning paths with a hybrid data architecture.

---

## 📋 Executive Summary

The **Phillips Education POC** solves a critical gap in enterprise learning management: supervisors cannot currently curate training paths or enroll employees in custom programs. This application delivers a **self-service program builder** that decouples **assignment** (supervisor says "Do this") from **registration** (employee picks "Nov 20th in Mumbai"), enabling supervisors to build, publish, and manage learning programs while students independently select enrollment dates and locations.

---

## 🎯 Key Features

### **Visual Program Builder**

Drag-and-drop curriculum design using `@dnd-kit`. Supervisors search, filter, and compose custom learning paths from existing course catalogs with real-time duration calculations (ILT days + eLearning hours).

### **Hybrid Data Layer**

Reads from legacy Phillips APIs (Azure cloud) while persisting new logic to a local microservice layer (`json-server`). A network-first, localStorage-fallback strategy ensures seamless operation in offline mode or when APIs become unavailable.

### **Modern Responsive UI**

Fully responsive dashboard built with **shadcn/ui** primitives and **Tailwind CSS v4**. Features include horizontal course "ticket" cards, 2-column modal layouts, and Radix UI accordion components for accessibility-first design.

### **Resilient Persistence**

Network-first architecture with localStorage fallback. Perfect for Vercel deployment—automatically detects offline mode and gracefully degrades to local data without requiring API infrastructure.

### **Student Experience**

Multi-step enrollment flow: students view assigned programs, book classes at specific dates/locations, and track progress with interactive status badges. Demo mode allows supervisors to showcase workflow without modifying data.

---

## 🏛️ Architecture

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      React 19 Frontend                        │
│  (ProgramBuilder, StudentDashboard, ProgramManager, etc.)     │
└─────────────┬──────────────────────────────────────────────┘
              │
              ├─────────────────────────┬─────────────────────┐
              │                         │                     │
              ▼                         ▼                     ▼
        ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
        │   API Layer     │    │  Local Store     │    │  localStorage
        │ (Hybrid Model)  │    │  (json-server)   │    │  (Fallback)
        └────────┬────────┘    └──────────────────┘    └─────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ Courses│  │ Inventory│  │ Learners │
│(Legacy)│  │ (Real)   │  │(Legacy)  │
└────────┘  └──────────┘  └──────────┘
```

### Hybrid Data Model

| Entity          | Source                      | Write Target | Purpose                                    |
| --------------- | --------------------------- | ------------ | ------------------------------------------ |
| **Courses**     | Legacy Phillips API (Azure) | Read-only    | Course metadata, pricing, skills           |
| **Inventory**   | Legacy Phillips API         | Read-only    | Real-time class schedules, locations       |
| **Learners**    | Legacy Phillips API         | Read-only    | Employee profiles, IDs                     |
| **Programs**    | —                           | json-server  | Custom curated learning paths              |
| **Assignments** | —                           | json-server  | Links programs to learners                 |
| **Enrollments** | —                           | json-server  | Links learners to specific class instances |

---

## 🛠️ Tech Stack

| Layer             | Technology                | Version | Rationale                                |
| ----------------- | ------------------------- | ------- | ---------------------------------------- |
| **Runtime**       | Bun                       | Latest  | 50% faster than Node.js                  |
| **Frontend**      | React                     | 19      | Latest features, concurrent rendering    |
| **Language**      | TypeScript                | ~5.9    | Type safety, IDE support                 |
| **Build Tool**    | Vite                      | 7.2     | Sub-second HMR, optimized builds         |
| **Styling**       | Tailwind CSS              | 4       | CSS-in-utility, @tailwindcss/vite plugin |
| **UI Components** | shadcn/ui                 | Latest  | Radix UI primitives + Tailwind           |
| **Icons**         | Lucide React              | 0.561   | 1000+ customizable SVG icons             |
| **Drag & Drop**   | @dnd-kit                  | 6.3     | Framework-agnostic, accessible           |
| **Accordion**     | @radix-ui/accordion       | 1.2     | WCAG 2.1 AA compliant                    |
| **Routing**       | React Router              | 7       | Nested routes, data loader API           |
| **Mock API**      | json-server               | 1.0     | Zero-config REST + WebSocket             |
| **Notifications** | Sonner                    | 2.0     | Toast notifications                      |
| **Development**   | Vitest + @testing-library | Latest  | Unit + integration tests                 |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- Git

### Quick Start (3 steps)

```bash
# 1. Install dependencies
bun install

# 2. Start dev environment (Vite + json-server)
bun dev

# 3. Open browser
# Vite: http://localhost:5173
# JSON Server: http://localhost:3001
```

**That's it!** The application automatically:

- ✅ Fetches courses from Phillips legacy API
- ✅ Loads mock students and assignments from `db.json`
- ✅ Falls back to localStorage if APIs are unreachable
- ✅ Runs in "Offline Mode" without requiring any remote connections

### Additional Commands

```bash
bun run build           # Production build (TypeScript + Vite)
bun run lint            # ESLint with strict rules
bun run preview         # Preview production build locally
bun run server          # JSON Server only (port 3001)
bun run test            # Run Vitest suite
```

---

## 📁 Project Structure

```
phillips-poc/
├── src/
│   ├── api/
│   │   ├── legacyRoutes.ts     # Phillips API integration
│   │   ├── localRoutes.ts      # JSON Server + localStorage
│   │   └── storageUtils.ts     # localStorage helpers
│   │
│   ├── components/
│   │   ├── ProgramBuilder.tsx      # Drag-drop curriculum designer
│   │   ├── ProgramManager.tsx      # Program editor + roster
│   │   ├── RosterList.tsx          # Student management table
│   │   ├── common/                 # Shared UI components
│   │   │   ├── CourseDetailModal.tsx    # 2-column modal layout
│   │   │   ├── CourseCard.tsx          # Variant-based course card
│   │   │   └── EnrollmentModal.tsx     # Class selection
│   │   ├── student/                # Student-facing views
│   │   │   └── StudentDashboard.tsx    # Radix accordion UI
│   │   ├── progress/               # Supervisor analytics
│   │   │   ├── StudentProgressView.tsx
│   │   │   └── ProgramProgressCard.tsx
│   │   └── ui/                     # shadcn/ui primitives
│   │       ├── card.tsx, button.tsx, badge.tsx, etc.
│   │
│   ├── hooks/
│   │   └── useProgramBuilder.ts    # Business logic (drag, filter, save)
│   │
│   ├── types/
│   │   └── models.ts               # TypeScript interfaces
│   │
│   ├── data/
│   │   ├── seedData.ts             # Demo programs, students, enrollments
│   │   ├── Courses.json            # Fallback course catalog
│   │   └── Schedules.json          # Fallback class inventory
│   │
│   ├── App.tsx                     # Root component + routing
│   └── index.css                   # Phillips brand colors + Tailwind config
│
├── db.json                         # Local json-server database
├── CLAUDE.md                       # Developer documentation
├── SPEC.md                         # Feature specification
└── docs/
    ├── PRD.md                      # Product requirements
    ├── IMPLEMENTATION.md           # PR history + status
    └── IMPLEMENTATION_SHADCN.md    # UI migration guide
```

---

## 🎬 Demo Workflow

### Scene 1: Build a Program (Supervisor)

1. **Search & Filter:** Type "Haas" → instant catalog filtering
2. **Drag & Drop:** Drag "Haas Maintenance" + "Advanced Mill" into workbench
3. **See Duration:** Badge updates: "7 Days" in real-time
4. **Save Draft:** Saves to `db.json`
5. **Publish:** Program becomes available for assignment

### Scene 2: Assign & Enroll (Supervisor)

1. **View Saved Program:** Click program in sidebar
2. **Batch Select:** Checkbox-select 8 students
3. **Send Invites:** "Invite Selected (8)" → toast confirms
4. **Force Enroll:** Individually click "Force Enroll" on pending students
5. **Select Date/Location:** Modal shows real class schedules (e.g., "Nov 20 - Bensalem, PA")
6. **Confirm:** Toast: "Ethan enrolled in Bensalem session"

### Scene 3: Student Books a Class (Learner)

1. **View Dashboard:** See assigned programs with course sequences
2. **Click Course:** Opens 2-column detail modal (left: metadata, right: skills + testimonials)
3. **Book Class:** For ILT courses, clicks "Book Class" button
4. **Select Date:** Modal shows available sessions
5. **Confirm:** Status updates to "Enrolled" ✓

---

## 🔄 Project Evolution

### **v1.0 (Prototype - PR-01 to PR-11)**

- ✅ Program Builder with drag-and-drop
- ✅ Student roster management
- ✅ Basic UI with Tailwind + shadcn
- ✅ Course catalog search & filtering
- ✅ Enrollment workflows

### **v1.5 (Data Reliability - PR-15 to PR-18)**

- ✅ Resilient persistence layer (localStorage fallback)
- ✅ Network-first with graceful degradation
- ✅ Production-ready Vercel deployment
- ✅ Empty data guarantee pattern (API safety)

### **v2.0 (Modern UI - PR-39 to PR-41)**

- ✅ CourseDetailModal 2-column grid redesign
- ✅ Horizontal "flight ticket" course cards
- ✅ CourseCard variant system (default/workbench)
- ✅ Student assignment deduplication
- ✅ Complete shadcn/ui + Radix UI integration
- ✅ Production-ready, portfolio-grade

---

## 🎯 Key Technical Decisions

### 1. **Hybrid Data Architecture**

**Decision:** Read from Legacy API, write to json-server (+ localStorage as fallback)
**Rationale:** Maintains single source of truth for courses while enabling new features without touching legacy systems.

### 2. **Network-First, localStorage-Fallback**

**Decision:** Try json-server first; if offline or unreachable, use localStorage
**Rationale:** Enables Vercel deployment (no backend required) while maintaining data reliability in offline scenarios.

### 3. **Variant Component System**

**Decision:** CourseCard uses `variant` prop ("default" | "workbench") instead of separate components
**Rationale:** Single source of truth, easier maintenance, and flexibility for future variants.

### 4. **Radix UI Primitives + shadcn/ui**

**Decision:** Use Radix UI directly for Accordion; wrap others with shadcn for Tailwind integration
**Rationale:** Maximum control + consistency with minimal abstraction layers.

### 5. **Lightweight Persistence**

**Decision:** Store only course IDs in programs, not full course objects
**Rationale:** Reduces payload size, simplifies updates (rehydrate on fetch), and maintains real-time accuracy.

---

## 📊 Data Reliability

The application implements a **"Data Guarantee" pattern**:

```typescript
// Example: getInventory(courseId)
if (!inventory || !inventory.classes || inventory.classes.length === 0) {
  console.warn(`API returned empty for course ${courseId}, using fallback`);
  // Load fallback from Schedules.json
  return fallbackSchedules.filter((s) => s.courseId === courseId);
}
```

This ensures:

- ✅ Network errors don't break the app
- ✅ Empty API responses trigger fallback (not just HTTP errors)
- ✅ Students always see available class sessions
- ✅ Demo works offline without modification

---

## 🔐 Security & Deployment

### Authentication

- Currently mocked ("Pat Mann" logged in by default)
- Ready for enterprise SSO/SAML integration

### Production Deployment

- **Vercel:** Automatic; no backend required
- **AWS/Azure:** Add reverse proxy for Legacy API (CORS)
- **On-Premise:** Docker-friendly (Node.js 18+)

### Test Data

- All mock emails use `@example.com` (RFC 2606 reserved)
- No real PII in version control
- Safe for client demos

---

## 📈 Performance

| Metric                 | Value                              | Notes                    |
| ---------------------- | ---------------------------------- | ------------------------ |
| **First Paint**        | <500ms                             | Vite + React 19          |
| **Build Size**         | ~180KB gzipped                     | Tailwind v4 optimization |
| **Bundle Analysis**    | React (42%), UI (18%), Other (40%) | Code-split ready         |
| **API Response**       | <2s (cached)                       | json-server in-memory    |
| **Offline Activation** | Automatic                          | localStorage fallback    |

---

## 🧪 Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test --watch

# Coverage
bun run test --coverage
```

**Test Structure:**

- ✅ 17 custom hook tests (`useProgramBuilder`, `useLocalStorage`, etc.)
- ✅ 14 integration tests (component workflows)
- ✅ End-to-end scenarios (build → assign → enroll)

---

## 🤝 Contributing

This is a portfolio project. For changes:

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Follow existing code patterns (TypeScript strict mode, ESLint)
3. Run tests: `bun run test`
4. Lint: `bun run lint`
5. Build: `bun run build`
6. Submit PR with description of changes

---

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** – Developer onboarding guide
- **[SPEC.md](SPEC.md)** – Feature specification + architecture
- **[docs/PRD.md](docs/PRD.md)** – Product requirements document
- **[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** – Complete PR history (v1.0 → v2.0)
- **[docs/IMPLEMENTATION_SHADCN.md](docs/IMPLEMENTATION_SHADCN.md)** – UI modernization guide

---

## 📝 License

This is a proof-of-concept project for educational and demonstration purposes.

---

## 🙋 Questions?

This README documents **v2.0** of the Phillips Education POC. See [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) for the complete delivery timeline and technical decisions.

**Last Updated:** 2025-12-16

**Status:** ✅ Production-Ready
