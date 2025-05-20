import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Widgets from '~/components/initiative/Widgets/index.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  sheet?: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()

const props: Props = {
  sheet,
  update: mockUpdate,
}

describe('Initiative widgets wrapper', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Widgets, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render note widget when enabled', async () => {
    const component = await mountSuspended(Widgets, {
      props: {
        ...props,
        sheet: {
          ...sheet,
          settings: {
            ...sheet.settings,
            widgets: ['note'],
            modified: true,
          },
        },
      },
    })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
  })

  it('Should render pinned content widget when enabled', async () => {
    const component = await mountSuspended(Widgets, {
      props: {
        ...props,
        sheet: {
          ...sheet,
          settings: {
            ...sheet.settings,
            widgets: ['info-pins'],
            modified: true,
          },
        },
      },
    })

    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should render all widgets when not modified', async () => {
    const component = await mountSuspended(Widgets, {
      props: {
        ...props,
        sheet: {
          ...sheet,
          settings: {
            ...sheet.settings,
            modified: false,
          },
        },
      },
    })

    expect(component.findComponent({ name: 'InitiativeWidgetsNote' }).exists()).toBeTruthy()
    expect(component.findComponent({ name: 'InitiativeWidgetsPinnedContent' }).exists()).toBeTruthy()
  })

  it('Should call update when note content changes', async () => {
    const component = await mountSuspended(Widgets, { props })
    const noteWidget = component.findComponent({ name: 'InitiativeWidgetsNote' })

    await noteWidget.vm.$emit('update', 'New note content')

    expect(mockUpdate).toHaveBeenCalledWith({ info: 'New note content' })
  })

  it('Should call update when pinned content changes', async () => {
    const component = await mountSuspended(Widgets, { props })
    const pinnedContentWidget = component.findComponent({ name: 'InitiativeWidgetsPinnedContent' })

    await pinnedContentWidget.vm.$emit('update', [])

    expect(mockUpdate).toHaveBeenCalledWith({ info_cards: [] })
  })
})
