# The Player Portal works without player accounts

Players join a live session with a room code or QR code and pick a seat. They
never get a Supabase session; they hold signed tokens of three kinds (session,
seat, row), each with a `kind` claim so one can't be used in place of another.
Seats are a jsonb array on `live_sessions` changed through locking RPCs
(`claim_live_seat`, `remove_live_seat`, `reassign_live_seat`). A session allows
at most 20 seats, spectators included, to limit broadcast and presence load.
Sessions last 12 hours, and a DM who reopens the encounter rejoins the running
session.

## Consequences

- The server decides what each viewer may see. Monster rows (and other players'
  rows) show a health band instead of hit points, a hidden row shows as an
  anonymous `???` placeholder, and the Bloodied condition is stripped wherever
  raw hit points are hidden.
- Only `player` and `npc` rows can be claimed. A seat may only act on its own
  row, during that row's turn, within the DM's allow-list.
- Public endpoints call `assertRateLimit` first. Its limits allow a whole table
  of players sharing one IP address.
- The player page lives outside `/encounters/*`, which the auth middleware
  protects.
