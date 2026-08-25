import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Playground from '~/pages/playground.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { playgroundSheet } from '~~/constants/initiative-playground'
import examples from '~~/constants/initiative-examples.json'
import { sheet as sharedSheet } from '~~/test/fixtures/initiative-sheet'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const tourSheet = examples as unknown as InitiativeSheet

const { getQueryData } = vi.hoisted(() => ({ getQueryData: vi.fn() }))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData }),
}))

const isTourActive = ref(false)
const tourData = ref<InitiativeSheet | undefined>()
const startTour = vi.fn()
const token = ref<string | undefined>()

mockNuxtImport('useTour', () => () => ({ startTour, tourData, isTourActive }))
mockNuxtImport('useSeo', () => () => {})
mockNuxtImport('useRoute', () => () => ({ query: { token: token.value } }))

const SheetProbe = defineComponent({
  setup() {
    return validateInject(INITIATIVE_SHEET)
  },
  template: '<p>{{ sheet?.title ?? "no sheet" }}</p>',
})

const stubs = {
  InitiativeTable: SheetProbe,
  EncounterSidebar: true,
  NuxtLayout: nuxtLayoutStub,
}

interface Probe {
  sheet: InitiativeSheet | undefined
  update: (payload: Partial<InitiativeSheet>) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
}

async function mountPlayground() {
  const component = await mountSuspended(Playground, { global: { stubs } })

  await nextTick()

  return {
    component,
    get probe() {
      return component.findComponent(SheetProbe).vm as unknown as Probe
    },
  }
}

describe('Playground page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    isTourActive.value = false
    tourData.value = undefined
    token.value = undefined

    startTour.mockImplementation(async () => {})
  })

  it('Should start the tour on mount', async () => {
    await mountPlayground()

    expect(startTour).toHaveBeenCalledWith(false)
  })

  it('Should provide the playground sheet when no tour runs', async () => {
    const { probe } = await mountPlayground()

    expect(probe.sheet?.title).toBe(playgroundSheet.title)
  })

  it('Should provide the tour sheet once the tour activates after setup', async () => {
    startTour.mockImplementation(async () => {
      isTourActive.value = true
      tourData.value = tourSheet
    })

    const { probe } = await mountPlayground()

    expect(probe.sheet?.title).toBe(tourSheet.title)
    expect(probe.sheet?.rows.length).toBe(tourSheet.rows.length)
  })

  it('Should fall back to the playground sheet when the tour closes', async () => {
    startTour.mockImplementation(async () => {
      isTourActive.value = true
      tourData.value = tourSheet
    })

    const { probe, component } = await mountPlayground()

    expect(probe.sheet?.title).toBe(tourSheet.title)

    isTourActive.value = false
    tourData.value = undefined

    await nextTick()

    expect(probe.sheet?.title).toBe(playgroundSheet.title)
    expect(component.text()).toContain(playgroundSheet.title)
  })

  it('Should apply updates to the playground sheet when no tour runs', async () => {
    const { probe } = await mountPlayground()

    await probe.update({ title: 'Renamed' })
    await nextTick()

    expect(probe.sheet?.title).toBe('Renamed')
  })

  it('Should apply updates to the tour sheet while the tour runs', async () => {
    startTour.mockImplementation(async () => {
      isTourActive.value = true
      tourData.value = { ...tourSheet }
    })

    const { probe } = await mountPlayground()

    await probe.update({ title: 'Renamed' })
    await nextTick()

    expect(probe.sheet?.title).toBe('Renamed')
    expect(tourData.value?.title).toBe('Renamed')
  })

  it('Should reindex rows on update', async () => {
    startTour.mockImplementation(async () => {
      isTourActive.value = true
      tourData.value = { ...tourSheet }
    })

    const { probe } = await mountPlayground()
    const rows = [...tourSheet.rows].reverse()

    await probe.update({ rows })
    await nextTick()

    expect(probe.sheet?.rows.map(row => row.index)).toEqual(
      rows.map((_, index) => index),
    )
  })

  it('Should provide the shared encounter cached under the token', async () => {
    token.value = 'share-token'
    getQueryData.mockReturnValue(sharedSheet)

    const { probe } = await mountPlayground()

    expect(getQueryData).toHaveBeenCalledWith([
      'useInitiativeSheetPlayground',
      'share-token',
    ])
    expect(probe.sheet?.title).toBe(sharedSheet.title)
  })

  it('Should show the error state when the token has no cached encounter', async () => {
    token.value = 'share-token'
    getQueryData.mockReturnValue(undefined)

    const { component } = await mountPlayground()

    expect(component.findComponent(SheetProbe).exists()).toBe(false)
    expect(component.text()).toContain('general.error.text')
  })

  it('Should apply updates to the shared encounter', async () => {
    token.value = 'share-token'
    getQueryData.mockReturnValue({ ...sharedSheet })

    const { probe } = await mountPlayground()

    await probe.update({ title: 'Renamed' })
    await nextTick()

    expect(probe.sheet?.title).toBe('Renamed')
  })

  it('Should apply a patchRow purely locally, without touching other rows', async () => {
    startTour.mockImplementation(async () => {
      isTourActive.value = true
      tourData.value = { ...tourSheet }
    })

    const { probe } = await mountPlayground()
    const untouched = tourSheet.rows.find(row => row.id !== '1')!

    await probe.patchRow('1', { hitPoints: 50 })
    await nextTick()

    expect(probe.sheet?.rows.find(row => row.id === '1')?.hitPoints).toBe(50)
    expect(
      probe.sheet?.rows.find(row => row.id === untouched.id)?.hitPoints,
    ).toBe(untouched.hitPoints)
    expect(tourData.value?.rows.find(row => row.id === '1')?.hitPoints).toBe(50)
  })

  it('Should no-op patchRow for a row that does not exist', async () => {
    const { probe } = await mountPlayground()

    await probe.patchRow('missing-row', { hitPoints: 50 })
    await nextTick()

    expect(probe.sheet?.rows).toEqual(playgroundSheet.rows)
  })
})
