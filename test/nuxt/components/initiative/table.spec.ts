import { toast } from '~~/test/nuxt/stubs/toast'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Table from '~/components/initiative/Table.vue'
import { useRegisteredCommands } from '~/composables/useCommands'
import { useRowShortcut } from '~/composables/useRowShortcut'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import conditions from '~~/test/fixtures/conditions.json'
import { authUser } from '~~/test/fixtures/auth-user'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { dropdownStubs } from '~~/test/nuxt/stubs/dropdown-menu'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

mockNuxtImport('useAuthenticatedUser', () => () => ref({ ...authUser }))

interface Props {
  loading: boolean
  encounterId?: number
}

const mockNextTurn = vi.fn().mockResolvedValue(undefined)
const mockPatchRows = vi.fn().mockResolvedValue(undefined)
const mockPreviousTurn = vi.fn().mockResolvedValue(undefined)
const mockReset = vi.fn().mockResolvedValue(undefined)
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    patchRow: vi.fn(),
    patchRows: mockPatchRows,
    nextTurn: mockNextTurn,
    previousTurn: mockPreviousTurn,
    reset: mockReset,
    activeRow: mockActiveRow,
  },
}

const props: Props = {
  loading: false,
}

const global = { stubs: dropdownStubs }

const { clearCombatEvents } = vi.hoisted(() => ({
  clearCombatEvents: vi.fn(),
}))

vi.mock('~/queries/combat-events', () => ({
  useCombatEvents: () => ({ data: ref([]), isPending: ref(false) }),
  useCombatEventsClear: () => ({ mutate: clearCombatEvents }),
}))

vi.mock('~/queries/srd', () => ({
  prefetchConditionsListing: () => Promise.resolve(),
  useConditionsListing: () => ({
    data: conditions,
    isLoading: false,
    isError: false,
  }),
  useSrdDocuments: () => ({
    data: ref([]),
  }),
}))

vi.mock('~~/composables/initiative-sheet', () => ({
  useInitiativeSheet: (data: ComputedRef<InitiativeSheet | undefined>) => {
    const expanded = ref({})
    const selected = ref<Record<string, boolean>>({})
    const active = computed(() => {
      const selectedRowId = Object.keys(selected.value).find(
        key => selected.value[key] === true,
      )
      return data.value?.rows.find(
        (row: InitiativeSheetRow) => row.id === selectedRowId,
      )
    })
    const columnVisibility = computed(() => {
      const rows = data.value?.settings?.modified
        ? data.value.settings.rows || []
        : [
            'armorClass',
            'hitPoints',
            'conditions',
            'note',
            'deathSaves',
            'concentration',
            'modify',
          ]

      return {
        index: true,
        name: true,
        initiative: true,
        ac: rows.includes('armorClass'),
        hp: rows.includes('hitPoints'),
        conditions: rows.includes('conditions'),
        note: rows.includes('note'),
        deathSaves: rows.includes('deathSaves'),
        concentration: rows.includes('concentration'),
        modify: rows.includes('modify'),
      }
    })

    return {
      previous: vi.fn(),
      next: vi.fn(),
      reset: vi.fn(),
      active,
      expanded,
      selected,
      columnVisibility,
    }
  },
}))

const commands = useRegisteredCommands()

function runCommand(id: string): void {
  commands.value.find(command => command.id === id)?.run()
}

function commandIds(): string[] {
  return commands.value.map(({ id }) => id)
}

