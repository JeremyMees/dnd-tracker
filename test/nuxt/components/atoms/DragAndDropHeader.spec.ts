import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DragAndDropHeader from '~/components/atoms/DragAndDropHeader.vue'

describe('DragAndDropHeader', () => {
  const props = {
    title: 'My Widget',
  }

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DragAndDropHeader, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the drag handle icon', async () => {
    const component = await mountSuspended(DragAndDropHeader, { props })

    expect(component.find('.drag-handle').exists()).toBeTruthy()
  })

  it('Should render the title text', async () => {
    const component = await mountSuspended(DragAndDropHeader, { props })

    expect(component.find('[data-test-title]').text()).toBe('My Widget')
  })

  it('Should not render the slot container when no slot is provided', async () => {
    const component = await mountSuspended(DragAndDropHeader, { props })

    expect(component.find('[data-test-actions]').exists()).toBeFalsy()
  })

  it('Should render slot content when provided', async () => {
    const component = await mountSuspended(DragAndDropHeader, {
      props,
      slots: {
        default: () => '<button>Action</button>',
      },
    })

    expect(component.find('[data-test-actions]').exists()).toBeTruthy()
    expect(component.find('[data-test-actions]').text()).toContain('Action')
  })
})
