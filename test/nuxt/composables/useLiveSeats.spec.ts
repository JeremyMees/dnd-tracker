import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveSeats } from '~/composables/useLiveSeats'

const {
  fetchMock,
  toast,
  on,
  subscribe,
  unsubscribe,
  removeChannel,
  presenceState,
  channelFn,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toast: vi.fn(),
  on: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  removeChannel: vi.fn(),
  presenceState: vi.fn(() => ({})),
  channelFn: vi.fn(),
}))

const channel = { on, subscribe, unsubscribe, presenceState }

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useSupabaseClient', () => () => ({
  channel: channelFn,
  removeChannel,
}))

const seatA: LiveSeat = {
  seat: 'seat-1',
  row: 'row-1',
  name: 'Elara',
  spectator: false,
}
const seatB: LiveSeat = {
  seat: 'seat-2',
  row: null,
  name: 'Watcher',
  spectator: true,
}

const session = ref<{ uuid: string; seats: LiveSeat[] } | undefined>()

interface Probe {
  seats: LiveSeat[]
  connected: Set<string>
  kick: (seat: string) => Promise<void>
  reassign: (seat: string, row: string) => Promise<void>
}

const Probe = defineComponent({
  setup() {
    return useLiveSeats(1, session)
  },
  template: '<div />',
})

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  mounted = component

  return { component, vm: component.vm as unknown as Probe }
}

function broadcastHandler() {
  const call = on.mock.calls.find(args => args[0] === 'broadcast')!

  return call[2] as (event: { payload: LiveSeatsBroadcast }) => void
}

function presenceHandler() {
  const call = on.mock.calls.find(args => args[0] === 'presence')!

  return call[2] as () => void
}

describe('useLiveSeats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    on.mockReturnValue(channel)
    subscribe.mockReturnValue(channel)
    channelFn.mockReturnValue(channel)
    presenceState.mockReturnValue({})
    session.value = undefined
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should have no seats when there is no session', async () => {
    const { vm } = await mountProbe()

    expect(vm.seats).toEqual([])
    expect(channelFn).not.toHaveBeenCalled()
  })

  it('Should seed seats from the session and subscribe to its channel', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA, seatB] }

    const { vm } = await mountProbe()

    expect(vm.seats).toEqual([seatA, seatB])
    expect(channelFn).toHaveBeenCalledWith('live:session-uuid')
    expect(subscribe).toHaveBeenCalled()
  })

  it('Should add a seat when a joined broadcast arrives', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }

    const { vm } = await mountProbe()

    broadcastHandler()({ payload: { type: 'joined', seat: seatB } })

    expect(vm.seats).toEqual([seatA, seatB])
  })

  it('Should remove a seat when a kicked broadcast arrives', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA, seatB] }

    const { vm } = await mountProbe()

    broadcastHandler()({ payload: { type: 'kicked', seat: 'seat-1' } })

    expect(vm.seats).toEqual([seatB])
  })

  it('Should update a row when a reassigned broadcast arrives', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }

    const { vm } = await mountProbe()

    broadcastHandler()({
      payload: { type: 'reassigned', seat: 'seat-1', row: 'row-2' },
    })

    expect(vm.seats).toEqual([{ ...seatA, row: 'row-2' }])
  })

  it('Should compute the connected set from the presence state on sync', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }
    presenceState.mockReturnValue({
      'presence-key': [{ presence_ref: 'ref-1', seat: 'seat-1' }],
    })

    const { vm } = await mountProbe()

    presenceHandler()()

    expect(vm.connected).toEqual(new Set(['seat-1']))
  })

  it('Should re-subscribe when the session uuid changes', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }

    await mountProbe()

    session.value = { uuid: 'other-uuid', seats: [] }
    await flushPromises()

    expect(unsubscribe).toHaveBeenCalled()
    expect(channelFn).toHaveBeenCalledWith('live:other-uuid')
  })

  it('Should unsubscribe on unmount', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }

    const { component } = await mountProbe()

    component.unmount()

    expect(unsubscribe).toHaveBeenCalled()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })

  it('Should share the realtime subscription across multiple consumers for the same session', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }

    const first = await mountProbe()
    const second = await mountProbe()

    expect(channelFn).toHaveBeenCalledTimes(1)
    expect(second.vm.seats).toEqual([seatA])

    first.component.unmount()
  })

  it('Should kick a seat and remove it locally', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA, seatB] }
    fetchMock.mockResolvedValue({ success: true })

    const { vm } = await mountProbe()

    await vm.kick('seat-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/live/kick', {
      method: 'POST',
      body: { encounter: 1, seat: 'seat-1' },
    })
    expect(vm.seats).toEqual([seatB])
  })

  it('Should toast the translated error when kicking fails with a known slug', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }
    fetchMock.mockRejectedValue(
      Object.assign(new Error('[POST] "/api/live/kick": 404 Not Found'), {
        data: { statusCode: 404, statusMessage: 'seat-not-found' },
      }),
    )

    const { vm } = await mountProbe()

    await vm.kick('seat-1')

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'pages.encounter.liveSession.errors.seatNotFound',
      variant: 'destructive',
    })
    expect(vm.seats).toEqual([seatA])
  })

  it('Should reassign a seat to a new row locally', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }
    fetchMock.mockResolvedValue({ seat: { ...seatA, row: 'row-2' } })

    const { vm } = await mountProbe()

    await vm.reassign('seat-1', 'row-2')

    expect(fetchMock).toHaveBeenCalledWith('/api/live/reassign', {
      method: 'POST',
      body: { encounter: 1, seat: 'seat-1', row: 'row-2' },
    })
    expect(vm.seats).toEqual([{ ...seatA, row: 'row-2' }])
  })

  it('Should toast the translated error when reassigning fails with a known slug', async () => {
    session.value = { uuid: 'session-uuid', seats: [seatA] }
    fetchMock.mockRejectedValue(
      Object.assign(new Error('[POST] "/api/live/reassign": 409 Conflict'), {
        data: { statusCode: 409, statusMessage: 'row-claimed' },
      }),
    )

    const { vm } = await mountProbe()

    await vm.reassign('seat-1', 'row-2')

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'pages.encounter.liveSession.errors.rowClaimed',
      variant: 'destructive',
    })
  })
})
