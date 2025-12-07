import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Init from '~/components/initiative/TableHeader/Init'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface InitVM {
  popoverOpen: boolean
  formError: string
  usedTypes: string[]
  rollAllInitiatives: () => void
  onSubmit: () => Promise<void>
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
    activeRow: mockActiveRow,
  },
}

const props = {
  label: 'Init',
}

describe('Initiative TableHeader Init', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Init, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct initial values', async () => {
    const component = await mountSuspended(Init, { props, provide })
    const vm = component.vm as unknown as InitVM

    expect(vm.formError).toBe('')
    expect(vm.popoverOpen).toBe(false)
  })

  describe('usedTypes computed', () => {
    it('Should return unique types from sheet rows', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toContain('player')
      expect(vm.usedTypes).toContain('npc')
    })

    it('Should return unique types without duplicates', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, type: 'player' },
          { ...sheet.rows[1]!, type: 'player' },
          { ...sheet.rows[2]!, type: 'npc' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(2)
      expect(vm.usedTypes).toContain('player')
      expect(vm.usedTypes).toContain('npc')
    })

    it('Should return empty array when no rows', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(0)
    })

    it('Should handle monster type rows', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, type: 'monster' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toContain('monster')
    })

    it('Should handle multiple different types', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, type: 'player' },
          { ...sheet.rows[1]!, type: 'npc' },
          { ...sheet.rows[2]!, type: 'monster' },
          { ...sheet.rows[0]!, id: 'unique-1', type: 'lair' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(4)
    })
  })

  describe('Form methods', () => {
    it('Should have rollAllInitiatives callable', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(typeof vm.rollAllInitiatives).toBe('function')
    })

    it('Should have onSubmit callable', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(typeof vm.onSubmit).toBe('function')
    })

    it('Should not call update when sheet is undefined', async () => {
      mockSheet.value = undefined

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM
      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Initiative values handling', () => {
    it('Should handle rows with initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, initiative: 15, initiative_modifier: 2 },
          { ...sheet.rows[1]!, initiative: 10, initiative_modifier: -1 },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })

    it('Should handle rows with undefined initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, initiative: undefined, initiative_modifier: undefined }],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })

    it('Should handle rows with negative initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, initiative: -1, initiative_modifier: -5 }],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })
  })
})
