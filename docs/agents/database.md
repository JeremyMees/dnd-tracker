# Database

There is one Supabase database and it is production (ADR-0003). Nothing
rehearses a change before it is live, so every change is written to be safe to
run twice and is checked inside a rolled-back transaction first.

## Shipping a schema change

1. Write an idempotent SQL snippet (`create or replace`, `if not exists`,
   guarded `alter`) and put the full SQL in the step report. The maintainer
   keeps snippets in the gitignored `supabase/snippets/` and runs them in the
   Supabase SQL editor.
2. Make the SQL ship before the code that depends on it. A new row field, combat
   event type or enum value fails every write until the constraint allows it.
3. After it is applied, the maintainer runs `npm run sb:types` to regenerate
   `shared/types/database-generated.ts` (never edit that file). jsonb columns
   and RPC signatures come through as `Json`, so give them real types in
   `DatabaseOverrides` in `shared/types/database.ts`.

For DDL on live tables, send one statement at a time behind
`set lock_timeout = '3s';`. A policy change once deadlocked with live traffic.
The SQL editor silently cuts off long scripts, which shows up as
`42601 unterminated dollar-quoted string`. Split the script, and use distinct
dollar-quote tags (`$fn$`, `$d$`).

## Reading the live schema

Constraints, RPC bodies, triggers and policies exist only in the database.
`npm run sb:schema` dumps them to the gitignored `supabase/schema.sql` (needs
Docker; the maintainer runs it). Two traps:

- The dump is often older than the newest snippets.
- When Docker is not running, the command empties `schema.sql` before failing.
  Copy the file aside before running it.

`postgresErrorToH3Error` forwards only the Postgres code (for example `23514`, a
CHECK violation), never the constraint name, so use the dump to find which
constraint fired.

## JSON schema constraints

`initiative_sheets.rows`, `infoCards`, `live_sessions.seats` and similar jsonb
columns are checked with `jsonb_matches_schema`. The rows schema has
`additionalProperties: false`, and it rejects `null` where it expects a number
or boolean (SRD conditions store nulls, so writes go through
`sanitizeCondition`).

To change one, patch the live definition rather than rebuilding it from the
dump: read it with `pg_get_constraintdef`, change it with `replace()`, and raise
an error if the replace changed nothing. A snippet that rebuilds the schema from
a stale dump silently drops newer fields.

## RPCs

Server routes call RPCs with the service-role client. An RPC is
`security definer` with `set search_path = public`, has
`revoke all … from public`, and is granted to `service_role` only. Raise `P0001`
/ `P0002` for expected failures and map them to HTTP status codes with
`postgresErrorToH3Error`'s `statusCode` option. Keep the atomic RPCs
(`apply_row_patches`, `claim_live_seat`) in SQL; their atomicity is the reason
they exist.

## RLS

Policies guard what the browser can do through PostgREST. Server routes bypass
them (ADR-0004).

### Testing a policy

Clicking through the UI can't verify a tightened policy: an UPDATE that RLS
filters out matches zero rows, raises no error, and the app shows its success
toast. Impersonate a user inside a transaction and read row counts instead:

```sql
begin;
-- policy DDL under test
set local role authenticated;
set local request.jwt.claims = '{"sub":"<user uuid>","role":"authenticated"}';
-- the exact queries the app runs
rollback;
```

For a multi-case report, end a `DO` block with `raise exception '%', report`, so
the result arrives as the error message and nothing can commit. Wrap each case
in its own `begin … exception` block and print `sqlstate` and `sqlerrm`, so one
failure doesn't hide the rest and an RLS denial (`42501`) can be told apart from
a foreign key (`23503`).

### How Postgres evaluates policies

These were measured on this database:

- An UPDATE must pass the OR of the UPDATE policies' `WITH CHECK` **and** the OR
  of the SELECT policies, applied to the new row. A user cannot update a row
  into a state they could no longer read. This is why transferring ownership
  adds the old owner to `team` before changing `createdBy`.
- `WITH CHECK` is OR'd across every permissive policy, whether or not that
  policy's `USING` passed. A `with check (true)` therefore applies to every role
  that can pass any other policy.
- The querying role needs `EXECUTE` on every function a policy calls. Helpers
  live in the unexposed `private` schema with `grant usage` to `authenticated`.
  `SECURITY INVOKER` does not work for a helper that reads the table its policy
  guards: it recurses.
- `for all` includes SELECT, so a `for all` write policy also counts as a read
  policy.

### Current state

- `team` and `join_campaign` have no insert policies. Invites are created only
  by `server/api/emails/campaign-invite.post.ts`, and team rows only by
  accept-invite with the service role. Keep browser inserts out of both tables.
- `campaign_role()` returns no role for members of a campaign whose owner isn't
  on Pro (ADR-0010). Patch campaign access through that one function, not
  through each policy.
- Personal encounter and campaign listings send no owner filter; RLS alone
  scopes them.
- The four `unused_index` advisories cover foreign keys and are accepted.
  Dropping them makes cascade deletes scan child tables.

## Maintenance mode

`NUXT_PUBLIC_MAINTENANCE_MODE=true` sends every route except `/maintenance` to
the maintenance page, `/api/*` and the Player Portal included. It's a runtime
config value, so switching it needs a Vercel env change and a redeploy (about
2–3 minutes each way). Batch risky changes into one window.
