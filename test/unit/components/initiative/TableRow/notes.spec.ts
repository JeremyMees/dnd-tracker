import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import Notes from '~/components/initiative/TableRow/Notes.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row notes', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Notes, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should initialize with empty note when no note is provided', async () => {
    const component = await mountSuspended(Notes, {
      props: {
        ...props,
        item: { ...props.item, note: undefined },
      },
    })

    expect(component.find('textarea').element.value).toBe('')
  })

  it('Should initialize with existing note', async () => {
    const component = await mountSuspended(Notes, {
      props: {
        ...props,
        item: { ...props.item, note: 'Test note' },
      },
    })

    expect(component.find('textarea').element.value).toBe('Test note')
  })

  it('Should debounce note updates', async () => {
    const component = await mountSuspended(Notes, { props })
    const textarea = component.find('textarea')

    await textarea.setValue('New note')
    expect(mockUpdate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    expect(mockUpdate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
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
    const component = await mountSuspended(Notes, {
      props: {
        ...props,
        sheet: undefined,
      },
    })

    await component.find('textarea').setValue('New note')
    vi.advanceTimersByTime(500)

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
