import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LiveSeatList from '~/components/live/SeatList.vue'

const { ask, kick, reassign } = vi.hoisted(() => ({
  ask: vi.fn(),
  kick: vi.fn(),
  reassign: vi.fn(),
}))

const seats = ref<LiveSeat[]>([])
const connected = ref<Set<string>>(new Set())

mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('useLiveSeats', () => () => ({
  seats,
  connected,
  kick,
  reassign,
}))

const rows = [
  { id: 'row-1', name: 'Elara' },
  { id: 'row-2', name: 'Grog' },
]

const props = {
  encounterId: 1,
  session: {
    token: 'jwt',
    uuid: 'session-uuid',
    code: 'ABC234',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    seats: [],
  } as LiveSessionResponse | undefined,
  rows,
}

describe('LiveSeatList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seats.value = []
    connected.value = new Set()
  })

  it('Should match snapshot', async () => {
    seats.value = [
      { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
      { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
    ]
    connected.value = new Set(['seat-1'])

    const component = await mountSuspended(LiveSeatList, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show the empty state when no one has joined', async () => {
    const component = await mountSuspended(LiveSeatList, { props })

    expect(component.find('[test-id="seat-empty"]').exists()).toBe(true)
  })

  it('Should list a claimed seat with its row name and online status', async () => {
    seats.value = [
      {
        seat: 'seat-1',
        row: 'row-1',
        name: 'Elara the Player',
        spectator: false,
      },
    ]
    connected.value = new Set(['seat-1'])

    const component = await mountSuspended(LiveSeatList, { props })

    const seat = component.find('[test-id="seat-seat-1"]')

    expect(seat.exists()).toBe(true)
    expect(seat.text()).toContain('Elara the Player')
    expect(
      component.find('[test-id="seat-status-seat-1"]').classes(),
    ).toContain('bg-success')
  })

  it('Should show the spectator label and hide the reassign control for spectators', async () => {
    seats.value = [
      { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
    ]

    const component = await mountSuspended(LiveSeatList, { props })

    expect(component.find('[test-id="reassign-seat-2"]').exists()).toBe(false)
  })

  it('Should show an offline status dot for a disconnected seat', async () => {
    seats.value = [
      { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    ]
    connected.value = new Set()

    const component = await mountSuspended(LiveSeatList, { props })

    expect(
      component.find('[test-id="seat-status-seat-1"]').classes(),
    ).toContain('bg-muted-foreground/30')
  })

  it('Should ask for confirmation and kick the seat when confirmed', async () => {
    seats.value = [
      { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    ]

    const component = await mountSuspended(LiveSeatList, { props })

    await component.find('[test-id="kick-seat-1"]').trigger('click')

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'components.liveSession.seats.kickConfirm.title',
        description: 'components.liveSession.seats.kickConfirm.text',
      },
      expect.any(Function),
    )

    const callback = ask.mock.calls[0]?.[1]
    await callback(true)

    expect(kick).toHaveBeenCalledWith('seat-1')
  })

  it('Should not kick the seat when the confirmation is declined', async () => {
    seats.value = [
      { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    ]

    const component = await mountSuspended(LiveSeatList, { props })

    await component.find('[test-id="kick-seat-1"]').trigger('click')

    const callback = ask.mock.calls[0]?.[1]
    await callback(false)

    expect(kick).not.toHaveBeenCalled()
  })
})
