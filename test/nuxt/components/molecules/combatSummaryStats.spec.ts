import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CombatSummaryStats from '~/components/molecules/CombatSummaryStats.vue'

const reduced = ref<boolean>(true)

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(),
}))

mockNuxtImport('useReducedMotion', () => useReducedMotionMock)

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

function makeCombatant(
  overrides: Partial<CombatantStats> & { rowId: string },
): CombatantStats {
  return {
    name: 'Elara',
    type: 'player',
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
    ...overrides,
  }
}

function makeStats(overrides: Partial<CombatStats> = {}): CombatStats {
  return {
    rounds: 5,
    events: 3,
    damageTaken: 46,
    healingReceived: 12,
    timesDowned: 2,
    deaths: 1,
    deathSavesMade: 3,
    deathSavesFailed: 1,
    conditionsApplied: 4,
    concentrationBroken: 2,
    combatants: [makeCombatant({ rowId: 'a' })],
    ...overrides,
  }
}

async function mount(stats: CombatStats) {
  wrapper = await mountSuspended(CombatSummaryStats, { props: { stats } })

  return wrapper
}

describe('Combat summary stats', () => {
  beforeEach(() => {
    reduced.value = true
    useReducedMotionMock.mockReturnValue(reduced)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render a tile for every global total', async () => {
    const component = await mount(makeStats())

    expect(component.findAll('[test-id="total"]').length).toBe(8)
  })

  it('Should show the global numbers', async () => {
    const component = await mount(makeStats())
    const text = component.get('[test-id="totals"]').text()

    expect(text).toContain('46')
    expect(text).toContain('12')
    expect(text).toContain('components.combatSummary.totals.damage')
    expect(text).toContain('components.combatSummary.deathSavesValue')
  })

  it('Should render one award card per combatant', async () => {
    const component = await mount(
      makeStats({
        combatants: [
          makeCombatant({ rowId: 'a', name: 'Elara' }),
          makeCombatant({ rowId: 'b', name: 'Bruenor' }),
          makeCombatant({ rowId: 'c', name: 'Goblin', type: 'monster' }),
        ],
      }),
    )

    const names = component
      .findAll('[test-id="award-name"]')
      .map((node: { text: () => string }) => node.text())

    expect(names).toEqual(['Elara', 'Bruenor', 'Goblin'])
  })

  it('Should use the superlative phrasing for an exclusive award', async () => {
    const component = await mount(
      makeStats({
        combatants: [
          makeCombatant({
            rowId: 'a',
            award: 'mostDamageTaken',
            awardValue: 22,
            awardExclusive: true,
          }),
        ],
      }),
    )

    expect(component.get('[test-id="award-label"]').text()).toContain(
      'components.combatSummary.awards.exclusive.mostDamageTaken',
    )
  })

  it('Should use the plain phrasing for a duplicated award', async () => {
    const component = await mount(
      makeStats({
        combatants: [
          makeCombatant({
            rowId: 'a',
            award: 'mostDamageTaken',
            awardValue: 10,
            awardExclusive: false,
          }),
        ],
      }),
    )

    expect(component.get('[test-id="award-label"]').text()).toContain(
      'components.combatSummary.awards.plain.mostDamageTaken',
    )
  })

  it.each([
    'died',
    'mostDamageTaken',
    'mostTimesDowned',
    'biggestHit',
    'mostDeathSavesFailed',
    'mostHealingReceived',
    'mostDeathSavesMade',
    'mostConditions',
    'mostConcentrationBroken',
    'mostTempHitPoints',
    'unscathed',
  ] as CombatAward[])('Should render an icon for the %s award', async award => {
    const component = await mount(
      makeStats({ combatants: [makeCombatant({ rowId: 'a', award })] }),
    )

    const card = component.get('[test-id="award"]')

    expect(card.find('svg, .iconify, [aria-hidden="true"]').exists()).toBe(true)
    expect(card.text()).toContain(
      `components.combatSummary.awards.exclusive.${award}`,
    )
  })

  it('Should render nothing in the award list when there are no combatants', async () => {
    const component = await mount(makeStats({ combatants: [] }))

    expect(component.findAll('[test-id="award"]').length).toBe(0)
  })

  describe('Entrance animation', () => {
    it('Should count every numeric total up rather than printing it', async () => {
      reduced.value = false

      const component = await mount(makeStats())

      expect(component.findAll('[test-id="count-up"]').length).toBe(7)
      expect(component.get('[test-id="totals"]').text()).not.toContain('46')
    })

    it('Should land on the real totals once the count-up finishes', async () => {
      reduced.value = false

      const component = await mount(makeStats())

      await vi.waitFor(() => {
        const text = component.get('[test-id="totals"]').text()

        expect(text).toContain('46')
        expect(text).toContain('12')
      })
    })

    it('Should stagger the counters so they arrive one line at a time', async () => {
      reduced.value = false

      const component = await mount(makeStats())

      const delays = component
        .findAllComponents({ name: 'AnimationCountUp' })
        .map((node: { props: (name: string) => unknown }) =>
          Number(node.props('delay')),
        )

      expect(delays).toHaveLength(7)
      expect(delays[0]).toBe(0)

      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1]!)
      }
    })

    it('Should give every tile and award a distinct place in the sequence', async () => {
      reduced.value = false

      const component = await mount(
        makeStats({
          combatants: [
            makeCombatant({ rowId: 'a' }),
            makeCombatant({ rowId: 'b' }),
            makeCombatant({ rowId: 'c' }),
          ],
        }),
      )

      expect(component.findAll('[test-id="total"]').length).toBe(8)
      expect(component.findAll('[test-id="award"]').length).toBe(3)
    })

    it('Should not offset anything when motion is reduced', async () => {
      const component = await mount(makeStats())

      const styles = component
        .findAll('[test-id="total"]')
        .map(
          (node: { attributes: (name: string) => string | undefined }) =>
            node.attributes('style') ?? '',
        )

      expect(
        styles.every((style: string) => !style.includes('translateY')),
      ).toBe(true)
    })
  })
})
