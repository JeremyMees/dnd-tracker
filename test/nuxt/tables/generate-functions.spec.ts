import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tooltip from '~/components/atoms/Tooltip.vue'
import TooltipProvider from '~/components/atoms/TooltipProvider.vue'
import { expandButton } from '~/tables/generate-functions'

let component: VueWrapper | undefined

describe('expandButton', () => {
  afterEach(() => {
    component?.unmount()
    component = undefined
  })

  it('Should show the expand shortcut in its tooltip', async () => {
    const cb = vi.fn()

    component = await mountSuspended(TooltipProvider, {
      slots: {
        default: () =>
          expandButton({ content: 'actions.show', expanded: false, cb }),
      },
    })

    expect(component.findComponent(Tooltip).props()).toMatchObject({
      text: 'actions.show',
      shortcut: ['SHIFT', 'ENTER'],
    })

    await component.find('button').trigger('click')

    expect(cb).toHaveBeenCalledOnce()
  })
})
