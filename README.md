# TableForge AI - Frontend Branch

Frontend for TableForge AI, focused on a fast, modern interface for natural-language SQL workflows and relational data exploration.

## Project Overview

This branch delivers the user-facing experience for:
- writing natural language prompts and SQL,
- previewing generated SQL,
- running queries and inspecting tabular results,
- exploring schema and table relationships visually.

## Key Features

- Query editor with NL and SQL input modes
- SQL preview card with execution flow
- Live result grid with pagination and column controls
- Row detail side panel with typed field rendering
- Schema exploration and relationship visualization pages
- API routes for connect, disconnect, schema, and execute

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- shadcn/ui components
- TanStack Table
- React Flow (for ER/relationship visualization)
- Lucide icons

## Folder Structure

```text
app/
	page.tsx                # Query editor + result workflow
	schema/, relations/, history/
	api/                    # connect, disconnect, execute, schema
components/
	LiveGrid.tsx            # Results table + row detail panel
	QueryBar.tsx            # Prompt and SQL input UX
	RelationshipVisualizer.tsx
	layout/DashboardLayout.tsx
lib/
	api.ts
	db/
src/lib/
	ai/
	db/
types/
```

## Completed So Far

- Core dashboard layout and navigation
- Query input to SQL preview flow
- Executed-results state with interactive live grid
- Row detail panel behavior and formatting
- History, schema, and relations route scaffolding
- Initial API contract documentation

## Planned Next

- Replace mock frontend flows with live backend/database integration
- Persist query history and enhance filtering/search
- Expand schema/relationship interactions and drill-down actions
- Improve loading, empty, and error states across pages
- Add unit/integration tests and CI checks for frontend stability

## Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:8082.

