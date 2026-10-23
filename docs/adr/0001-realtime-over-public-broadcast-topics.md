# Realtime goes over public broadcast topics, never postgres_changes

Both the DM's sheet (`sheet:<encounter id>`) and the Player Portal
(`live:<session uuid>`) sync over Supabase Broadcast topics, and the server is
the only sender. Players have no account, and a 2026-08-09 spike showed anon
clients receive nothing from `postgres_changes` (RLS holds), so database change
feeds could never reach them. Using broadcast for the DM too gives one sync path
instead of two.

## Consequences

- Every server broadcast carries a monotonic `version`. Clients apply messages
  in order, and refetch the full state when they see a gap or reconnect.
- A public topic lets anyone who knows the session uuid publish to it, so a
  player could show forged values on other screens. That's accepted: nothing
  persists without going through a validated server route, and the next
  versioned message or refetch corrects it. If this ever matters, the upgrade
  path is Supabase anonymous sign-ins plus a private channel scoped by RLS, at
  the cost of one auth user per player.
- The project uses new-format API keys (`sb_publishable_…` / `sb_secret_…`), so
  anything that relies on a legacy shared JWT secret is not available.
