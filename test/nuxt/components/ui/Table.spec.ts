import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Table } from '~/components/ui/table'

describe('Table', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should scroll the table horizontally inside a scroll area', async () => {
    wrapper = await mountSuspended({
      render: () => h(Table, { class: 'min-w-[800px]' }),
    })

    expect(wrapper.getComponent(ScrollArea).props('orientation')).toBe(
      'horizontal',
    )
    expect(
      wrapper.get('[data-slot="scroll-area-viewport"] table').classes(),
    ).toContain('min-w-[800px]')
  })
})
