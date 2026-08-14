import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LiveJoin from '~/components/form/LiveJoin.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)

const rows: LiveCodeSession['rows'] = [
  { id: 'row-1', name: 'Elara', type: 'player' },
  { id: 'row-2', name: 'Bilbo', type: 'player' },
]

function mountForm(props: { code?: string; rows?: typeof rows } = {}) {
  return mountSuspended(LiveJoin, {
    props: { code: 'ABC234', rows, ...props },
  })
}

describe('LiveJoin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  it('renders a radio per claimable row and the spectator switch', async () => {
    const component = await mountForm()

    expect(component.findAll('[role="radio"]')).toHaveLength(2)
    expect(component.find('[test-id="spectator"]').exists()).toBe(true)
    expect(component.text()).toContain('Elara')
    expect(component.text()).toContain('Bilbo')
  })

  it('does not render the row picker when there are no claimable rows', async () => {
    const component = await mountForm({ rows: [] })

    expect(component.findAll('[role="radio"]')).toHaveLength(0)
  })

  it('joins with the chosen row', async () => {
    const session = {
      sessionToken: 'session-token',
      seatToken: 'seat-token',
      seat: 'seat-1',
      row: 'row-1',
      spectator: false,
      code: 'ABC234',
      expiresAt: '2026-01-01T00:00:00.000Z',
    }

    fetchMock.mockResolvedValue(session)

    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith('/api/live/join', {
      method: 'POST',
      body: { code: 'ABC234', name: 'Elara', row: 'row-1', spectator: false },
    })
    expect(component.emitted('joined')).toEqual([[session]])
  })

  it('joins as a spectator without a row', async () => {
    const session = {
      sessionToken: 'session-token',
      seatToken: 'seat-token',
      seat: 'seat-2',
      row: null,
      spectator: true,
      code: 'ABC234',
      expiresAt: '2026-01-01T00:00:00.000Z',
    }

    fetchMock.mockResolvedValue(session)

    const component = await mountForm()

    await fillForm(component, { name: 'Watcher' })
    await component.find('[test-id="spectator"]').trigger('click')
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith('/api/live/join', {
      method: 'POST',
      body: {
        code: 'ABC234',
        name: 'Watcher',
        row: undefined,
        spectator: true,
      },
    })
    expect(component.emitted('joined')).toEqual([[session]])
  })

  it('defaults to spectator when there are no claimable rows', async () => {
    const component = await mountForm({ rows: [] })

    await fillForm(component, { name: 'Watcher' })
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith('/api/live/join', {
      method: 'POST',
      body: {
        code: 'ABC234',
        name: 'Watcher',
        row: undefined,
        spectator: true,
      },
    })
  })

  it('does not submit without a name', async () => {
    const component = await mountForm()

    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not submit without a row or spectator', async () => {
    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a row-claimed error for a 409', async () => {
    fetchMock.mockRejectedValue({ statusCode: 409 })

    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.rowClaimed',
    )
  })

  it('shows an expired error for a 410', async () => {
    fetchMock.mockRejectedValue({ statusCode: 410 })

    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.expired',
    )
  })

  it('shows a not found error for a 404', async () => {
    fetchMock.mockRejectedValue({ statusCode: 404 })

    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.notFound',
    )
  })

  it('falls back to a generic error for anything else', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))

    const component = await mountForm()

    await fillForm(component, { name: 'Elara' })
    await component.find('[test-id="row-row-1"]').trigger('click')
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.generic',
    )
  })
})
