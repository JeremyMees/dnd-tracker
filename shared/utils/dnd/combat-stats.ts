type Metric = Exclude<CombatAward, 'died' | 'unscathed'>

const METRICS: { award: Metric; value: (stats: CombatantStats) => number }[] = [
  { award: 'mostDamageTaken', value: s => s.damageTaken },
  { award: 'mostTimesDowned', value: s => s.timesDowned },
  { award: 'biggestHit', value: s => s.biggestHit },
  { award: 'mostDeathSavesFailed', value: s => s.deathSavesFailed },
  { award: 'mostHealingReceived', value: s => s.healingReceived },
  { award: 'mostDeathSavesMade', value: s => s.deathSavesMade },
  { award: 'mostConditions', value: s => s.conditionsSuffered },
  { award: 'mostConcentrationBroken', value: s => s.concentrationBroken },
  { award: 'mostTempHitPoints', value: s => s.tempHitPointsGained },
]

function emptyStats(row: CombatStatsRow): CombatantStats {
  return {
    rowId: row.id,
    name: row.name,
    type: row.type,
    damageTaken: 0,
    healingReceived: 0,
    tempHitPointsGained: 0,
    biggestHit: 0,
    timesDowned: 0,
    deathSavesMade: 0,
    deathSavesFailed: 0,
    conditionsSuffered: 0,
    concentrationBroken: 0,
    stabilized: 0,
    died: false,
    award: 'unscathed',
    awardValue: 0,
    awardExclusive: true,
  }
}

function applyEvent(stats: CombatantStats, event: CombatStatsEvent): void {
  const payload = (event.payload ?? {}) as CombatEventPayload
  const amount = payload.amount ?? 0

  switch (event.type as CombatEventType) {
    case 'hp':
      if (payload.kind === 'damage') {
        stats.damageTaken += amount
        stats.biggestHit = Math.max(stats.biggestHit, amount)

        const before = payload.before ?? 0
        const after = payload.after ?? 0

        if (after <= 0 && before > 0) stats.timesDowned += 1
      } else if (payload.kind === 'heal') {
        stats.healingReceived += amount
      } else if (payload.kind === 'temp') {
        stats.tempHitPointsGained += amount
      }
      break
    case 'condition_added':
      stats.conditionsSuffered += 1
      break
    case 'concentration_broken':
      stats.concentrationBroken += 1
      break
    case 'death_save':
      if (payload.result === 'fail') stats.deathSavesFailed += amount
      else if (payload.result === 'save') stats.deathSavesMade += amount
      break
    case 'stabilized':
      stats.stabilized += 1
      break
    case 'died':
      stats.died = true
      break
  }
}

function assignAwards(combatants: CombatantStats[]): void {
  const pending = combatants.filter(stats => {
    if (!stats.died) return true

    stats.award = 'died'
    stats.awardValue = stats.damageTaken
    stats.awardExclusive = true

    return false
  })

  const claimed = new Set<string>()

  for (const { award, value } of METRICS) {
    const leader = pending
      .filter(stats => !claimed.has(stats.rowId) && value(stats) > 0)
      .sort((a, b) => value(b) - value(a))[0]

    if (!leader) continue

    leader.award = award
    leader.awardValue = value(leader)
    leader.awardExclusive = true
    claimed.add(leader.rowId)
  }

  for (const stats of pending) {
    if (claimed.has(stats.rowId)) continue

    const best = METRICS.map(({ award, value }) => ({
      award,
      value: value(stats),
    })).sort((a, b) => b.value - a.value)[0]

    if (best && best.value > 0) {
      stats.award = best.award
      stats.awardValue = best.value
      stats.awardExclusive = false
    }
  }
}

export function aggregateCombatStats(
  events: CombatStatsEvent[],
  rows: CombatStatsRow[],
  rounds: number,
): CombatStats {
  const byRow = new Map<string, CombatantStats>(
    rows.map(row => [row.id, emptyStats(row)]),
  )

  for (const event of events) {
    let stats = byRow.get(event.rowId)

    if (!stats) {
      const payload = (event.payload ?? {}) as CombatEventPayload

      stats = emptyStats({
        id: event.rowId,
        name: payload.rowName ?? '',
        type: 'monster',
      })

      byRow.set(event.rowId, stats)
    }

    applyEvent(stats, event)
  }

  const combatants = [...byRow.values()]

  assignAwards(combatants)

  return {
    rounds,
    events: events.length,
    damageTaken: combatants.reduce((acc, s) => acc + s.damageTaken, 0),
    healingReceived: combatants.reduce((acc, s) => acc + s.healingReceived, 0),
    timesDowned: combatants.reduce((acc, s) => acc + s.timesDowned, 0),
    deaths: combatants.filter(s => s.died).length,
    deathSavesMade: combatants.reduce((acc, s) => acc + s.deathSavesMade, 0),
    deathSavesFailed: combatants.reduce(
      (acc, s) => acc + s.deathSavesFailed,
      0,
    ),
    conditionsApplied: combatants.reduce(
      (acc, s) => acc + s.conditionsSuffered,
      0,
    ),
    concentrationBroken: combatants.reduce(
      (acc, s) => acc + s.concentrationBroken,
      0,
    ),
    combatants,
  }
}
