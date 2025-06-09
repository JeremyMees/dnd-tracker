import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Modify from '~/components/initiative/TableRow/Modify.vue'
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

describe('Initiative table row modify', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Modify, { props, provide })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should display link button when item has link', async () => {
    const component = await mountSuspended(Modify, {
      props: {
        item: { ...props.item, link: 'https://example.com' },
      },
      provide,
    })

    expect(component.find('[data-test-link]').exists()).toBe(true)
  })

  it('Should not display link button when item has no link', async () => {
    const component = await mountSuspended(Modify, {
      props: {
        item: { ...props.item, link: undefined },
      },
      provide,
    })

    expect(component.find('[data-test-link]').exists()).toBe(false)
  })

  it('Should call update with new row when copy button is clicked', async () => {
    const component = await mountSuspended(Modify, { props, provide })

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
    const component = await mountSuspended(Modify, { props, provide })

    await component.find('[data-test-delete]').trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining(
        mockSheet.value.rows.filter(row => row.id !== props.item.id),
      ),
    })
  })

  it('Should disable copy button when max characters is reached', async () => {
    const maxRows = Array.from({ length: 50 }, () => ({
      ...props.item,
      id: crypto.randomUUID(),
    }))

    mockSheet.value = {
      ...sheet,
      rows: maxRows,
    }

    const component = await mountSuspended(Modify, {
      props,
      provide,
    })

    expect(component.find('[data-test-copy]').attributes('disabled')).toBeDefined()
  })

  it('Should not call update when sheet is undefined', async () => {
    mockSheet.value = undefined as any

    const component = await mountSuspended(Modify, {
      props,
      provide,
    })

    await component.find('[data-test-copy]').trigger('click')
    await component.find('[data-test-delete]').trigger('click')

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
