import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import TabNav from '~/components/form/TabNav.vue'
import TooltipAtom from '~/components/atoms/Tooltip.vue'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

let wrapper: VueWrapper | undefined

async function mountTabNav(props: Record<string, unknown> = {}) {
  wrapper = await mountWithTooltips(TabNav, {
    props: { canGoBack: true, canGoForward: true, ...props },
  })

  return wrapper
}

function tooltipOf(component: VueWrapper, testId: string) {
  return component
    .findAllComponents(TooltipAtom)
    .find(tooltip => tooltip.find(`[test-id="${testId}"]`).exists())!
}

describe('FormTabNav', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should match snapshot', async () => {
    const component = await mountTabNav()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should emit back and next', async () => {
    const component = await mountTabNav()

    await component.get('[test-id="prev"]').trigger('click')
    await component.get('[test-id="next"]').trigger('click')

    expect(component.emitted('back')).toHaveLength(1)
    expect(component.emitted('next')).toHaveLength(1)
  })

  it('Should disable back when it cannot go back', async () => {
    const component = await mountTabNav({ canGoBack: false })

    expect(
      component.get('[test-id="prev"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="next"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should disable next when it cannot go forward', async () => {
    const component = await mountTabNav({ canGoForward: false })

    expect(
      component.get('[test-id="next"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should label back as previous by default', async () => {
    const component = await mountTabNav()

    expect(tooltipOf(component, 'prev').props('text')).toBe('actions.prev')
    expect(component.get('[test-id="prev"]').attributes('aria-label')).toBe(
      'actions.prev',
    )
  })

  it('Should use the given back label', async () => {
    const component = await mountTabNav({ backLabel: 'Change type' })

    expect(tooltipOf(component, 'prev').props('text')).toBe('Change type')
    expect(component.get('[test-id="prev"]').attributes('aria-label')).toBe(
      'Change type',
    )
  })

  it('Should submit the surrounding form', async () => {
    const component = await mountTabNav()

    expect(component.get('[test-id="submit"]').attributes('type')).toBe(
      'submit',
    )
    expect(component.get('[test-id="submit"]').text()).toBe('actions.save')
  })

  it('Should use the given submit label', async () => {
    const component = await mountTabNav({ submitLabel: 'Create' })

    expect(component.get('[test-id="submit"]').text()).toBe('Create')
  })
})
