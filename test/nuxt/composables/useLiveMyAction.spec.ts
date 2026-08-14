import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveMyAction } from '~/composables/useLiveMyAction'

const { fetchMock, getQueryData, setQueryData, toast } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData, setQueryData }),
}))

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)

interface Probe {
  pending: boolean
  apply: (action: LiveAction, patch: Partial<PlayerRow>) => Promise<void>
}

const rowId = ref<string>()

const Probe = defineComponent({
  setup() {
    return useLiveMyAction(computed(() => rowId.value))
  },
  template: '<div />',
})

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  mounted = component

  return component.vm as unknown as Probe
}

const seat = {
  sessionToken: 'session-token',
  seatToken: 'seat-token',
  seat: 'seat-1',
  row: 'row-1',
  spectator: false,
  code: 'ABC234',
  expiresAt: 'later',
  uuid: 'session-uuid',
}

const cachedState = {
  sheet: {
    id: 1,
    title: 'Ambush',
    round: 1,
    activeIndex: 0,
    rows: [
      {
        id: 'row-1',
        index: 0,
        initiative: 10,
        name: 'Elara',
        type: 'player',
        conditions: [],
        hitPoints: 10,
        maxHitPoints: 20,
      },
    ],
  },
  session: { code: 'ABC234', expiresAt: 'later', version: 3 },
}

describe('useLiveMyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('live-seat', JSON.stringify(seat))
    rowId.value = 'row-1'
    getQueryData.mockReturnValue(cachedState)
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('applies the optimistic patch to the cache before the request resolves', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    const vm = await mountProbe()

    vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })
    await flushPromises()

    expect(setQueryData).toHaveBeenCalledWith(
      ['useLiveState', 'session-token', 'seat-token'],
      {
        ...cachedState,
        sheet: {
          ...cachedState.sheet,
          rows: [{ ...cachedState.sheet.rows[0], hitPoints: 15 }],
        },
      },
    )
  })

  it('reconciles with the real row returned by the server on success', async () => {
    const realRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 15,
      maxHitPoints: 20,
      note: 'DM secret',
    }

    fetchMock.mockResolvedValue({ row: realRow })
    getQueryData.mockReturnValue(cachedState)

    const vm = await mountProbe()

    await vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })

    expect(fetchMock).toHaveBeenCalledWith('/api/live/action', {
      method: 'POST',
      body: {
        seatToken: 'seat-token',
        action: { type: 'hp', hpType: 'heal', amount: 5 },
      },
    })

    const lastCall = setQueryData.mock.calls.at(-1)!

    expect(lastCall[1].sheet.rows[0]).toEqual({
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      deathSaves: undefined,
      concentration: undefined,
      armorClass: undefined,
      tempArmorClass: undefined,
      player: undefined,
      hitPoints: 15,
      maxHitPoints: 20,
      tempHitPoints: undefined,
    })
  })

  it('rolls back the cache and toasts on a failed request', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))
    getQueryData.mockReturnValue(cachedState)

    const vm = await mountProbe()

    await vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })

    const lastCall = setQueryData.mock.calls.at(-1)!

    expect(lastCall).toEqual([
      ['useLiveState', 'session-token', 'seat-token'],
      cachedState,
    ])
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  it('does nothing without a claimed seat', async () => {
    localStorage.clear()

    const vm = await mountProbe()

    await vm.apply({ type: 'concentration', value: true }, {})

    expect(fetchMock).not.toHaveBeenCalled()
    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('does nothing without a claimed row', async () => {
    rowId.value = undefined

    const vm = await mountProbe()

    await vm.apply({ type: 'concentration', value: true }, {})

    expect(fetchMock).not.toHaveBeenCalled()
    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('skips the optimistic patch when there is no cached state yet', async () => {
    getQueryData.mockReturnValue(undefined)
    fetchMock.mockResolvedValue({ row: cachedState.sheet.rows[0] })

    const vm = await mountProbe()

    await vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('does not roll back the cache on failure when there was nothing cached to begin with', async () => {
    getQueryData.mockReturnValue(undefined)
    fetchMock.mockRejectedValue(new Error('boom'))

    const vm = await mountProbe()

    await vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  it('does not reconcile the cache on success when there is nothing cached afterwards', async () => {
    getQueryData.mockReturnValue(undefined)
    fetchMock.mockResolvedValue({ row: cachedState.sheet.rows[0] })

    const vm = await mountProbe()

    await vm.apply({ type: 'hp', hpType: 'heal', amount: 5 }, { hitPoints: 15 })

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('tracks pending state across the request lifecycle', async () => {
    let resolveFetch: (value: { row: InitiativeSheetRow }) => void = () => {}

    fetchMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve
        }),
    )

    const vm = await mountProbe()

    const promise = vm.apply(
      { type: 'concentration', value: true },
      { concentration: true },
    )

    await flushPromises()
    expect(vm.pending).toBe(true)

    resolveFetch({ row: cachedState.sheet.rows[0] as InitiativeSheetRow })
    await promise

    expect(vm.pending).toBe(false)
  })
})
