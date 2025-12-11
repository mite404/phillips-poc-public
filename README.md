# Phillips Education POC

A React + TypeScript + Vite application for managing educational programs. This POC integrates with a legacy Phillips API to display program catalogs and includes a mock JSON server for local data management.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- Node.js 18+ (for compatibility)

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd phillips-poc
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your API endpoints**

   ```env
   VITE_LEGACY_API_BASE=https://your-api-endpoint.com/api
   VITE_LOCAL_API_BASE=http://localhost:3001
   ```

   **⚠️ IMPORTANT:** Never commit `.env` to version control!

### Development

Start both the Vite dev server and json-server concurrently:

```bash
bun dev
```

This will start:

- **Vite dev server** on `http://localhost:5173`
- **JSON Server** on `http://localhost:3001`

### Other Commands

```bash
bun run build        # TypeScript compilation + Vite build
bun run lint         # Run ESLint
bun run preview      # Preview production build
bun run server       # Run json-server only
```

## 📂 Project Structure

```
src/
├── api/              # API integration layer
│   ├── utils.ts      # Fetch wrapper with base URLs
│   ├── legacyRoutes.ts   # Legacy API calls
│   └── localRoutes.ts    # Local json-server calls
├── components/       # React components
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── data/             # Static fallback JSON files
```

## 🔒 Security

This repository contains sanitized example data only:

- All student data uses `@example.com` email addresses (RFC 2606 reserved domain)
- API endpoints are configured via environment variables
- Sensitive configuration is excluded from version control

## 📚 Documentation

- [SPEC.md](docs/SPEC.md) - Full project specification
- [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) - Implementation progress tracker
- [GETTING_STARTED_PR04.md](docs/GETTING_STARTED_PR04.md) - PR-04 tutorial guide

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (with @tailwindcss/vite plugin)
- **UI Components:** shadcn/ui (New York style, Lucide icons)
- **State Management:** React hooks, custom hooks
- **Routing:** React Router DOM v7
- **Mock API:** json-server (port 3001)
- **Package Manager:** Bun

## 🏗️ Architecture

- **Hybrid Data Model:** Read from Legacy API, write to local json-server
- **Lightweight Persistence:** Store course IDs only, not full objects
- **Fallback Strategy:** Automatically uses local JSON if API fails
- **Pure Tailwind + HTML:** Minimal shadcn/ui usage for rapid prototyping

## 📝 License

This is a proof-of-concept project for demonstration purposes.

---

## React + Vite Configuration

This template uses [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) with Babel for Fast Refresh.

### Expanding the ESLint configuration

For production applications, we recommend updating the ESLint configuration to enable type-aware lint rules. See the [original React + Vite template documentation](https://github.com/vitejs/vite-plugin-react) for details.
