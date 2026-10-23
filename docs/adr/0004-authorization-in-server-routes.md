# Writes go through server routes; the service-role client bypasses RLS

Server routes use `serverSupabaseServiceRole`, which bypasses RLS, and enforce
authorization in code (`requireEncounterAccess`, `requireCampaignAccess`, seat
tokens for the Player Portal). RLS remains the guard for queries the browser
runs directly through PostgREST. Anything that needs atomicity, a plan limit, or
anonymous access goes server-side.

## Consequences

- A route that skips its auth check has no database-level safety net.
- RLS helper functions (`campaign_role`, `can_read_campaign`, `is_pro`) live in
  the unexposed `private` schema. Policies need `EXECUTE` on them, so revoking
  it breaks every policy. Moving them out of `public` is what removes their
  `/rest/v1/rpc` endpoint.
- RPCs that server routes call through `.rpc()` stay in `public` and are granted
  to `service_role` only.
- Never write a `with check (true)` policy next to a narrow `USING`:
  `WITH CHECK` is OR'd across all permissive policies, so it opens the hole for
  every role. Postgres also checks SELECT policies against the new row of an
  UPDATE.
