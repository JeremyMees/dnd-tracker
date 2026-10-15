import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ConditionPicker from '~/components/molecules/ConditionPicker.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import conditions from '~~/test/fixtures/conditions.json'

const [blinded, charmed, deafened] = conditions as DndCondition[]
const item = sheet.rows[0]!
const duration: DndConditionDuration = {
  rowId: item.id,
  timing: 'end',
  rounds: 1,
}

let wrapper: VueWrapper | undefined

async function mount(
  props: Partial<{ applied: DndCondition[]; disabled: boolean }> = {},
): Promise<VueWrapper> {
  wrapper = await mountSuspended(ConditionPicker, {
    props: {
      conditions: [blinded!, charmed!, deafened!],
      applied: [],
      item,
      rows: sheet.rows,
      activeRowId: item.id,
      ...props,
    },
  })

  return wrapper
}

function options(component: VueWrapper) {
  return component.findAll('[test-id="option"]')
}

describe('ConditionPicker', () => {
  afterEach(() => {
    wrapper?.unmount()
  })

  it('Should render an option per condition and mark the applied ones', async () => {
    const component = await mount({ applied: [charmed!] })

    expect(options(component)).toHaveLength(3)
    expect(
      options(component).map(option => option.attributes('aria-pressed')),
    ).toEqual(['false', 'true', 'false'])
    expect(component.find('[test-id="pending"]').exists()).toBe(false)
  })

  it('Should lock the other options and ask for a duration when one is picked', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')

    expect(component.find('[test-id="pending"]').exists()).toBe(true)
    expect(
      options(component).map(option => option.attributes('aria-disabled')),
    ).toEqual(['false', 'true', 'true'])
  })

  it('Should ignore clicks on locked options', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')
    await options(component)[1]!.trigger('click')

    expect(options(component)[1]!.attributes('aria-pressed')).toBe('false')
    expect(component.emitted('remove')).toBeUndefined()
  })

  it('Should cancel the pick when the picked option is clicked again', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')
    await options(component)[0]!.trigger('click')

    expect(component.find('[test-id="pending"]').exists()).toBe(false)
    expect(
      options(component).map(option => option.attributes('aria-disabled')),
    ).toEqual(['false', 'false', 'false'])
  })

  it('Should add the picked condition without a duration', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')
    await component
      .findComponent({ name: 'FormConditionDuration' })
      .vm.$emit('update', null)

    expect(component.emitted('add')).toEqual([[blinded]])
    expect(component.find('[test-id="pending"]').exists()).toBe(false)
    expect(
      options(component).map(option => option.attributes('aria-disabled')),
    ).toEqual(['false', 'false', 'false'])
  })

  it('Should add the picked condition with the chosen duration', async () => {
    const component = await mount()

    await options(component)[1]!.trigger('click')
    await component
      .findComponent({ name: 'FormConditionDuration' })
      .vm.$emit('update', duration)

    expect(component.emitted('add')).toEqual([[{ ...charmed, duration }]])
  })

  it('Should offer no duration as an option while adding', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')

    expect(
      component.findComponent({ name: 'FormConditionDuration' }).props(),
    ).toMatchObject({ allowNone: true, activeRowId: item.id })
  })

  it('Should remove an applied condition straight away', async () => {
    const component = await mount({ applied: [charmed!] })

    await options(component)[1]!.trigger('click')

    expect(component.emitted('remove')).toEqual([[charmed]])
    expect(component.find('[test-id="pending"]').exists()).toBe(false)
  })

  it('Should ignore clicks while disabled', async () => {
    const component = await mount({ applied: [charmed!], disabled: true })

    await options(component)[0]!.trigger('click')
    await options(component)[1]!.trigger('click')

    expect(component.find('[test-id="pending"]').exists()).toBe(false)
    expect(component.emitted('remove')).toBeUndefined()
  })

  it('Should drop the pick when it becomes disabled', async () => {
    const component = await mount()

    await options(component)[0]!.trigger('click')
    await component.setProps({ disabled: true })

    expect(component.find('[test-id="pending"]').exists()).toBe(false)
  })
})
