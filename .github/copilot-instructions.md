# Copilot Instructions for Ride-Hailing-Admin-Panel

## Build and lint commands

- Install: `npm install`
- Dev server: `npm run dev` (Next.js on port 3000)
- Build: `npm run build`
- Lint: `npm run lint`
- No test runner is configured.

## High-level architecture

Next.js 16 App Router admin panel (TypeScript). Client-first — most components use `"use client"`.

### Provider hierarchy (app/layout.tsx)

```
<html> → <body> → ProgressBar, ConnectionStatus, Providers (Redux), SidebarConfigProvider
```

### Route shells

- `app/auth/layout.tsx` → wraps auth pages in `<PublicRoute>` (redirects authenticated users to `/dashboard`).
- `app/dashboard/layout.tsx` → wraps dashboard pages in `<ProtectedRoute>` (redirects unauthenticated users to `/auth/login`) and mounts the sidebar/header shell.

### State management — Redux Toolkit

Store is at `lib/store.ts` with a single `auth` slice (`lib/slices/authSlice.ts`). Route guards read `state.auth.isAuthenticated`. When adding new domain data, create a new slice in `lib/slices/`, add it to the store's `reducer` map, and use typed hooks.

### API layer

`lib/api/axios.ts` exports a configured Axios instance. The request interceptor adds the Bearer token from `localStorage("authToken")`; the response interceptor clears auth and redirects on 401. Domain API modules go in `lib/api/` (see `auth.api.ts` as the pattern). The base URL is currently a placeholder — it needs an environment variable.

### Feature pages are route-colocated

Each dashboard route folder (e.g., `app/dashboard/users/`) contains `page.tsx`, feature-specific components in a `components/` subfolder, and optional seed data (`data.json`). Keep this pattern when adding new pages.

### Sidebar navigation

Data-driven from `navGroups` in `components/app-sidebar.tsx`, rendered via `components/nav-main.tsx`. Add new nav entries there.

## Key conventions

### Imports and aliases

Use `@/*` alias imports (mapped to project root in `tsconfig.json`). Never use deep relative paths.

### UI components — shadcn/ui

45+ shadcn/ui primitives live in `components/ui/`. Config is in `components.json` (style: `radix-vega`, base color: `stone`, icon library: `lucide`). Add new components with `npx shadcn@latest add <component>`. Always merge classes with `cn()` from `lib/utils.ts`.

### Styling and theming

- Primary color: `#e54a1a` (orange), defined as CSS variables in `app/globals.css`.
- Dark mode uses OKLCH color overrides in `.dark` class.
- Fonts: Figtree (sans), Geist, Geist Mono — loaded via `next/font` in root layout.
- Border radius default: `0.625rem`.
- Charts use shadcn chart components with Recharts (`--chart-1` through `--chart-5` CSS vars).

### Adding a new dashboard page

1. Create `app/dashboard/<feature>/page.tsx` (with `"use client"` directive).
2. Colocate feature components in `app/dashboard/<feature>/components/`.
3. Add a nav entry in `components/app-sidebar.tsx` inside `navGroups`.
4. If it needs API calls, create `lib/api/<feature>.api.ts` following the `auth.api.ts` pattern.
5. If it needs Redux state, create `lib/slices/<feature>Slice.ts` and register in `lib/store.ts`.

### Adding a Redux slice

Create the slice in `lib/slices/` using `createSlice` from `@reduxjs/toolkit`. Export the reducer and actions. Add the reducer to `configureStore` in `lib/store.ts`. Dispatch actions via `useDispatch` from `react-redux`.

### Forms

Use `react-hook-form` for form state. shadcn's `Form` component (`components/ui/form.tsx`) integrates with it.

### Responsive design

`hooks/use-mobile.ts` provides `useIsMobile()` with a 768px breakpoint. Sidebar config (variant, collapsible mode) is managed through `SidebarConfigProvider` / `useSidebarConfig()` — do not hardcode sidebar behavior per page.
