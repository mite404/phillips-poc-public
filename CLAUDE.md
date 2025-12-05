# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Phillips Education POC - a React + TypeScript + Vite application for managing educational programs. The application integrates with a legacy Phillips API to display program catalogs and includes a mock JSON server for local data management.

## Development Commands

### Running the Application
```bash
bun dev              # Start both Vite dev server and json-server concurrently
bun run server       # Run json-server only on port 3001
```

### Build and Quality
```bash
bun run build        # TypeScript compilation + Vite build
bun run lint         # Run ESLint on .ts and .tsx files
bun run preview      # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (with @tailwindcss/vite plugin), shadcn/ui components
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router DOM v7
- **UI Components**: shadcn/ui (New York style, Lucide icons)
- **Mock API**: json-server (port 3001)
- **Package Manager**: Bun

### Key Integrations

**Legacy API Integration**: The application fetches from the Phillips X PIMS staging API at `https://phillipsx-pims-stage.azurewebsites.net/api/Program/GetAll`. This returns a `result` array of `LegacyProgram` objects that are filtered for active programs.

**Local Mock Data**: `db.json` contains three collections:
- `custom_programs`: Custom program definitions with course sequences
- `assignments`: Program assignments to learners
- `enrollments`: Course enrollment records

Access via json-server at `http://localhost:3001/{collection}`

### Project Structure

**Path Aliases**: The project uses `@/*` to reference `./src/*` (configured in both vite.config.ts and tsconfig.json)

**Component Architecture**:
- `ProgramList` (src/components/ProgramList.tsx): Main container component that fetches programs from the legacy API, handles loading/error states, and renders a grid of program cards
- `ProgramCard` (src/components/ProgramCard.tsx): Presentational component for displaying individual program details with image, metadata (duration, course count), skills, and pricing

**Type Definitions**: Located in `src/types/models.ts`. The primary model is `LegacyProgram` which includes program metadata, courses, skills, and pricing information.

**UI Components**: shadcn/ui components in `src/components/ui/` including button, card, badge, skeleton, and sonner (toast notifications)

### Styling System

**Brand Colors**: Phillips brand colors are defined as HSL custom properties in src/index.css:
- `--phillips-blue`: #005596 (HSL: 206 100% 29%)
- `--phillips-red`: #D31245 (HSL: 344 84% 45%)

Use in Tailwind: `text-phillips-blue`, `bg-phillips-red`, etc.

**Tailwind Configuration**: The project uses Tailwind v4 with the Vite plugin. Configuration is minimal in tailwind.config.js (primarily for defining content paths). Most theming happens via CSS custom properties in src/index.css using the `@theme inline` directive.

**Dark Mode**: Configured with custom variant `@custom-variant dark (&:is(.dark *))` and full dark mode color palette defined in src/index.css

## Development Notes

**Concurrent Development**: The `bun dev` command runs both Vite (default port 5173) and json-server (port 3001) simultaneously using concurrently. Both services must be running for full functionality.

**Data Flow**: Currently, the ProgramList component only reads from the external API. The local json-server data (custom_programs, assignments, enrollments) is available but not yet integrated into the UI.

**ESLint Configuration**: Uses flat config format with TypeScript ESLint, React Hooks plugin, and React Refresh plugin. Ignores the dist directory.
