# SRD content is served from our own tables, synced from Open5e

The app reads D&D content from `srd_*` Postgres tables, filled by
`scripts/sync-open5e.ts` on a biweekly workflow. Before this, browsers called
`api.open5e.com` directly; it went down for hours on 2026-09-04 and had a
1.3–1.8 s cold response time. Search now answers in 190–450 ms. An Upstash cache
layer was used in between and has been removed.

## Consequences

- The `Open5e` prefix is only for code that talks to the upstream API or its
  wire format (sync script, transformers, DTO types, fixtures). Everything the
  app uses at runtime is named `Dnd*` / `Srd*`.
- `srd_*` rows marked `manual = true` (such as the Bloodied condition) are kept
  by the sync.
- All 15 core conditions come from one `core` document, so the chosen wording is
  2024 for every game system. Showing 2014 wording would need the per-edition
  descriptions stored.
