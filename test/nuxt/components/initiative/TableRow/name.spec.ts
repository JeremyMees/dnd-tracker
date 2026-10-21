import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import Name from '~/components/initiative/TableRow/Name.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface Props {
  item: InitiativeSheetRow
}

type MockFunctions = {
  onSubmit: (e?: Event) => Promise<void>
  popoverOpen: boolean
  form: { setValues: (values: { name: string }) => void }
}

const mockUpdate = vi.fn()
const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row name', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(Name, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display name and summoner if available', async () => {
    const component = await mountWithTooltips(Name, {
      props: {
        item: {
          ...props.item,
          summoner: { name: 'Summoner', id: '123' },
        },
      },
      provide,
    })

    expect(component.find('[test-id="name"]').text()).toBe(props.item.name)
    expect(component.find('[test-id="summoner"]').text()).toBe(
      'general.summoner: Summoner',
    )
  })

  it('Should not display summoner', async () => {
    const component = await mountWithTooltips(Name, { props, provide })

    expect(component.find('[test-id="summoner"]').exists()).toBeFalsy()
  })

  it('Should not update if sheet is undefined', async () => {
    mockSheet.value = undefined

    const component = await mountWithTooltips(Name, {
      props,
      provide,
    })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should not update if the row is not found in the sheet', async () => {
    const component = await mountWithTooltips(Name, {
      props: {
        item: { ...props.item, id: 'not-in-sheet' },
      },
      provide,
    })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should update the row name and close the popover on successful submit', async () => {
    const component = await mountWithTooltips(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.popoverOpen = true
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          id: props.item.id,
          name: 'New Name',
        }),
      ]),
    })
    expect(vm.popoverOpen).toBeFalsy()
  })

  it('Should accept names up to 50 characters', async () => {
    const component = await mountWithTooltips(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'A'.repeat(51) })
    await vm.onSubmit()

    expect(mockUpdate).not.toHaveBeenCalled()

    vm.form.setValues({ name: 'A'.repeat(50) })
    await vm.onSubmit()

    expect(mockUpdate).toHaveBeenCalledOnce()
  })

  it('Should keep the popover open when update throws', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Update failed'))

    const component = await mountWithTooltips(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.popoverOpen = true
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(vm.popoverOpen).toBe(true)
  })

  it('Should render the rename popover content when opened', async () => {
    const component = await mountWithTooltips(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.popoverOpen = true
    await nextTick()

    expect(document.body.textContent).toContain(
      'components.initiativeTableModals.name',
    )
    expect(document.body.querySelector('input[type="text"]')).toBeTruthy()
    expect(
      document.body.querySelector('button[aria-label="actions.save"]'),
    ).toBeTruthy()
  })

  describe('Readied', () => {
    let component: VueWrapper

    beforeEach(() => {
      mockUpdate.mockResolvedValue(undefined)
      mockPatchRow.mockResolvedValue(undefined)
    })

    afterEach(() => {
      component?.unmount()
      mockUpdate.mockReset()
      mockPatchRow.mockReset()
    })

    it('Should not show the readied badge for a row that did not ready', async () => {
      component = await mountWithTooltips(Name, { props, provide })

      expect(component.find('[test-id="readied"]').exists()).toBe(false)
    })

    it('Should use a readied action and spend the reaction', async () => {
      const readied = { ...sheet.rows[1]!, readied: true }

      component = await mountWithTooltips(Name, {
        props: { item: readied },
        provide,
      })

      expect(component.find('[test-id="readied"]').text()).toContain(
        'general.readied',
      )

      await component.find('[test-id="readied"]').trigger('click')

      expect(mockPatchRow).toHaveBeenCalledWith(readied.id, {
        readied: false,
        resources: { ...readied.resources, reaction: true },
      })
    })
  })
  describe('Hidden', () => {
    let component: VueWrapper

    beforeEach(() => {
      mockPatchRow.mockResolvedValue(undefined)
    })

    afterEach(() => {
      component?.unmount()
      mockPatchRow.mockReset()
    })

    it('Should not show the hidden badge for a visible row', async () => {
      component = await mountWithTooltips(Name, { props, provide })

      expect(component.find('[test-id="hidden"]').exists()).toBe(false)
    })

    it('Should reveal a hidden row from the badge', async () => {
      const hidden = { ...sheet.rows[1]!, hidden: true }

      component = await mountWithTooltips(Name, {
        props: { item: hidden },
        provide,
      })

      expect(component.find('[test-id="hidden"]').text()).toContain(
        'general.hidden',
      )

      await component.find('[test-id="hidden"]').trigger('click')

      expect(mockPatchRow).toHaveBeenCalledWith(hidden.id, { hidden: false })
    })
  })
})
