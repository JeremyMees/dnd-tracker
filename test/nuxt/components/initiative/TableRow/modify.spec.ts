import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import Modify from '~/components/initiative/TableRow/Modify.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface Props {
  item: InitiativeSheetRow
}

const mockEditRows = vi.fn()
const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    editRows: mockEditRows,
    patchRow: mockPatchRow,
    portal: ref(true),
    claimedRows: ref(new Set<string>()),
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

const formStubs = {
  FormHomebrew: {
    name: 'FormHomebrew',
    props: {
      row: Object,
      sheet: Object,
      editRows: Function,
      campaignId: Number,
      isEncounter: Boolean,
    },
    template: '<div test-id="homebrew-form" />',
    emits: ['close'],
  },
}

let component: VueWrapper | undefined

describe('Initiative table row modify', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  afterEach(() => {
    component?.unmount()
    component = undefined
  })

  it('Should open the row in the homebrew form when edit is clicked', async () => {
    component = await mountWithTooltips(Modify, {
      props,
      provide,
      global: { stubs: formStubs },
    })

    expect(component.findComponent({ name: 'FormHomebrew' }).exists()).toBe(
      false,
    )

    await component.get('[test-id="edit"]').trigger('click')

    const form = component.findComponent({ name: 'FormHomebrew' })

    expect(document.body.textContent).toContain('actions.editItem')
    expect(form.props()).toMatchObject({
      row: props.item,
      sheet,
      editRows: mockEditRows,
      isEncounter: true,
    })
  })

  it('Should close the edit dialog when the form closes', async () => {
    component = await mountWithTooltips(Modify, {
      props,
      provide,
      global: { stubs: formStubs },
    })

    const vm = component.vm as unknown as { isEditing: boolean }

    await component.get('[test-id="edit"]').trigger('click')
    expect(vm.isEditing).toBe(true)

    await component.findComponent({ name: 'FormHomebrew' }).vm.$emit('close')
    await nextTick()

    expect(vm.isEditing).toBe(false)
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(Modify, { props, provide })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should display link button when item has link', async () => {
    const component = await mountWithTooltips(Modify, {
      props: {
        item: { ...props.item, link: 'https://example.com' },
      },
      provide,
    })

    expect(component.find('[test-id="link"]').exists()).toBeTruthy()
  })

  it('Should not display link button when item has no link', async () => {
    const component = await mountWithTooltips(Modify, {
      props: {
        item: { ...props.item, link: undefined },
      },
      provide,
    })

    expect(component.find('[test-id="link"]').exists()).toBeFalsy()
  })

  it('Should call update with new row when copy button is clicked', async () => {
    const component = await mountWithTooltips(Modify, { props, provide })

    await component.find('[test-id="copy"]').trigger('click')

    expect(mockEditRows).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ...props.item,
          id: expect.any(String),
        }),
      ]),
    )
  })

  it('Should call update with filtered rows when delete button is clicked', async () => {
    const component = await mountWithTooltips(Modify, { props, provide })

    await component.find('[test-id="delete"]').trigger('click')

    expect(mockEditRows).toHaveBeenCalledWith(
      expect.arrayContaining(
        mockSheet.value!.rows.filter(row => row.id !== props.item.id),
      ),
    )
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

    const component = await mountWithTooltips(Modify, {
      props,
      provide,
    })

    expect(
      component.find('[test-id="copy"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should not call update when sheet is undefined', async () => {
    mockSheet.value = undefined

    const component = await mountWithTooltips(Modify, {
      props,
      provide,
    })

    await component.find('[test-id="copy"]').trigger('click')
    await component.find('[test-id="delete"]').trigger('click')

    expect(mockEditRows).not.toHaveBeenCalled()
  })

  describe('Visibility', () => {
    beforeEach(() => {
      mockPatchRow.mockReset().mockResolvedValue(undefined)
    })

    it('Should not offer to hide a row without the player portal', async () => {
      component = await mountWithTooltips(Modify, {
        props: { item: { ...sheet.rows[0]!, type: 'monster' } },
        provide: {
          [INITIATIVE_SHEET]: {
            ...provide[INITIATIVE_SHEET],
            portal: ref(false),
          },
        },
        global: { stubs: formStubs },
      })

      expect(component.find('[test-id="visibility"]').exists()).toBe(false)
    })

    it('Should not offer to hide a player row', async () => {
      component = await mountWithTooltips(Modify, {
        props: { item: { ...sheet.rows[0]!, type: 'player' } },
        provide,
        global: { stubs: formStubs },
      })

      expect(component.find('[test-id="visibility"]').exists()).toBe(false)
    })

    it('Should not let a claimed row be hidden', async () => {
      const item = { ...sheet.rows[0]!, type: 'npc' as const }

      component = await mountWithTooltips(Modify, {
        props: { item },
        provide: {
          [INITIATIVE_SHEET]: {
            ...provide[INITIATIVE_SHEET],
            claimedRows: ref(new Set([item.id])),
          },
        },
        global: { stubs: formStubs },
      })

      const button = component.get('[test-id="visibility"]')

      expect(button.attributes('disabled')).toBeDefined()
      expect(button.attributes('aria-label')).toBe('general.claimed')
    })

    it('Should still reveal a hidden row once it is claimed', async () => {
      const item = { ...sheet.rows[0]!, type: 'npc' as const, hidden: true }

      component = await mountWithTooltips(Modify, {
        props: { item },
        provide: {
          [INITIATIVE_SHEET]: {
            ...provide[INITIATIVE_SHEET],
            claimedRows: ref(new Set([item.id])),
          },
        },
        global: { stubs: formStubs },
      })

      await component.get('[test-id="visibility"]').trigger('click')

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { hidden: false })
    })

    it('Should hide a visible row from players', async () => {
      const item = { ...sheet.rows[0]!, type: 'monster' as const }

      component = await mountWithTooltips(Modify, {
        props: { item },
        provide,
        global: { stubs: formStubs },
      })

      const button = component.get('[test-id="visibility"]')

      expect(button.attributes('aria-label')).toBe('actions.hideFromPlayers')

      await button.trigger('click')

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { hidden: true })
    })

    it('Should reveal a hidden row to players', async () => {
      const item = { ...sheet.rows[0]!, type: 'monster' as const, hidden: true }

      component = await mountWithTooltips(Modify, {
        props: { item },
        provide,
        global: { stubs: formStubs },
      })

      const button = component.get('[test-id="visibility"]')

      expect(button.attributes('aria-label')).toBe('actions.revealToPlayers')

      await button.trigger('click')

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { hidden: false })
    })
  })
})
