# Backend Deploy Checklist

## 1) Environment Variables

- `SUPABASE_URL` is set and valid.
- `SUPABASE_SERVICE_ROLE_KEY` is set (server-only, never expose in frontend).
- `PORT` is optional (defaults to `4000`).

## 2) Install Dependencies

```bash
cd backend
npm install
```

## 3) Apply Database Migrations

- Run all migrations in `backend/supabase/migrations`.
- Ensure these important migrations are included:
  - `20260324193000_erd_foundation_roles_salary_structure.sql`
  - `20260324200000_salary_engine_rpc.sql`
  - `20260324213000_seed_roles_permissions_matrix.sql`
  - `20260324220000_roles_upsert_and_permissions_bootstrap.sql`

## 4) Verify Core DB Artifacts

- Tables exist: `roles`, `employee_roles`, `salary_tiers`.
- Functions exist:
  - `calc_tier_salary(integer)`
  - `calculate_salary_for_employee_month(uuid, text, text, numeric, text)`
  - `calculate_salary_for_month(text, text)`
- `roles.permissions` has values for:
  - `admin`, `hr`, `finance/accountant`, `operations`, `viewer`

## 5) Start Backend

```bash
cd backend
npm run dev
```

- Expect log: `Backend API listening on port 4000`

## 6) Smoke Tests (HTTP)

- `GET /health` -> `200`
- `GET /auth/me` without token -> `401`
- `GET /employees` without token -> `401`
- `GET /salary/calc?employee=<uuid>&month=YYYY-MM` with invalid token -> `401`

## 7) JWT / Authorization Checks

- Use `Authorization: Bearer <supabase_access_token>`.
- Confirm role and permissions are enforced:
  - `employees:view`, `employees:write`, `employees:delete`
  - `orders:view`, `orders:write`
  - `attendance:view`, `attendance:write`
  - `salary:approve`
  - `roles:view`

## 8) Production Safety

- Never log service role key.
- Keep CORS restricted to trusted frontend domains.
- Rotate service keys if leaked.
