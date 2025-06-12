import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Init from '~/components/initiative/TableRow/Init.vue'
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

describe('Initiative table row init', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Init, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display initiative value correctly', async () => {
    const initiative = 15
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative },
      },
      provide,
    })

    expect(component.get('[data-test-initiative]').text()).toBe(initiative.toString())
  })

  it('Should show plus icon when initiative is not defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: -1 },
      },
      provide,
    })

    expect(component.get('[data-test-empty]').isVisible()).toBeTruthy()
  })

  it('Should show up/down controls when initiative is defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15 },
      },
      provide,
    })

    expect(component.get('[data-test-controls]').isVisible()).toBeTruthy()
  })

  it('Should not show controls when initiative is not defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: -1 },
      },
      provide,
    })

    expect(component.find('[data-test-controls]').exists()).toBeFalsy()
  })

  it('Should enable up button when can move up', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...sheet.rows[0]!, initiative: 15, index: 0 },
        { ...props.item, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 1 },
      },
      provide,
    })

    expect(component.get('[data-test-up]').isVisible()).toBeTruthy()
  })

  it('Should enable down button when can move down', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...props.item, initiative: 15, index: 0 },
        { ...sheet.rows[0]!, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 0 },
      },
      provide,
    })

    expect(component.get('[data-test-down]').isVisible()).toBeTruthy()
  })

  it('Should move row up when clicking up button', async () => {
    const firstRow = { ...sheet.rows[0]!, initiative: 15, index: 0, id: 'row1' }
    const secondRow = { ...props.item, initiative: 15, index: 1, id: 'row2' }

    mockSheet.value = {
      ...sheet,
      rows: [firstRow, secondRow],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: secondRow,
      },
      provide,
    })

    await component.get('[data-test-up]').trigger('click')

    expect(mockUpdate).toHaveBeenCalled()

    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()

    const resultRows = payload.rows
    expect(resultRows[0]?.id).toBe('row2')
    expect(resultRows[1]?.id).toBe('row1')
  })

  it('Should move row down when clicking down button', async () => {
    const firstRow = { ...props.item, initiative: 15, index: 0, id: 'row1' }
    const secondRow = { ...sheet.rows[0]!, initiative: 15, index: 1, id: 'row2' }

    mockSheet.value = {
      ...sheet,
      rows: [firstRow, secondRow],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: firstRow,
      },
      provide,
    })

    await component.get('[data-test-down]').trigger('click')

    expect(mockUpdate).toHaveBeenCalled()

    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()

    const resultRows = payload.rows
    expect(resultRows[0]?.id).toBe('row2')
    expect(resultRows[1]?.id).toBe('row1')
  })

  it('Should not show up/down buttons when initiative values are different', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...sheet.rows[0]!, initiative: 20, index: 0 },
        { ...props.item, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 1 },
      },
      provide,
    })

    expect(component.find('[data-test-up]').exists()).toBeFalsy()
    expect(component.find('[data-test-down]').exists()).toBeFalsy()
  })
})
