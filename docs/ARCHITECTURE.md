# Architecture — Muhimmat (frontend)

> **Purpose:** Give a **single map** of how data and UI connect so reviews and refactors stay consistent.

---

## 1) Layered model (mental model)

```
┌─────────────────────────────────────────────────────────┐
│  Routes / Pages (frontend/modules/...)                 │
│  — UI, forms, tables, local UI state                    │
└───────────────────────┬─────────────────────────────────┘
                        │ calls
┌───────────────────────▼─────────────────────────────────┐
│  Hooks (frontend/shared/hooks/...)                        │
│  — useQuery keys, enabled, refetch, feature-specific glue  │
└───────────────────────┬─────────────────────────────────┘
                        │ calls
┌───────────────────────▼─────────────────────────────────┐
│  Services (frontend/services/*.ts)                      │
│  — Supabase/RPC, throws ServiceError / handleSupabaseError │
└───────────────────────┬─────────────────────────────────┘
                        │ uses
┌───────────────────────▼─────────────────────────────────┐
│  Supabase client (frontend/services/supabase/client.ts)   │
│  PostgreSQL + Auth + (optional) Realtime                  │
└───────────────────────────────────────────────────────────┘
```

**Cross-cutting:**

- **Auth:** `AuthContext` + `ProtectedRoute` — gate routes and identity.
- **React Query:** server cache, retries, deduplication — default options in `App.tsx` (`QueryClient`).
- **Errors:** services throw; UI catches and shows toast (pattern varies by page; see `useQueryErrorToast`, `useErrorHandler`).

---

## 2) Path aliases (Vite)

Defined in `frontend/vite.config.ts`:

| Alias | Points to |
|-------|-----------|
| `@app` | `frontend/app` |
| `@services` | `frontend/services` |
| `@modules` | `frontend/modules` |
| `@shared` | `frontend/shared` |

Imports should use these — **no deep relative imports** across feature boundaries when avoidable.

---

## 3) Query keys (React Query)

- Keys are **scoped by feature** and often include **user id** (via `authQueryUserId` / `useAuthQueryGate`) to avoid cross-user cache bleed.
- **Rule:** `enabled` should be `true` only when required IDs and auth are ready (see hooks under `frontend/shared/hooks/`).

---

## 4) Services layer

- One file per domain is typical (`employeeService.ts`, `orderService.ts`, …).
- **Do not** return raw `{ data, error }` to the UI for every call — prefer **throw** on error after `handleSupabaseError` (or equivalent) so callers use `try/catch` or Query error state consistently.

---

## 5) Permissions

- Page-level checks use **`usePermissions(pageKey)`** (see `frontend/shared/hooks/usePermissions.ts` pattern) backed by `user_permissions` in Supabase.
- Sidebar / routes may still hide pages — **always enforce sensitive actions on the server (RLS/RPC)**.

---

## 6) i18n & RTL

- Language and direction live in providers under `frontend/app/providers/` (e.g. `LanguageContext`).
- UI should respect RTL for layout; avoid hard-coded LTR-only assumptions in shared components.

---

## 7) What not to do (anti-patterns)

- Duplicating Supabase queries inside random components instead of `services/`.
- Queries without `enabled` when they depend on `user?.id` or route params — causes useless requests and bugs.
- Committing generated folders (`dist/`, `frontend/coverage/`) — see root `.gitignore`.

---

## 8) Related docs

- **`docs/HANDOVER.md`** — runbook for a new maintainer.  
- **`docs/CONTRIBUTING.md`** — rules before changing code.
