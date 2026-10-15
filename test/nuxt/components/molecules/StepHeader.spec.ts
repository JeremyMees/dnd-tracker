import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import StepHeader from '~/components/molecules/StepHeader.vue'

let wrapper: VueWrapper | undefined

async function mountStepHeader(
  props: Partial<InstanceType<typeof StepHeader>['$props']> = {},
  slots: Record<string, string> = {},
) {
  wrapper = await mountSuspended(StepHeader, {
    props: { title: 'Pick a monster', ...props },
    slots,
  })

  return wrapper
}

describe('StepHeader', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should match snapshot', async () => {
    const component = await mountStepHeader({
      description: 'Any monster will do',
      back: true,
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the title with the given id', async () => {
    const component = await mountStepHeader({ titleId: 'step-title' })

    const heading = component.get('h3')

    expect(heading.text()).toBe('Pick a monster')
    expect(heading.attributes('id')).toBe('step-title')
  })

  it('Should render the description', async () => {
    const component = await mountStepHeader({ description: 'Any will do' })

    expect(component.get('[test-id="step-description"]').text()).toBe(
      'Any will do',
    )
  })

  it('Should prefer the description slot', async () => {
    const component = await mountStepHeader(
      { description: 'Plain' },
      { description: '<strong>Rich</strong>' },
    )

    const description = component.get('[test-id="step-description"]')

    expect(description.find('strong').text()).toBe('Rich')
    expect(description.text()).not.toContain('Plain')
  })

  it('Should leave out the description when there is none', async () => {
    const component = await mountStepHeader()

    expect(component.find('[test-id="step-description"]').exists()).toBe(false)
  })

  it('Should hide the back button by default', async () => {
    const component = await mountStepHeader()

    expect(component.find('[test-id="step-back"]').exists()).toBe(false)
  })

  it('Should emit back from the back button', async () => {
    const component = await mountStepHeader({ back: true })

    await component.get('[test-id="step-back"]').trigger('click')

    expect(component.emitted('back')).toHaveLength(1)
  })

  it('Should center its content when asked', async () => {
    const component = await mountStepHeader({ center: true })

    expect(component.get('header').classes()).toContain('text-center')
  })
})
