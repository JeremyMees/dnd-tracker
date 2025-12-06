import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import Notes from '~/components/initiative/TableRow/Notes.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row notes', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
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
    expect(mockUpdate).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(mockUpdate).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          id: props.item.id,
          note: 'New note',
        }),
      ]),
    })
  })

  it('Should not update when sheet is undefined', async () => {
    vi.useFakeTimers()
    mockSheet.value = undefined as any

    const component = await mountSuspended(Notes, {
      props,
      provide,
    })

    await component.find('textarea').setValue('New note')
    await vi.advanceTimersByTimeAsync(500)

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
