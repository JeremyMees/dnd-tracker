import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import Widgets from '~/components/initiative/Widgets/index.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { authUser } from '~~/test/fixtures/auth-user'

interface WidgetsVM {
  popoverOpen: boolean
  isModified: boolean
  onSubmit: () => Promise<void>
  onDragEnd: () => void
  saveWidgets: (widgets: InitiativeWidget[]) => void
  localWidgets: InitiativeWidget[]
  form: {
    values: { widgets?: InitiativeWidget[] }
    setValues: (values: { widgets: InitiativeWidget[] }) => void
  }
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

const liveUser = ref<AuthUser>({ ...authUser })
const liveSession = ref<{ token: string; code: string; expiresAt: string }>()
const liveActive = ref(false)

mockNuxtImport('useAuthenticatedUser', () => () => liveUser)
mockNuxtImport('useLiveSession', () => () => ({
  session: liveSession,
  active: liveActive,
  start: vi.fn(),
}))
mockNuxtImport('useLiveSeats', () => () => ({
  seats: ref([]),
  connected: ref(new Set()),
  kick: vi.fn(),
  reassign: vi.fn(),
}))

let component: VueWrapper<InstanceType<typeof Widgets>>

describe('Initiative widgets wrapper', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
    liveActive.value = false
  })

  afterEach(() => {
    component?.unmount()
  })

  it('Should match snapshot', async () => {
    component = await mountSuspended(Widgets, { provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render note widget when enabled', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['note'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(
      component.findComponent({ name: 'InitiativeWidgetsNote' }).exists(),
    ).toBeTruthy()
  })

  it('Should render pinned content widget when enabled', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['info-pins'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()

    expect(
      component
        .findComponent({ name: 'InitiativeWidgetsPinnedContent' })
        .exists(),
    ).toBeTruthy()
  })

  it('Should render all widgets when not modified', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        modified: false,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(
      component.findComponent({ name: 'InitiativeWidgetsNote' }).exists(),
    ).toBeTruthy()
    expect(
      component
        .findComponent({ name: 'InitiativeWidgetsPinnedContent' })
        .exists(),
    ).toBeTruthy()
  })

  it('Should show the empty state when there are no widgets and no live session', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: [],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(component.text()).toContain(
      'components.initiativeSettings.noActiveWidgets',
    )
  })

  it('Should hide the empty state when a live session is active even with no other widgets', async () => {
    liveActive.value = true
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: [],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, {
      provide,
      props: { encounterId: 1 },
    })

    expect(component.text()).not.toContain(
      'components.initiativeSettings.noActiveWidgets',
    )
    expect(component.find('[test-id="live-connected"]').exists()).toBe(true)
  })

  it('Should call update when note content changes', async () => {
    component = await mountSuspended(Widgets, { provide })
    const noteWidget = component.findComponent({
      name: 'InitiativeWidgetsNote',
    })

    await noteWidget.vm.$emit('update', 'New note content')

    expect(mockUpdate).toHaveBeenCalledWith({ info: 'New note content' })
  })

  it('Should call update when pinned content changes', async () => {
    component = await mountSuspended(Widgets, { provide })
    const pinnedContentWidget = component.findComponent({
      name: 'InitiativeWidgetsPinnedContent',
    })

    await pinnedContentWidget.vm.$emit('update', [])

    expect(mockUpdate).toHaveBeenCalledWith({ infoCards: [] })
  })

  it('Should render fantasy name generator widget when enabled', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['fantasy-name-generator'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(
      component
        .findComponent({ name: 'InitiativeWidgetsFantasyNameGenerator' })
        .exists(),
    ).toBeTruthy()
  })

  it('Should render dice roll widget when enabled', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['dice-roll'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(
      component.findComponent({ name: 'InitiativeWidgetsDiceRoll' }).exists(),
    ).toBeTruthy()
  })

  describe('Widget settings popover', () => {
    it('Should populate form with all widgets when not modified', async () => {
      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.popoverOpen = true
      await nextTick()

      expect(vm.form.values.widgets).toEqual(vm.localWidgets)
    })

    it('Should populate form with saved widgets when modified', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          widgets: ['note'],
          modified: true,
        } as InitiativeSheet['settings'],
      }

      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.popoverOpen = true
      await nextTick()

      expect(vm.form.values.widgets).toEqual(['note'])
    })

    it('Should render the checkbox group and save button once opened', async () => {
      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.popoverOpen = true
      await nextTick()

      expect(document.body.textContent).toContain('actions.save')
    })

    it('Should update settings and close the popover on submit', async () => {
      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.popoverOpen = true
      await nextTick()

      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        settings: expect.objectContaining({ modified: true }),
      })
      expect(vm.popoverOpen).toBe(false)
    })

    it('Should not call update on submit when sheet is undefined', async () => {
      mockSheet.value = undefined as unknown as InitiativeSheet

      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Widget list interactions', () => {
    it('Should call update with reordered widgets on drag end', async () => {
      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.onDragEnd()

      expect(mockUpdate).toHaveBeenCalledWith({
        settings: expect.objectContaining({ widgets: vm.localWidgets }),
      })
    })

    it('Should not save widgets when sheet is undefined', async () => {
      mockSheet.value = undefined as unknown as InitiativeSheet

      component = await mountSuspended(Widgets, { provide })
      const vm = component.vm as unknown as WidgetsVM

      vm.saveWidgets(['note'])

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('Should remove a widget and call update when the remove button is clicked', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          widgets: ['note', 'dice-roll'],
          modified: true,
        } as InitiativeSheet['settings'],
      }

      component = await mountSuspended(Widgets, { provide })

      await component.findAll('[test-id="remove-widget"]')[0]!.trigger('click')

      expect(mockUpdate).toHaveBeenCalledWith({
        settings: expect.objectContaining({ widgets: ['dice-roll'] }),
      })
    })
  })
})
