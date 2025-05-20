import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Modify from '~/components/initiative/TableRow/Modify.vue'
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

describe('Initiative table row modify', async () => {
  beforeEach(() => mockUpdate.mockClear())

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Modify, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should display link button when item has link', async () => {
    const component = await mountSuspended(Modify, {
      props: {
        ...props,
        item: { ...props.item, link: 'https://example.com' },
      },
    })

    expect(component.find('[data-test-link]').exists()).toBe(true)
  })

  it('Should not display link button when item has no link', async () => {
    const component = await mountSuspended(Modify, {
      props: {
        ...props,
        item: { ...props.item, link: undefined },
      },
    })

    expect(component.find('[data-test-link]').exists()).toBe(false)
  })

  it('Should call update with new row when copy button is clicked', async () => {
    const component = await mountSuspended(Modify, { props })

    await component.find('[data-test-copy]').trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          ...props.item,
          id: expect.any(String),
        }),
      ]),
    })
  })

  it('Should call update with filtered rows when delete button is clicked', async () => {
    const component = await mountSuspended(Modify, { props })

    await component.find('[data-test-delete]').trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining(
        props.sheet!.rows.filter(row => row.id !== props.item.id),
      ),
    })
  })

  it('Should disable copy button when max characters is reached', async () => {
    const maxRows = Array.from({ length: 50 }, () => ({
      ...props.item,
      id: crypto.randomUUID(),
    }))

    const component = await mountSuspended(Modify, {
      props: {
        ...props,
        sheet: {
          ...props.sheet!,
          rows: maxRows,
        },
      },
    })

    expect(component.find('[data-test-copy]').attributes('disabled')).toBeDefined()
  })

  it('Should not call update when sheet is undefined', async () => {
    const component = await mountSuspended(Modify, {
      props: {
        ...props,
        sheet: undefined,
      },
    })

    await component.find('[data-test-copy]').trigger('click')
    await component.find('[data-test-delete]').trigger('click')

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
