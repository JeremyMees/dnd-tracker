# Turns advance on the server

Moving to the next turn calls `POST /api/encounter/[id]/turn`, which ticks
condition durations, refreshes resources, logs `condition_expired` events and
broadcasts the result in one step. The DM and the Player Portal's end turn use
the same endpoint. The update is conditional on the current `activeIndex` and
`round`, so two clicks at the same moment produce one advance and a 409. The
playground runs the same pure `advanceTurn` in the browser.

## Consequences

- Going back a turn is a correction: it does not restore expired conditions or
  durations.
