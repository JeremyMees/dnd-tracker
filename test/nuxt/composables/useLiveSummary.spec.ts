import { beforeEach, describe, expect, it } from 'vitest'

function makeStats(rounds = 3): CombatStats {
  return {
    rounds,
    events: 1,
    damageTaken: 10,
    healingReceived: 0,
    timesDowned: 0,
    deaths: 0,
    deathSavesMade: 0,
    deathSavesFailed: 0,
    conditionsApplied: 0,
    concentrationBroken: 0,
    combatants: [],
  }
}

describe('useLiveSummary', () => {
  beforeEach(() => {
    useLiveSummary().clear()
  })

  it('Should start closed with no stats', () => {
    const { stats, open } = useLiveSummary()

    expect(stats.value).toBeUndefined()
    expect(open.value).toBe(false)
  })

  it('Should store the stats and open when shown', () => {
    const { show, stats, open } = useLiveSummary()

    show(makeStats(5))

    expect(stats.value?.rounds).toBe(5)
    expect(open.value).toBe(true)
  })

  it('Should keep the stats when dismissed', () => {
    const { show, dismiss, stats, open } = useLiveSummary()

    show(makeStats())
    dismiss()

    expect(open.value).toBe(false)
    expect(stats.value).toBeDefined()
  })

  it('Should reopen with newer stats on a second broadcast', () => {
    const { show, dismiss, stats, open } = useLiveSummary()

    show(makeStats(2))
    dismiss()
    show(makeStats(9))

    expect(open.value).toBe(true)
    expect(stats.value?.rounds).toBe(9)
  })

  it('Should drop everything when cleared', () => {
    const { show, clear, stats, open } = useLiveSummary()

    show(makeStats())
    clear()

    expect(stats.value).toBeUndefined()
    expect(open.value).toBe(false)
  })

  it('Should share state between callers', () => {
    const a = useLiveSummary()
    const b = useLiveSummary()

    a.show(makeStats(7))

    expect(b.stats.value?.rounds).toBe(7)
    expect(b.open.value).toBe(true)

    b.dismiss()

    expect(a.open.value).toBe(false)
  })
})
