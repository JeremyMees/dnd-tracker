import type { Row } from '@tanstack/vue-table'
import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { expandedMarkup } from '~/tables/note-listing'

describe('Note listing expanded markup', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render the note text inside a height-capped scroll area', async () => {
    const row = {
      original: { text: '<p>Secret door</p>' },
    } as Row<ListingFeatures, NoteRow>

    wrapper = await mountSuspended(
      defineComponent({ render: () => expandedMarkup(row) }),
    )

    expect(wrapper.find('[data-slot="scroll-area"]').classes()).toContain(
      'max-h-[350px]',
    )
    expect(
      wrapper.find('[data-slot="scroll-area-viewport"] .html-richtext').html(),
    ).toContain('<p>Secret door</p>')
  })
})
