import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Summary from '~/components/live/Summary.vue'
import { closeDialog, dialogIsOpen } from '~~/test/nuxt/stubs/dialog'

const stats = shallowRef<CombatStats | undefined>(undefined)
const open = ref(false)
const dismiss = vi.fn(() => {
  open.value = false
})

const { useLiveSummaryMock } = vi.hoisted(() => ({
  useLiveSummaryMock: vi.fn(),
}))

mockNuxtImport('useLiveSummary', () => useLiveSummaryMock)

function makeStats(): CombatStats {
  return {
    rounds: 6,
    events: 2,
    damageTaken: 40,
    healingReceived: 0,
    timesDowned: 1,
    deaths: 0,
    deathSavesMade: 0,
    deathSavesFailed: 0,
    conditionsApplied: 0,
    concentrationBroken: 0,
    combatants: [
      {
        rowId: 'a',
        name: 'Monster 1',
        type: 'monster',
        damageTaken: 40,
        healingReceived: 0,
        tempHitPointsGained: 0,
        biggestHit: 25,
        timesDowned: 1,
        deathSavesMade: 0,
        deathSavesFailed: 0,
        conditionsSuffered: 0,
        concentrationBroken: 0,
        stabilized: 0,
        died: false,
        award: 'mostDamageTaken',
        awardValue: 40,
        awardExclusive: true,
      },
    ],
  }
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount() {
  wrapper = await mountSuspended(Summary)
  await flushPromises()

  return wrapper
}

describe('Live summary', () => {
  beforeEach(() => {
    stats.value = undefined
    open.value = false
    dismiss.mockClear()
    useLiveSummaryMock.mockReturnValue({ stats, open, dismiss })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should stay closed before a summary is broadcast', async () => {
    const component = await mount()

    expect(dialogIsOpen(component)).toBe(false)
  })

  it('Should stay closed when opened without any stats', async () => {
    open.value = true

    const component = await mount()

    expect(dialogIsOpen(component)).toBe(false)
  })

  it('Should stay closed when stats arrive but it was never opened', async () => {
    stats.value = makeStats()

    const component = await mount()

    expect(dialogIsOpen(component)).toBe(false)
  })

  it('Should open once a summary has been broadcast', async () => {
    stats.value = makeStats()
    open.value = true

    const component = await mount()

    expect(dialogIsOpen(component)).toBe(true)
  })

  it('Should hand the broadcast stats to the shared stats component', async () => {
    stats.value = makeStats()
    open.value = true

    const component = await mount()
    const inner = component.findComponent({ name: 'CombatSummaryStats' })

    expect(inner.exists()).toBe(true)
    expect(inner.props('stats')).toEqual(stats.value)
  })

  it('Should dismiss when the dialog is closed', async () => {
    stats.value = makeStats()
    open.value = true

    const component = await mount()

    await closeDialog(component)

    expect(dismiss).toHaveBeenCalled()
    expect(dialogIsOpen(component)).toBe(false)
  })

  it('Should reopen for a second broadcast after being dismissed', async () => {
    stats.value = makeStats()
    open.value = true

    const component = await mount()

    await closeDialog(component)
    open.value = true
    await flushPromises()

    expect(dialogIsOpen(component)).toBe(true)
  })
})
