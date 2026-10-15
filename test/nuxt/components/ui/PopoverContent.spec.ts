import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { Popover, PopoverContent } from '~/components/ui/popover'

function mountOpen(contentClass?: string) {
  return mountSuspended({
    render: () =>
      h(
        Popover,
        { open: true },
        {
          default: () =>
            h(
              PopoverContent,
              { 'test-id': 'popover-content', class: contentClass },
              { default: () => 'Content' },
            ),
        },
      ),
  })
}

function content(): HTMLElement {
  return document.body.querySelector('[test-id="popover-content"]')!
}

describe('PopoverContent', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should cap its width at 400px or the viewport minus a gutter', async () => {
    wrapper = await mountOpen()

    expect(content().classList).toContain('max-w-[min(400px,calc(100vw-2rem))]')
  })

  it('Should keep a gutter between the popover and the viewport edges', async () => {
    wrapper = await mountOpen()

    expect(
      wrapper
        .findComponent({ name: 'PopperContent' })
        .props('collisionPadding'),
    ).toBe(16)
  })

  it('Should let a caller replace the width cap', async () => {
    wrapper = await mountOpen('max-w-[min(800px,calc(100vw-2rem))]')

    expect(content().classList).toContain('max-w-[min(800px,calc(100vw-2rem))]')
    expect(content().classList).not.toContain(
      'max-w-[min(400px,calc(100vw-2rem))]',
    )
  })
})
