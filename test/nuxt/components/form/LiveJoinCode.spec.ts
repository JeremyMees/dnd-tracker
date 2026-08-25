import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LiveJoinCode from '~/components/form/LiveJoinCode.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)

function mountForm(
  props: { initialCode?: string; initialErrorStatus?: number } = {},
) {
  return mountSuspended(LiveJoinCode, { props })
}

describe('LiveJoinCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  it('emits validated with the session on a valid code', async () => {
    const session = { code: 'ABC234', expiresAt: '2026-01-01T00:00:00.000Z' }

    fetchMock.mockResolvedValue(session)

    const component = await mountForm()

    await fillForm(component, { code: 'abc234' })
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/code', {
      query: { code: 'ABC234' },
    })
    expect(component.emitted('validated')).toEqual([[session]])
  })

  it('shows a not-found error for a 404', async () => {
    fetchMock.mockRejectedValue({ statusCode: 404 })

    const component = await mountForm()

    await fillForm(component, { code: 'ZZZZZZ' })
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.notFound',
    )
    expect(component.emitted('validated')).toBeUndefined()
  })

  it('shows an expired error for a 410', async () => {
    fetchMock.mockRejectedValue({ statusCode: 410 })

    const component = await mountForm()

    await fillForm(component, { code: 'ZZZZZZ' })
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.expired',
    )
  })

  it('falls back to a generic error for anything else', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))

    const component = await mountForm()

    await fillForm(component, { code: 'ZZZZZZ' })
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.generic',
    )
  })

  it('does not submit an incomplete code', async () => {
    const component = await mountForm()

    await fillForm(component, { code: 'abc' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the initial error status without submitting', async () => {
    const component = await mountForm({
      initialCode: 'ZZZZZZ',
      initialErrorStatus: 410,
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(component.get('[test-id="error"]').text()).toBe(
      'pages.live.errors.expired',
    )
  })

  it('auto-submits a pre-filled valid code', async () => {
    const session = { code: 'ABC234', expiresAt: '2026-01-01T00:00:00.000Z' }

    fetchMock.mockResolvedValue(session)

    const component = await mountForm({ initialCode: 'ABC234' })

    for (let tick = 0; tick < 6; tick++) {
      await new Promise(resolve => setTimeout(resolve))
      await flushPromises()
    }

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/code', {
      query: { code: 'ABC234' },
    })
    expect(component.emitted('validated')).toEqual([[session]])
  })
})
