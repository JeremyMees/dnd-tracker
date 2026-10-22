import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import DeathSavePips from '~/components/atoms/DeathSavePips.vue'

const empty: DndDeathSaves = {
  save: [false, false, false],
  fail: [false, false, false],
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount(saves: DndDeathSaves, disabled = false) {
  wrapper = await mountSuspended(DeathSavePips, { props: { saves, disabled } })

  return wrapper
}

function pips(component: NonNullable<typeof wrapper>, type: 'save' | 'fail') {
  return component.findAll(`[test-id="${type}"] [test-id="pip"]`)
}

describe('DeathSavePips', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('renders three save and three fail pips', async () => {
    const component = await mount(empty)

    expect(pips(component, 'save')).toHaveLength(3)
    expect(pips(component, 'fail')).toHaveLength(3)
  })

  it('labels the save and fail groups', async () => {
    const component = await mount(empty)

    expect(component.get('[test-id="save"]').attributes('aria-label')).toBe(
      'components.deathSaves.save',
    )
    expect(component.get('[test-id="fail"]').attributes('aria-label')).toBe(
      'components.deathSaves.fail',
    )
  })

  it('colours saves as success and fails as destructive', async () => {
    const component = await mount({
      save: [true, false, false],
      fail: [true, false, false],
    })

    expect(pips(component, 'save')[0]!.classes()).toContain('bg-success')
    expect(pips(component, 'fail')[0]!.classes()).toContain('bg-destructive')
  })

  it('counts the filled saves and fails', async () => {
    const component = await mount({
      save: [false, true, false],
      fail: [true, true, false],
    })

    expect(
      pips(component, 'save').map((pip: DOMWrapper<Element>) =>
        pip.attributes('aria-pressed'),
      ),
    ).toEqual(['true', 'false', 'false'])
    expect(
      pips(component, 'fail').map((pip: DOMWrapper<Element>) =>
        pip.attributes('aria-pressed'),
      ),
    ).toEqual(['true', 'true', 'false'])
  })

  it('fills every save up to the clicked pip', async () => {
    const component = await mount(empty)

    await pips(component, 'save')[1]!.trigger('click')

    expect(component.emitted('update:saves')).toEqual([
      [{ save: [true, true, false], fail: [false, false, false] }, 'save'],
    ])
  })

  it('gives back fails from the clicked used pip', async () => {
    const component = await mount({
      save: [false, false, false],
      fail: [true, true, true],
    })

    await pips(component, 'fail')[0]!.trigger('click')

    expect(component.emitted('update:saves')).toEqual([
      [{ save: [false, false, false], fail: [false, false, false] }, 'fail'],
    ])
  })

  it('does not emit while disabled', async () => {
    const component = await mount(empty, true)

    await pips(component, 'save')[0]!.trigger('click')

    expect(component.emitted('update:saves')).toBeUndefined()
  })

  it('highlights the grid as stabilized when every save succeeded', async () => {
    const component = await mount({
      save: [true, true, true],
      fail: [true, false, false],
    })

    expect(component.classes()).toContain('bg-success/20')
  })

  it('highlights the grid as dead when every save failed', async () => {
    const component = await mount({
      save: [false, true, true],
      fail: [true, true, true],
    })

    expect(component.classes()).toContain('bg-destructive/20')
  })

  it('does not highlight the grid when both rows are complete', async () => {
    const component = await mount({
      save: [true, true, true],
      fail: [true, true, true],
    })

    expect(component.classes()).not.toContain('bg-success/20')
    expect(component.classes()).not.toContain('bg-destructive/20')
  })
})
