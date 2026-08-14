import { beforeEach, describe, expect, it } from 'vitest'
import { useLiveSeat } from '~/composables/useLiveSeat'

const response: LiveJoinResponse = {
  sessionToken: 'session-token',
  seatToken: 'seat-token',
  seat: 'seat-1',
  row: 'row-1',
  spectator: false,
  code: 'ABC234',
  expiresAt: 'later',
  uuid: 'session-uuid',
}

describe('useLiveSeat', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('has no seat by default', () => {
    const { seat } = useLiveSeat()

    expect(seat.value).toBeNull()
  })

  it('persists an assigned seat to local storage', async () => {
    const { seat } = useLiveSeat()

    seat.value = response
    await nextTick()

    expect(seat.value).toEqual(response)
    expect(JSON.parse(localStorage.getItem('live-seat')!)).toEqual(response)
  })

  it('reads a previously stored seat back from local storage', () => {
    localStorage.setItem('live-seat', JSON.stringify(response))

    const { seat } = useLiveSeat()

    expect(seat.value).toEqual(response)
  })

  it('clears the seat', async () => {
    const { seat, clear } = useLiveSeat()

    seat.value = response
    await nextTick()

    clear()
    await nextTick()

    expect(seat.value).toBeNull()
  })
})
