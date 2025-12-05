import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import Widgets from '~/components/initiative/Widgets/index.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

describe('Initiative widgets wrapper', async () => {
  let component: VueWrapper | null = null

  beforeEach(() => {
    mockSheet.value = sheet
  })

  afterEach(async () => {
    component?.unmount()
    await vi.runAllTimersAsync()
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    vi.useFakeTimers()
    component = await mountSuspended(Widgets, { provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render note widget when enabled', async () => {
    vi.useFakeTimers()
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['note'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
  })

  it('Should render pinned content widget when enabled', async () => {
    vi.useFakeTimers()
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        widgets: ['info-pins'],
        modified: true,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should render all widgets when not modified', async () => {
    vi.useFakeTimers()
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        modified: false,
      } as InitiativeSheet['settings'],
    }

    component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should call update when note content changes', async () => {
    vi.useFakeTimers()
    component = await mountSuspended(Widgets, { provide })
    const noteWidget = component.findComponent({ name: 'InitiativeWidgetsNote' })

    await noteWidget.vm.$emit('update', 'New note content')

    expect(mockUpdate).toHaveBeenCalledWith({ info: 'New note content' })
  })

  it('Should call update when pinned content changes', async () => {
    vi.useFakeTimers()
    component = await mountSuspended(Widgets, { provide })
    const pinnedContentWidget = component.findComponent({ name: 'InitiativeWidgetsPinnedContent' })

    await pinnedContentWidget.vm.$emit('update', [])

    expect(mockUpdate).toHaveBeenCalledWith({ info_cards: [] })
  })
})
