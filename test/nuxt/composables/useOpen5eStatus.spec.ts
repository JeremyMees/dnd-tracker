import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useOpen5eStatus } from '~/composables/useOpen5eStatus'

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(
    defineComponent({
      setup: () => useOpen5eStatus(),
      template: '<div />',
    }),
  )

  mounted = component

  return component.vm as unknown as ReturnType<typeof useOpen5eStatus>
}

describe('useOpen5eStatus', () => {
  beforeEach(() => {
    clearNuxtState()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('starts out considering the content fresh', async () => {
    const status = await mountProbe()

    expect(status.isStale).toBe(false)
    expect(status.staleSince).toBeNull()
  })

  it('goes stale when a response carries the header', async () => {
    const status = await mountProbe()

    status.trackOpen5eFreshness('2026-09-04T12:00:00.000Z')

    expect(status.isStale).toBe(true)
    expect(status.staleSince).toBe('2026-09-04T12:00:00.000Z')
  })

  it('recovers as soon as a fresh response arrives', async () => {
    const status = await mountProbe()

    status.trackOpen5eFreshness('2026-09-04T12:00:00.000Z')
    status.trackOpen5eFreshness(null)

    expect(status.isStale).toBe(false)
    expect(status.staleSince).toBeNull()
  })

  it('treats a missing header as fresh', async () => {
    const status = await mountProbe()

    status.trackOpen5eFreshness('2026-09-04T12:00:00.000Z')
    status.trackOpen5eFreshness(undefined)

    expect(status.isStale).toBe(false)
  })

  it('shares one flag across every consumer', async () => {
    const first = await mountProbe()

    first.trackOpen5eFreshness('2026-09-04T12:00:00.000Z')

    const second = await mountProbe()

    expect(second.isStale).toBe(true)
  })
})
