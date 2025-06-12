import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Widgets, { provide })

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

    const component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
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

    const component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should render all widgets when not modified', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        modified: false,
      } as InitiativeSheet['settings'],
    }

    const component = await mountSuspended(Widgets, { provide })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should call update when note content changes', async () => {
    const component = await mountSuspended(Widgets, { provide })
    const noteWidget = component.findComponent({ name: 'InitiativeWidgetsNote' })

    await noteWidget.vm.$emit('update', 'New note content')

    expect(mockUpdate).toHaveBeenCalledWith({ info: 'New note content' })
  })

  it('Should call update when pinned content changes', async () => {
    const component = await mountSuspended(Widgets, { provide })
    const pinnedContentWidget = component.findComponent({ name: 'InitiativeWidgetsPinnedContent' })

    await pinnedContentWidget.vm.$emit('update', [])

    expect(mockUpdate).toHaveBeenCalledWith({ info_cards: [] })
  })
})
