import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import UsePips from '~/components/atoms/UsePips.vue'

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount(used: number, max = 3) {
  wrapper = await mountSuspended(UsePips, {
    props: { label: 'Legendary actions', max, used },
  })

  return wrapper
}

function pressed(component: NonNullable<typeof wrapper>): string[] {
  return component
    .findAll('[test-id="pip"]')
    .map((pip: DOMWrapper<Element>) => pip.attributes('aria-pressed')!)
}

describe('UsePips', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render a pip per use and fill the used ones', async () => {
    const component = await mount(2)

    expect(pressed(component)).toEqual(['true', 'true', 'false'])
  })

  it('Should label the group and every pip', async () => {
    const component = await mount(0, 2)

    expect(component.find('[role="group"]').attributes('aria-label')).toBe(
      'Legendary actions',
    )
    expect(
      component.findAll('[test-id="pip"]')[1]!.attributes('aria-label'),
    ).toBe('Legendary actions 2')
  })

  it('Should use up to the clicked pip', async () => {
    const component = await mount(0)

    await component.findAll('[test-id="pip"]')[1]!.trigger('click')

    expect(component.emitted('update:used')).toEqual([[2]])
  })

  it('Should give back uses from the clicked used pip', async () => {
    const component = await mount(3)

    await component.findAll('[test-id="pip"]')[1]!.trigger('click')

    expect(component.emitted('update:used')).toEqual([[1]])
  })

  it('Should clear the only use when its pip is clicked again', async () => {
    const component = await mount(1, 1)

    await component.find('[test-id="pip"]').trigger('click')

    expect(component.emitted('update:used')).toEqual([[0]])
  })
})
