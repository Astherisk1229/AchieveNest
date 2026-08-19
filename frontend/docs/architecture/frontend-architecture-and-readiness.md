# Frontend Architecture and Readiness Audit

Authoritative architecture specification, layer design, and backend readiness audit for the **AchieveNest Frontend Application**.

## 1. Architectural Principles

AchieveNest frontend follows an explicit **Model-Controller-Hook-View** architecture:
- **Models (`src/models/`)**: Pure domain models, data transformation, validation rules, rating engines.
- **Controllers (`src/controllers/`)**: State managers, business process orchestration, local storage persistence, audit logging.
- **Hooks (`src/hooks/`)**: Custom React hooks exposing reactive states and memoized controller methods to UI components.
- **Pages & Components (`src/pages/`, `src/components/`)**: Presentational views and layout compositions.

## 2. Shell Preservation & Code Splitting

- The shared application shell (`Sidebar`, `Topbar`, `MainLayout`) remains permanently mounted.
- Dynamic page routes in `src/App.jsx` are split using `React.lazy()` with `<Suspense fallback={<RouteLoadingFallback />}>` wrapped inside the `<LayoutShell>` outlet.

## 3. Quality Gate & Testing Standards

- **ESLint / Oxlint Quality Gate**: `npm run lint` must exit with code 0 (0 errors).
- **Vitest Unit Test Runner**: Pure unit tests executed via Node test environment (`vitest run`).
- **Build Bundle Optimization**: Main entry bundle maintained under 400 kB minified.
