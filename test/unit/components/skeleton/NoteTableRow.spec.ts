import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NoteTableRow from '~/components/skeleton/NoteTableRow'

describe('SkeletonNoteTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(NoteTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
