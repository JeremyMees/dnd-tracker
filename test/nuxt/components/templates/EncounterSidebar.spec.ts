import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EncounterSidebar from '~/components/templates/EncounterSidebar.vue'
import { DialogContent } from '~/components/ui/dialog'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'

interface EncounterSidebarVM {
  openModal:
    | 'settings'
    | 'newHomebrew'
    | 'addHomebrew'
    | 'bestiary'
    | 'content'
    | undefined
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

const formStubs = {
  FormPinContent: { name: 'FormPinContent', template: '<div />' },
  FormBestiary: { name: 'FormBestiary', template: '<div />' },
  FormCampaignHomebrew: {
    name: 'FormCampaignHomebrew',
    template: '<div />',
    emits: ['close'],
  },
  FormHomebrew: {
    name: 'FormHomebrew',
    props: ['count'],
    template: '<div />',
    emits: ['close'],
  },
  FormInitiativeSettings: {
    name: 'FormInitiativeSettings',
    template: '<div />',
    emits: ['close'],
  },
}

let component: VueWrapper<InstanceType<typeof EncounterSidebar>>

describe('EncounterSidebar', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct initial values', async () => {
    component = await mountSuspended(EncounterSidebar, { props, provide })
    const vm = component.vm as unknown as EncounterSidebarVM

    expect(vm.openModal).toBeUndefined()
  })

  it('Should render bestiary button when not at max characters', async () => {
    component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.find('[test-id="bestiary"]').exists()).toBeTruthy()
  })

  it('Should render campaign homebrew button when campaign exists', async () => {
    mockSheet.value = {
      ...sheet,
      campaign: mockSheetCampaign,
    }

    component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(
      component.find('[test-id="campaign-homebrew"]').exists(),
    ).toBeTruthy()
  })

  it('Should not render campaign homebrew button when no campaign', async () => {
    mockSheet.value = {
      ...sheet,
      campaign: undefined,
    }

    component = await mountSuspended(EncounterSidebar, { props, provide })

    expect(component.find('[test-id="campaign-homebrew"]').exists()).toBeFalsy()
  })

  describe('maxCharacters computed', () => {
    it('Should be false when sheet has less than 50 rows', async () => {
      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
      })
      const vm = component.vm as unknown as EncounterSidebarVM

      expect(vm.maxCharacters).toBeFalsy()
    })

    it('Should be true when sheet has 50 or more rows', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
      })
      const vm = component.vm as unknown as EncounterSidebarVM

      expect(vm.maxCharacters).toBeTruthy()
    })

    it('Should hide bestiary and homebrew buttons when at max characters', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }
      await nextTick()

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
      })

      expect(component.find('[test-id="bestiary"]').exists()).toBeFalsy()
      expect(
        component.find('[test-id="campaign-homebrew"]').exists(),
      ).toBeFalsy()
      expect(component.find('[test-id="new-homebrew"]').exists()).toBeFalsy()
    })

    it('Should show max characters warning when at max', async () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({
        ...sheet.rows[0]!,
        id: `row-${i}`,
      }))

      mockSheet.value = { ...sheet, rows }
      await nextTick()

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
      })

      expect(component.find('[test-id="max-characters"]').exists()).toBeTruthy()
    })
  })

  it('Should render correctly when collapsed', async () => {
    component = await mountSuspended(EncounterSidebar, {
      props: { isExpanded: false },
      provide,
    })

    expect(component.html()).toBeTruthy()
  })

  describe.each<{
    trigger: string
    modal: EncounterSidebarVM['openModal']
    title: string
    dialogIndex: number
  }>([
    {
      trigger: 'content',
      modal: 'content',
      title: 'components.navbar.dnd-content',
      dialogIndex: 0,
    },
    {
      trigger: 'bestiary',
      modal: 'bestiary',
      title: 'general.bestiary',
      dialogIndex: 1,
    },
    {
      trigger: 'campaign-homebrew',
      modal: 'addHomebrew',
      title: 'general.campaignHomebrew',
      dialogIndex: 2,
    },
    {
      trigger: 'new-homebrew',
      modal: 'newHomebrew',
      title: 'general.newHomebrew',
      dialogIndex: 3,
    },
    {
      trigger: 'settings',
      modal: 'settings',
      title: 'general.setting',
      dialogIndex: 4,
    },
  ])('$trigger dialog', ({ trigger, modal, title, dialogIndex }) => {
    it('Should open the dialog with the correct content when the trigger is clicked', async () => {
      mockSheet.value = { ...sheet, campaign: mockSheetCampaign }

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
        global: { stubs: formStubs },
      })
      const vm = component.vm as unknown as EncounterSidebarVM

      await component.get(`[test-id="${trigger}"]`).trigger('click')

      expect(vm.openModal).toBe(modal)
      expect(document.body.textContent).toContain(title)
    })

    it('Should close the dialog when the close button is clicked', async () => {
      mockSheet.value = { ...sheet, campaign: mockSheetCampaign }

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
        global: { stubs: formStubs },
      })
      const vm = component.vm as unknown as EncounterSidebarVM

      await component.get(`[test-id="${trigger}"]`).trigger('click')

      const dialogContent =
        component.findAllComponents(DialogContent)[dialogIndex]!
      dialogContent.vm.$emit('close')
      await nextTick()

      expect(vm.openModal).toBeUndefined()
    })

    it('Should close the dialog on escape key down, pointer down outside and interact outside', async () => {
      mockSheet.value = { ...sheet, campaign: mockSheetCampaign }

      component = await mountSuspended(EncounterSidebar, {
        props,
        provide,
        global: { stubs: formStubs },
      })
      const vm = component.vm as unknown as EncounterSidebarVM

      for (const event of [
        'escapeKeyDown',
        'pointerDownOutside',
        'interactOutside',
      ]) {
        await component.get(`[test-id="${trigger}"]`).trigger('click')
        expect(vm.openModal).toBe(modal)

        const dialogContent =
          component.findAllComponents(DialogContent)[dialogIndex]!
        dialogContent.vm.$emit(event)
        await nextTick()

        expect(vm.openModal).toBeUndefined()
      }
    })
  })

  it('Should close the campaign homebrew dialog when the form closes', async () => {
    mockSheet.value = { ...sheet, campaign: mockSheetCampaign }

    component = await mountSuspended(EncounterSidebar, {
      props,
      provide,
      global: { stubs: formStubs },
    })
    const vm = component.vm as unknown as EncounterSidebarVM

    await component.get('[test-id="campaign-homebrew"]').trigger('click')
    expect(vm.openModal).toBe('addHomebrew')

    await component
      .findComponent({ name: 'FormCampaignHomebrew' })
      .vm.$emit('close')

    expect(vm.openModal).toBeUndefined()
  })

  it('Should close the new homebrew dialog when the form closes', async () => {
    component = await mountSuspended(EncounterSidebar, {
      props,
      provide,
      global: { stubs: formStubs },
    })
    const vm = component.vm as unknown as EncounterSidebarVM

    await component.get('[test-id="new-homebrew"]').trigger('click')
    expect(vm.openModal).toBe('newHomebrew')

    await component.findComponent({ name: 'FormHomebrew' }).vm.$emit('close')

    expect(vm.openModal).toBeUndefined()
  })

  it('Should pass the current row count to the new homebrew form', async () => {
    mockSheet.value = { ...sheet, rows: [] }

    component = await mountSuspended(EncounterSidebar, {
      props,
      provide,
      global: { stubs: formStubs },
    })

    await component.get('[test-id="new-homebrew"]').trigger('click')

    expect(
      component.findComponent({ name: 'FormHomebrew' }).props('count'),
    ).toBe(0)
  })

  it('Should close the settings dialog when the form closes', async () => {
    component = await mountSuspended(EncounterSidebar, {
      props,
      provide,
      global: { stubs: formStubs },
    })
    const vm = component.vm as unknown as EncounterSidebarVM

    await component.get('[test-id="settings"]').trigger('click')
    expect(vm.openModal).toBe('settings')

    await component
      .findComponent({ name: 'FormInitiativeSettings' })
      .vm.$emit('close')

    expect(vm.openModal).toBeUndefined()
  })

  it('Should reset openModal on unmount', async () => {
    component = await mountSuspended(EncounterSidebar, {
      props,
      provide,
      global: { stubs: formStubs },
    })
    const vm = component.vm as unknown as EncounterSidebarVM

    await component.get('[test-id="settings"]').trigger('click')
    expect(vm.openModal).toBe('settings')

    component.unmount()

    expect(vm.openModal).toBeUndefined()
  })
})