describe('Initiative table', () => {
  beforeEach(() => {
    mockSheet.value = sheet
    clearCombatEvents.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(Table, { props, provide, global })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display table rows when data is available and widgets section', async () => {
    const component = await mountWithTooltips(Table, { props, provide, global })

    expect(component.findAll('[test-id="row"]').length).toBe(sheet.rows.length)
    expect(component.find('[test-id="widgets"]').exists()).toBeTruthy()
  })

  it('Should display loading state when loading is true', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [],
    }

    const component = await mountWithTooltips(Table, {
      props: { loading: true },
      provide,
      global,
    })

    expect(component.findAll('[test-id="loading"]').length).toBe(10)
  })

  it('Should pass the encounterId through to the header', async () => {
    const component = await mountWithTooltips(Table, {
      props: { ...props, encounterId: 42 },
      provide,
      global,
    })

    expect(
      component
        .findComponent({ name: 'InitiativeHeader' })
        .props('encounterId'),
    ).toBe(42)
  })

  it('Should toast the reminders the next turn returns', async () => {
    const expired: TurnReminder = {
      rowId: sheet.rows[0]!.id,
      rowName: sheet.rows[0]!.name,
      condition: { id: 'prone', name: 'Prone', desc: 'Down.' },
    }
    mockNextTurn.mockResolvedValueOnce({
      expired: [expired],
      saves: [],
      recharges: [],
    })

    const component = await mountWithTooltips(Table, {
      props,
      provide,
      global,
    })

    await component.findComponent({ name: 'InitiativeHeader' }).vm.$emit('next')
    await flushPromises()

    expect(mockNextTurn).toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('components.turnReminders.expired')
  })

  it('Should toast the reminders of a turn ended from the portal', async () => {
    const turnReminders = createEventHook<TurnReminders>()
    const expired: TurnReminder = {
      rowId: sheet.rows[0]!.id,
      rowName: sheet.rows[0]!.name,
      condition: { id: 'prone', name: 'Prone', desc: 'Down.' },
    }

    await mountWithTooltips(Table, {
      props,
      provide: {
        [INITIATIVE_SHEET]: {
          ...provide[INITIATIVE_SHEET],
          onTurnReminders: turnReminders.on,
        },
      },
      global,
    })

    await turnReminders.trigger({
      expired: [expired],
      saves: [],
      recharges: [],
    })

    expect(mockNextTurn).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('components.turnReminders.expired')
  })

  it('Should display empty state when no data is available', async () => {
    mockSheet.value = undefined

    const component = await mountWithTooltips(Table, {
      props: { ...props },
      provide,
      global,
    })

    expect(component.find('[test-id="empty-state"]').exists()).toBeTruthy()
  })

  describe('History panel', () => {
    it('Should not render the history panel by default', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      expect(component.find('[test-id="history-panel"]').exists()).toBeFalsy()
    })

    it('Should show the history panel after toggling it from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('combat-log')
      await vi.waitUntil(() =>
        component.find('[test-id="history-panel"]').exists(),
      )

      expect(component.find('[test-id="history-panel"]').exists()).toBeTruthy()
    })

    it('Should not render the history panel without an encounterId even when toggled', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).not.toContain('combat-log')
      expect(component.find('[test-id="history-panel"]').exists()).toBeFalsy()
    })
  })

  describe('Area damage', () => {
    it('Should open the area damage dialog from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      runCommand('area-damage')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeAreaDamage' }).exists(),
      )

      expect(
        component.findComponent({ name: 'InitiativeAreaDamage' }).props('open'),
      ).toBe(true)

      component.unmount()
    })

    it('Should hide the area damage command when hit points are hidden', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: ['armorClass'],
        } as InitiativeSheet['settings'],
      }

      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).not.toContain('area-damage')

      component.unmount()
    })
  })

  describe('Encounter summary', () => {
    it('Should not render the summary dialog without an encounterId', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).not.toContain('end-encounter')
      expect(
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      ).toBeFalsy()
    })

    it('Should mount the summary dialog closed when an encounterId is given', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      expect(
        component.findComponent({ name: 'InitiativeSummary' }).props('open'),
      ).toBe(false)
    })

    it('Should open the summary from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('end-encounter')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      expect(
        component.findComponent({ name: 'InitiativeSummary' }).props('open'),
      ).toBe(true)
    })

    it('Should close the summary when it is dismissed', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('end-encounter')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      const summary = component.findComponent({ name: 'InitiativeSummary' })

      summary.vm.$emit('update:open', false)
      await nextTick()

      expect(summary.props('open')).toBe(false)
    })

    it('Should close the summary when the players keep playing', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('end-encounter')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      const summary = component.findComponent({ name: 'InitiativeSummary' })

      summary.vm.$emit('keepPlaying')
      await nextTick()

      expect(summary.props('open')).toBe(false)
    })

    it('Should close the summary and clear the events when it is reset', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('end-encounter')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      const summary = component.findComponent({ name: 'InitiativeSummary' })

      summary.vm.$emit('reset', true)
      await vi.waitUntil(() => clearCombatEvents.mock.calls.length > 0)

      expect(clearCombatEvents).toHaveBeenCalledWith({ encounterId: 42 })
      expect(summary.props('open')).toBe(false)
    })

    it('Should clear the logged events when the encounter is reset', async () => {
      await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('reset-hard')
      await vi.waitUntil(() => clearCombatEvents.mock.calls.length > 0)

      expect(clearCombatEvents).toHaveBeenCalledWith({ encounterId: 42 })
    })

    it('Should not try to clear events when there is no encounterId', async () => {
      await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      runCommand('reset-hard')
      await nextTick()

      expect(clearCombatEvents).not.toHaveBeenCalled()
    })
  })

  describe('Table padding', () => {
    it('Should handle all spacing variants', async () => {
      // Test normal spacing (default)
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })
      expect(component.findAll('.p-2').length).toBeGreaterThan(0)

      // Test compact spacing
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          spacing: 'compact',
        } as InitiativeSheet['settings'],
      }
      await nextTick()
      expect(component.findAll('.p-1').length).toBeGreaterThan(0)

      // Test cozy spacing
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          spacing: 'cozy',
        } as InitiativeSheet['settings'],
      }
      await nextTick()
      expect(component.findAll('.p-4').length).toBeGreaterThan(0)
    })
  })

  describe('Column visibility', () => {
    it('Should show all columns by default and update when settings change', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(component.findAll('[test-id="header"]').length).toBe(10)

      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: [],
        } as InitiativeSheet['settings'],
      }

      await nextTick()

      expect(component.findAll('[test-id="header"]').length).toBe(3)
    })

    it('Should hide columns based on settings', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: ['armorClass', 'hitPoints'],
        } as InitiativeSheet['settings'],
      }

      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(component.findAll('[test-id="header"]').length).toBe(5)
    })

    it('Should maintain column visibility state after row expansion', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: [],
        } as InitiativeSheet['settings'],
      }

      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      const firstRow = component.find('[test-id="row"]')
      const expandButton = firstRow.find('button[arialabel="actions.show"]')

      await expandButton.trigger('click')
      await nextTick()

      expect(component.findAll('[test-id="header"]').length).toBe(3)
    })
  })

  it('Should handle row selection and expansion', async () => {
    const component = await mountWithTooltips(Table, { props, provide, global })

    // Test row selection
    const firstRow = component.find('[test-id="row"]')
    await firstRow.trigger('click')
    await nextTick()

    expect(firstRow.attributes('data-state')).toBe('selected')

    // Test row expansion
    const expandButton = firstRow.find('button[arialabel="actions.show"]')
    await expandButton.trigger('click')
    await nextTick()

    expect(component.find('[test-id="expanded"]').exists()).toBeTruthy()
  })

  it('Should keep a row expanded when the rows change', async () => {
    const component = await mountWithTooltips(Table, { props, provide, global })

    await component
      .find('[test-id="row"]')
      .find('button[arialabel="actions.show"]')
      .trigger('click')
    await nextTick()

    mockSheet.value = {
      ...sheet,
      rows: sheet.rows.map((row, index) =>
        index === 0 ? { ...row, hitPoints: 1 } : row,
      ),
    }
    await flushPromises()

    expect(component.find('[test-id="expanded"]').exists()).toBe(true)

    component.unmount()
  })

  describe('Undo and redo', () => {
    const undo = vi.fn().mockResolvedValue(true)
    const redo = vi.fn().mockResolvedValue(true)
    const canUndo = ref(true)
    const canRedo = ref(true)
    const undoProvide = {
      [INITIATIVE_SHEET]: {
        ...provide[INITIATIVE_SHEET],
        undo,
        canUndo,
        redo,
        canRedo,
      },
    }

    let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

    async function mount() {
      wrapper = await mountWithTooltips(Table, {
        props,
        provide: undoProvide,
        global,
      })

      return wrapper
    }

    function press(
      key: string,
      init: KeyboardEventInit,
      target: EventTarget = document,
    ) {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
      )
    }

    beforeEach(() => {
      undo.mockClear()
      redo.mockClear()
      canUndo.value = true
      canRedo.value = true
      vi.mocked(toast.success).mockClear()
    })

    afterEach(() => {
      wrapper?.unmount()
      wrapper = undefined
    })

    it.each([[{ metaKey: true }], [{ ctrlKey: true }]])(
      'Should undo with %o + Z and toast it',
      async modifier => {
        await mount()

        press('z', modifier)
        await flushPromises()

        expect(undo).toHaveBeenCalledOnce()
        expect(redo).not.toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('components.undo.done')
      },
    )

    it.each([
      ['Z', { metaKey: true, shiftKey: true }],
      ['Z', { ctrlKey: true, shiftKey: true }],
      ['y', { ctrlKey: true }],
    ])('Should redo with %s and %o and toast it', async (key, modifier) => {
      await mount()

      press(key, modifier)
      await flushPromises()

      expect(redo).toHaveBeenCalledOnce()
      expect(undo).not.toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('components.undo.redone')
    })

    it('Should leave Z and Y alone without a modifier or with Cmd + Y', async () => {
      await mount()

      press('z', {})
      press('y', {})
      press('y', { metaKey: true })
      await flushPromises()

      expect(undo).not.toHaveBeenCalled()
      expect(redo).not.toHaveBeenCalled()
    })

    it('Should leave the undo of a text field alone', async () => {
      await mount()

      const input = document.createElement('input')
      document.body.appendChild(input)

      press('z', { metaKey: true }, input)
      press('z', { metaKey: true, shiftKey: true }, input)
      await flushPromises()

      expect(undo).not.toHaveBeenCalled()
      expect(redo).not.toHaveBeenCalled()

      input.remove()
    })

    it('Should do nothing when there is nothing to undo or redo', async () => {
      canUndo.value = false
      canRedo.value = false

      await mount()

      press('z', { metaKey: true })
      press('z', { metaKey: true, shiftKey: true })
      await flushPromises()

      expect(undo).not.toHaveBeenCalled()
      expect(redo).not.toHaveBeenCalled()
    })

    it('Should not toast when the undo failed', async () => {
      undo.mockResolvedValueOnce(false)

      await mount()

      press('z', { metaKey: true })
      await flushPromises()

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('Should offer undo and redo in the command palette', async () => {
      await mount()

      expect(commands.value.find(({ id }) => id === 'undo')).toMatchObject({
        shortcut: ['MOD', 'Z'],
        disabled: false,
      })
      expect(commands.value.find(({ id }) => id === 'redo')).toMatchObject({
        shortcut: ['MOD', 'SHIFT', 'Z'],
        disabled: false,
      })

      runCommand('undo')
      runCommand('redo')
      await flushPromises()

      expect(undo).toHaveBeenCalledOnce()
      expect(redo).toHaveBeenCalledOnce()
    })

    it('Should hide the commands when there is nothing to undo or redo', async () => {
      canUndo.value = false
      canRedo.value = false

      await mount()

      expect(commandIds()).not.toContain('undo')
      expect(commandIds()).not.toContain('redo')
    })
  })

  describe('Command palette', () => {
    it('Should offer the turn, row and reset commands', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).toEqual([
        'next-turn',
        'ready-action',
        'damage',
        'heal',
        'condition',
        'area-damage',
        'reset-soft',
        'reset-hard',
      ])

      component.unmount()

      expect(commandIds()).toEqual([])
    })

    it('Should offer the previous turn once the encounter has moved on', async () => {
      mockSheet.value = { ...sheet, activeIndex: 1 }

      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).toContain('previous-turn')

      runCommand('previous-turn')

      expect(mockPreviousTurn).toHaveBeenCalled()

      component.unmount()
    })

    it('Should not offer commands that need rows when the encounter is empty', async () => {
      mockSheet.value = { ...sheet, rows: [] }

      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      expect(commandIds()).toEqual(['live-session', 'combat-log'])

      component.unmount()
    })

    it.each(['damage', 'heal', 'condition'] as const)(
      'Should ask the current row for %s from the palette',
      async action => {
        const component = await mountWithTooltips(Table, {
          props,
          provide,
          global,
        })
        const { request } = useRowShortcut()

        runCommand(action)

        expect(request.value).toEqual({ rowId: sheet.rows[0]!.id, action })

        request.value = undefined
        component.unmount()
      },
    )

    it('Should outline the target and use it for the palette commands', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })
      const { request, targetId } = useRowShortcut()

      targetId.value = sheet.rows[2]!.id
      await nextTick()

      const rows = component.findAll('[test-id="row"]')

      expect(rows[2]!.attributes('data-target')).toBe('true')
      expect(rows[0]!.attributes('data-target')).toBeUndefined()

      runCommand('damage')

      expect(request.value).toEqual({
        rowId: sheet.rows[2]!.id,
        action: 'damage',
      })

      request.value = undefined
      targetId.value = undefined
      component.unmount()
    })

    it('Should hide the row commands when their columns are hidden', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: [],
        } as InitiativeSheet['settings'],
      }

      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      expect(commandIds()).not.toContain('damage')
      expect(commandIds()).not.toContain('heal')
      expect(commandIds()).not.toContain('condition')

      component.unmount()
    })

    it('Should end the turn from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props,
        provide,
        global,
      })

      runCommand('next-turn')
      await flushPromises()

      expect(mockNextTurn).toHaveBeenCalled()

      component.unmount()
    })

    it('Should open the combat log and the summary from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('combat-log')
      await vi.waitUntil(() =>
        component.find('[test-id="history-panel"]').exists(),
      )

      runCommand('end-encounter')
      await vi.waitUntil(() =>
        component.findComponent({ name: 'InitiativeSummary' }).exists(),
      )

      expect(
        component.findComponent({ name: 'InitiativeSummary' }).props('open'),
      ).toBe(true)

      component.unmount()
    })

    it('Should reset the encounter from the palette', async () => {
      const component = await mountWithTooltips(Table, {
        props: { ...props, encounterId: 42 },
        provide,
        global,
      })

      runCommand('reset-soft')

      expect(mockReset).toHaveBeenCalledWith(false)
      expect(clearCombatEvents).toHaveBeenCalledWith({ encounterId: 42 })

      component.unmount()
    })
  })

  describe('Ready an action', () => {
    const patchRow = vi.fn()
    const readyProvide = {
      [INITIATIVE_SHEET]: { ...provide[INITIATIVE_SHEET], patchRow },
    }
    const [first] = sheet.rows

    let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

    async function mount() {
      wrapper = await mountWithTooltips(Table, {
        props,
        provide: readyProvide,
        global,
      })

      return wrapper
    }

    beforeEach(() => {
      patchRow.mockReset().mockResolvedValue(undefined)
      mockNextTurn.mockClear()
    })

    afterEach(() => {
      wrapper?.unmount()
      wrapper = undefined
    })

    it('Should ready an action for the active row without ending the turn', async () => {
      await mount()

      runCommand('ready-action')
      await flushPromises()

      expect(patchRow).toHaveBeenCalledWith(first!.id, { readied: true })
      expect(mockNextTurn).not.toHaveBeenCalled()
    })

    it('Should hide ready when the active row already readied', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...first!, readied: true }, ...sheet.rows.slice(1)],
      }
      await mount()

      expect(commandIds()).not.toContain('ready-action')
    })

    it('Should hide ready on a lair turn', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...first!, type: 'lair' }, ...sheet.rows.slice(1)],
      }
      await mount()

      expect(commandIds()).not.toContain('ready-action')
    })
  })
  describe('Reveal hidden creatures', () => {
    const [first, second] = sheet.rows

    let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

    beforeEach(() => {
      mockPatchRows.mockReset().mockResolvedValue(undefined)
    })

    afterEach(() => {
      wrapper?.unmount()
      wrapper = undefined
    })

    it('Should reveal only the hidden rows, as patches in one request', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...first!, hidden: true }, second!],
      }
      wrapper = await mountWithTooltips(Table, { props, provide, global })

      runCommand('reveal-hidden')
      await flushPromises()

      expect(mockPatchRows).toHaveBeenCalledWith([
        { rowId: first!.id, patch: { hidden: false } },
      ])
    })

    it('Should hide the command when nothing is hidden', async () => {
      wrapper = await mountWithTooltips(Table, { props, provide, global })

      expect(commandIds()).not.toContain('reveal-hidden')
    })
  })
})
