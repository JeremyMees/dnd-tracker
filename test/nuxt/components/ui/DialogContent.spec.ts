import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

function mountOpen() {
  return mountSuspended({
    render: () =>
      h(
        Dialog,
        { open: true },
        {
          default: () =>
            h(
              DialogContent,
              { 'test-id': 'dialog-content' },
              {
                default: () => [
                  h(
                    DialogHeader,
                    { 'test-id': 'dialog-header' },
                    {
                      default: () => [
                        h(DialogTitle, null, { default: () => 'Title' }),
                        h(DialogDescription, null, {
                          default: () => 'Description',
                        }),
                      ],
                    },
                  ),
                  h(DialogBody, null, { default: () => 'Content' }),
                  h(
                    DialogFooter,
                    { 'test-id': 'dialog-footer' },
                    { default: () => 'Footer' },
                  ),
                ],
              },
            ),
        },
      ),
  })
}

function element(testId: string): HTMLElement {
  return document.body.querySelector(`[test-id="${testId}"]`)!
}

describe('DialogContent', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should cap its height and clip what does not fit', async () => {
    wrapper = await mountOpen()

    expect(element('dialog-content').classList).toContain('max-h-[90dvh]')
    expect(element('dialog-content').classList).toContain('overflow-hidden')
    expect(element('dialog-content').classList).toContain('flex-col')
  })

  it('Should keep the header and footer from shrinking', async () => {
    wrapper = await mountOpen()

    expect(element('dialog-header').classList).toContain('shrink-0')
    expect(element('dialog-footer').classList).toContain('shrink-0')
  })

  it('Should scroll the body between the header and footer', async () => {
    wrapper = await mountOpen()

    const body = element('dialog-body')

    expect(body.textContent).toBe('Content')
    expect(body.classList).toContain('overflow-y-auto')
    expect(body.classList).toContain('min-h-0')
    expect(body.classList).toContain('flex-1')
    expect(body.previousElementSibling).toBe(element('dialog-header'))
    expect(body.nextElementSibling).toBe(element('dialog-footer'))
  })
})
