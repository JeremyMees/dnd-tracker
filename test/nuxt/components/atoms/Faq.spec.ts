import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Faq from '~/components/atoms/Faq.vue'
import { AccordionItem } from '~/components/ui/accordion'

const props = {
  title: 'Frequently Asked Questions',
  items: [
    { title: 'Question 1', content: 'Answer 1' },
    { title: 'Question 2', content: 'Answer 2' },
    { title: 'Question 3', content: 'Answer 3' },
  ],
}

describe('Faq', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Faq, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the title', async () => {
    const component = await mountSuspended(Faq, { props })

    expect(component.find('h2').text()).toBe('Frequently Asked Questions')
  })

  it('Should render one accordion item per items entry', async () => {
    const component = await mountSuspended(Faq, { props })

    expect(component.findAllComponents(AccordionItem)).toHaveLength(3)
  })

  it('Should render item title and trigger for each item', async () => {
    const component = await mountSuspended(Faq, { props })

    expect(component.text()).toContain('Question 1')
    expect(component.text()).toContain('Question 2')
    expect(component.text()).toContain('Question 3')
  })

  it('Should reveal an item content when its trigger is clicked', async () => {
    const component = await mountSuspended(Faq, { props })

    await component.find('button').trigger('click')
    await nextTick()

    expect(component.text()).toContain('Answer 1')
  })

  it('Should use item.title as the value for each accordion item', async () => {
    const component = await mountSuspended(Faq, { props })

    const accordionItems = component.findAllComponents(AccordionItem)

    expect(accordionItems.map(item => item.props('value'))).toEqual([
      'Question 1',
      'Question 2',
      'Question 3',
    ])
  })

  it('Should render no accordion items when items is empty', async () => {
    const component = await mountSuspended(Faq, {
      props: { title: 'Empty', items: [] },
    })

    expect(component.findAllComponents(AccordionItem)).toHaveLength(0)
  })
})
