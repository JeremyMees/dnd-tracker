# One production database; schema changes are hand-applied SQL

There is a single Supabase project and it is production: no staging, no preview
branches, no migration files. Schema, constraints, RPCs and RLS policies exist
only in the live database. Changes are written as idempotent SQL snippets and
the maintainer runs them in the Supabase SQL editor, then regenerates types with
`npm run sb:types`.

## Consequences

- `/supabase` is gitignored. `supabase/snippets/` and the `npm run sb:schema`
  dump (`supabase/schema.sql`) live only on the maintainer's machine. The dump
  is often older than the newest snippets.
- A snippet that changes a JSON schema constraint patches the live definition
  (`pg_get_constraintdef` + `replace()`, raising if nothing changed) instead of
  rebuilding it from the dump.
- RLS changes are verified with a transaction that impersonates a user and rolls
  back, never by clicking through the UI: an UPDATE blocked by RLS matches zero
  rows without raising an error, so the app shows its success toast anyway.
- Deploys that need a schema change must have the SQL applied first.
