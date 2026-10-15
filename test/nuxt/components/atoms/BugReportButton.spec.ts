import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BugReportButton from '~/components/atoms/BugReportButton.vue'

const { open } = vi.hoisted(() => ({ open: vi.fn() }))

vi.mock('~/composables/useModal', () => ({ useModal: () => ({ open }) }))

describe('BugReportButton', () => {
  beforeEach(() => {
    open.mockReset()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(BugReportButton, {
      props: { type: 'menu' },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it.each(['menu', 'footer'] as const)(
    'Should open the bug report modal when clicked as a %s button',
    async type => {
      const component = await mountSuspended(BugReportButton, {
        props: { type },
      })

      await component.get('[test-id="bug-report"]').trigger('click')

      expect(open).toHaveBeenCalledWith({
        component: 'BugReport',
        header: 'components.bugReportModal.title',
      })
    },
  )

  it('Should apply menu specific classes when type is menu', async () => {
    const component = await mountSuspended(BugReportButton, {
      props: { type: 'menu' },
    })

    expect(component.get('[test-id="bug-report"]').classes()).toEqual(
      expect.arrayContaining(['gap-2', 'w-full', 'cursor-pointer']),
    )
  })

  it('Should apply footer specific classes when type is footer', async () => {
    const component = await mountSuspended(BugReportButton, {
      props: { type: 'footer' },
    })

    expect(component.get('[test-id="bug-report"]').classes()).not.toEqual(
      expect.arrayContaining(['gap-2', 'w-full', 'cursor-pointer']),
    )
    expect(component.get('[test-id="bug-report"]').classes()).toContain(
      'text-sm',
    )
  })
})
