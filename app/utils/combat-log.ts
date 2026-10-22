import { ONE_SECOND } from '~~/constants/time'

const COMBAT_LOG_OVERLAP = 10 * ONE_SECOND

export function combatLogSince(
  events: CombatEventRow[] | undefined,
): string | undefined {
  const stored = events?.filter(event => event.id > 0) ?? []

  if (!stored.length) return undefined

  const newest = Math.max(...stored.map(event => Date.parse(event.createdAt)))

  return new Date(newest - COMBAT_LOG_OVERLAP).toISOString()
}

export function mergeCombatLog(
  cached: CombatEventRow[],
  fresh: CombatEventRow[],
): CombatEventRow[] {
  const byId = new Map(
    cached.filter(event => event.id > 0).map(event => [event.id, event]),
  )

  for (const event of fresh) byId.set(event.id, event)

  return [...byId.values()].sort((a, b) => b.id - a.id)
}
