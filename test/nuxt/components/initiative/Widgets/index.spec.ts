import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import Widgets from '~/components/initiative/Widgets/index.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { authUser } from '~~/test/fixtures/auth-user'

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
})
