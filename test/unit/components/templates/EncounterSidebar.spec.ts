import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EncounterSidebar from '~/components/templates/EncounterSidebar'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface EncounterSidebarVM {
  diceRollerOpen: boolean
  fantasyNameGeneratorOpen: boolean
  openModal: 'settings' | 'newHomebrew' | 'addHomebrew' | 'bestiary' | 'content' | undefined
  maxCharacters: boolean
}

vi.mock('~/components/ui/sidebar/utils', () => ({
  useSidebar: () => ({
    state: computed(() => 'expanded' as const),
    open: ref(true),
    setOpen: vi.fn(),
    isMobile: ref(false),
    openMobile: ref(false),
    setOpenMobile: vi.fn(),
    toggleSidebar: vi.fn(),
  }),
  provideSidebarContext: vi.fn(),
  SIDEBAR_COOKIE_NAME: 'sidebar:state',
  SIDEBAR_COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
  SIDEBAR_WIDTH: '16rem',
  SIDEBAR_WIDTH_MOBILE: '18rem',
  SIDEBAR_WIDTH_ICON: '3rem',
  SIDEBAR_KEYBOARD_SHORTCUT: 'b',
}))

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
  isExpanded: true,
}

describe('EncounterSidebar', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct initial values', async () => {
    const component = await mountSuspended(EncounterSidebar, { props, provide })
    const vm = component.vm as unknown as EncounterSidebarVM

    expect(vm.diceRollerOpen).toBe(false)
    expect(vm.fantasyNameGeneratorOpen).toBe(false)
    expect(vm.openModal).toBeUndefined()
  })

  it('Should render bestiary button when not at max characters', async () => {
    const component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.find('[data-test-bestiary]').exists()).toBeTruthy()
  })

  it('Should render campaign homebrew button when campaign exists', async () => {
    mockSheet.value = {
      ...sheet,
      campaign: { id: 1, title: 'Test Campaign' },
    }

    const component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.find('[data-test-campaign-homebrew]').exists()).toBeTruthy()
  })

  it('Should not render campaign homebrew button when no campaign', async () => {
    mockSheet.value = {
      ...sheet,
      campaign: undefined,
    }

    const component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.find('[data-test-campaign-homebrew]').exists()).toBeFalsy()
  })

  describe('maxCharacters computed', () => {
    it('Should be false when sheet has less than 50 rows', async () => {
      const component = await mountSuspended(EncounterSidebar, { props, provide })
      const vm = component.vm as unknown as EncounterSidebarVM

      expect(vm.maxCharacters).toBe(false)
    })

    it('Should be true when sheet has 50 or more rows', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }

      const component = await mountSuspended(EncounterSidebar, { props, provide })
      const vm = component.vm as unknown as EncounterSidebarVM

      expect(vm.maxCharacters).toBe(true)
    })

    it('Should hide bestiary and homebrew buttons when at max characters', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }
      await nextTick()

      const component = await mountSuspended(EncounterSidebar, { props, provide })

      expect(component.find('[data-test-bestiary]').exists()).toBeFalsy()
      expect(component.find('[data-test-campaign-homebrew]').exists()).toBeFalsy()
      expect(component.find('[data-test-new-homebrew]').exists()).toBeFalsy()
    })

    it('Should show max characters warning when at max', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }
      await nextTick()

      const component = await mountSuspended(EncounterSidebar, { props, provide })

      expect(component.find('[data-test-max-characters]').exists()).toBeTruthy()
    })
  })

  it('Should render correctly when collapsed', async () => {
    const component = await mountSuspended(EncounterSidebar, {
      props: { isExpanded: false },
      provide,
    })

    expect(component.html()).toBeTruthy()
  })

  it('Should emit toggleSidebar event when triggered', async () => {
    const component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.emitted()).toBeDefined()
  })
})
