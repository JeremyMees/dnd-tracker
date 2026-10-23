# Rows live in one jsonb column and change through atomic row patches

There is no table of rows: `initiative_sheets.rows` is one jsonb array, checked
by a JSON schema constraint in the database. Up to 20 players and the DM can
write the same encounter at once, so row changes go through the
`apply_row_patches` RPC, which shallow-merges each patch (`elem || patch`) into
its row and bumps the broadcast `version` in a single UPDATE. A
read-modify-write from the server would lose concurrent writes, and a version
taken after the write could number two patches in the wrong order.

## Consequences

- Prefer a row patch over writing the whole `rows` array. A whole-array write
  from a stale client cache can overwrite another writer's change.
- The rows JSON schema has `additionalProperties: false`, so every new row field
  needs a SQL change before the code ships (see ADR-0003).
- Combat events need before and after values. A row patch provides them; a
  whole-sheet write has to be diffed.
