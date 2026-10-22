import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import Notes from '~/components/initiative/TableRow/Notes.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

const mockUpdate = vi.fn()
const mockPatchRow = vi.fn()

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: ref(sheet),
    update: mockUpdate,
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row notes', async () => {
  beforeEach(() => {
    mockPatchRow.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Notes, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should initialize with empty note when no note is provided', async () => {
    const component = await mountSuspended(Notes, {
      props: {
        item: { ...props.item, note: undefined },
      },
      provide,
    })

    expect(component.find('textarea').element.value).toBe('')
  })

  it('Should initialize with existing note', async () => {
    const component = await mountSuspended(Notes, {
      props: {
        item: { ...props.item, note: 'Test note' },
      },
      provide,
    })

    expect(component.find('textarea').element.value).toBe('Test note')
  })

  it('Should debounce note updates', async () => {
    vi.useFakeTimers()
    const component = await mountSuspended(Notes, { props, provide })
    const textarea = component.find('textarea')

    await textarea.setValue('New note')
    expect(mockPatchRow).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(mockPatchRow).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      note: 'New note',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should swallow a failed note patch', async () => {
    vi.useFakeTimers()
    mockPatchRow.mockRejectedValueOnce(new Error('Patch failed'))

    const component = await mountSuspended(Notes, { props, provide })

    await component.find('textarea').setValue('New note')
    await vi.advanceTimersByTimeAsync(500)

    expect(mockPatchRow).toHaveBeenCalledOnce()
  })

  it('Should sync the note when the item prop changes', async () => {
    const component = await mountSuspended(Notes, {
      props: { item: { ...props.item, note: 'Original' } },
      provide,
    })

    await component.setProps({
      item: { ...props.item, note: 'Changed elsewhere' },
    })

    expect(component.find('textarea').element.value).toBe('Changed elsewhere')
  })

  it('Should clear the note when the item prop note becomes falsy', async () => {
    const component = await mountSuspended(Notes, {
      props: { item: { ...props.item, note: 'Original' } },
      provide,
    })

    await component.setProps({
      item: { ...props.item, note: undefined },
    })

    expect(component.find('textarea').element.value).toBe('')
  })
})
