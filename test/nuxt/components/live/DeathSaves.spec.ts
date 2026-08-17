import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveDeathSaves from '~/components/live/DeathSaves.vue'

const empty: DndDeathSaves = {
  save: [false, false, false],
  fail: [false, false, false],
}

describe('LiveDeathSaves', () => {
  it('renders three save and three fail toggles', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: { saves: empty },
    })

    expect(component.findAll('[test-id="save"]')).toHaveLength(3)
    expect(component.findAll('[test-id="fail"]')).toHaveLength(3)
  })

  it('marks the filled saves and fails', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: {
        saves: { save: [true, false, false], fail: [false, true, false] },
      },
    })

    expect(component.findAll('[test-id="save"]')[0]!.classes()).toContain(
      'bg-success!',
    )
    expect(component.findAll('[test-id="fail"]')[1]!.classes()).toContain(
      'bg-destructive!',
    )
  })

  it('emits the toggled index and kind', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: { saves: empty },
    })

    await component.findAll('[test-id="save"]')[2]!.trigger('click')
    await component.findAll('[test-id="fail"]')[0]!.trigger('click')

    expect(component.emitted('toggle')).toEqual([
      [2, true],
      [0, false],
    ])
  })

  it('does not emit while disabled', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: { saves: empty, disabled: true },
    })

    await component.findAll('[test-id="save"]')[0]!.trigger('click')

    expect(component.emitted('toggle')).toBeUndefined()
  })

  it('highlights the grid as stabilized when every save succeeded', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: {
        saves: { save: [true, true, true], fail: [true, false, false] },
      },
    })

    expect(component.classes()).toContain('bg-success/20')
  })

  it('highlights the grid as dead when every save failed', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: { saves: { save: [false, true, true], fail: [true, true, true] } },
    })

    expect(component.classes()).toContain('bg-destructive/20')
  })

  it('does not highlight the grid when both rows are complete', async () => {
    const component = await mountSuspended(LiveDeathSaves, {
      props: { saves: { save: [true, true, true], fail: [true, true, true] } },
    })

    expect(component.classes()).not.toContain('bg-success/20')
    expect(component.classes()).not.toContain('bg-destructive/20')
  })
})
