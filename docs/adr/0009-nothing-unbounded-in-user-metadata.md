# Nothing unbounded goes into Supabase user_metadata

`user_metadata` is sent in the auth cookie and the access token on every
request. A 14 KB avatar data URI stored there pushed requests past Vercel's 32
KB header limit (`494 REQUEST_HEADER_TOO_LARGE`) for every account that
registered. Avatars live only in `profiles.avatar`, and registration runs
server-side in `server/api/user/create.post.ts`: it calls `signUp` with the anon
server client, so Supabase still sends the confirmation email, then inserts the
profile with the service role.

## Consequences

- A duplicate signup must be detected with `data.user.identities?.length === 0`
  before any rollback `deleteUser`. Otherwise a retry with an existing email
  deletes that real account.
