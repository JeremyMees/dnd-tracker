import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ConditionDuration from '~/components/form/ConditionDuration.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { isHidden } from '~~/test/nuxt/stubs/form'

interface ConditionDurationVM {
  form: { setValues: (values: Record<string, unknown>) => void }
  onSubmit: () => Promise<void>
}

const item = sheet.rows[0]!
const active = sheet.rows[1]!
const prone: DndCondition = { id: 'prone', name: 'Prone', desc: 'Down.' }

let wrapper: VueWrapper | undefined

async function mount(
  condition: DndCondition = prone,
  allowNone = false,
): Promise<VueWrapper> {
  wrapper = await mountSuspended(ConditionDuration, {
    props: {
      item,
      condition,
      rows: sheet.rows,
      activeRowId: active.id,
      allowNone,
    },
  })

  return wrapper
}

async function submit(
  component: VueWrapper,
  values: Record<string, unknown>,
): Promise<void> {
  const vm = component.vm as unknown as ConditionDurationVM

  await component.get('[test-id="custom"]').trigger('click')
  vm.form.setValues(values)
  await vm.onSubmit()
  await flushPromises()
}

describe('ConditionDuration', () => {
  afterEach(() => {
    wrapper?.unmount()
  })

  it.each([
    ['endOfNextTurn', { rowId: item.id, timing: 'end', rounds: 1 }],
    ['startOfNextTurn', { rowId: active.id, timing: 'start', rounds: 1 }],
    ['oneMinute', { rowId: active.id, timing: 'start', rounds: 10 }],
  ])('Should emit the %s preset', async (preset, duration) => {
    const component = await mount()

    await component.get(`[test-id="preset-${preset}"]`).trigger('click')

    expect(component.emitted('update')).toEqual([[duration]])
  })

  it('Should hide the custom form until custom is pressed', async () => {
    const component = await mount()
    const toggle = component.get('[test-id="custom"]')
    const form = component.get('[test-id="custom-form"]')

    expect(isHidden(form.element)).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')

    expect(isHidden(form.element)).toBe(false)
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await toggle.trigger('click')

    expect(isHidden(form.element)).toBe(true)
  })

  it('Should emit a custom duration with rounds', async () => {
    const component = await mount()

    await submit(component, { rounds: 3, timing: 'start', rowId: active.id })

    expect(component.emitted('update')).toEqual([
      [{ rowId: active.id, timing: 'start', rounds: 3 }],
    ])
  })

  it('Should emit a custom duration that ends on a save', async () => {
    const component = await mount()

    await submit(component, { ability: 'wisdom', dc: 14 })

    expect(component.emitted('update')).toEqual([
      [
        {
          rowId: item.id,
          timing: 'end',
          save: { ability: 'wisdom', dc: 14 },
        },
      ],
    ])
  })

  it('Should not emit without rounds or a save', async () => {
    const component = await mount()

    await submit(component, {})

    expect(component.emitted('update')).toBeUndefined()
  })

  it('Should not emit a save without a dc', async () => {
    const component = await mount()

    await submit(component, { ability: 'wisdom' })

    expect(component.emitted('update')).toBeUndefined()
  })

  it('Should start from the existing duration', async () => {
    const component = await mount({
      ...prone,
      duration: {
        rowId: active.id,
        timing: 'start',
        rounds: 4,
        save: { ability: 'charisma', dc: 12 },
      },
    })

    await submit(component, {})

    expect(component.emitted('update')).toEqual([
      [
        {
          rowId: active.id,
          timing: 'start',
          rounds: 4,
          save: { ability: 'charisma', dc: 12 },
        },
      ],
    ])
  })

  it('Should only offer to clear an existing duration', async () => {
    const component = await mount()

    expect(component.find('[test-id="clear"]').exists()).toBe(false)
  })

  it('Should offer no duration first while adding and emit null for it', async () => {
    const component = await mount(prone, true)

    await component.get('[test-id="none"]').trigger('click')

    expect(component.emitted('update')).toEqual([[null]])
    expect(component.find('[test-id="clear"]').exists()).toBe(false)
  })

  it('Should not offer no duration outside of adding', async () => {
    const component = await mount()

    expect(component.find('[test-id="none"]').exists()).toBe(false)
  })

  it('Should emit null when the duration is cleared', async () => {
    const component = await mount({
      ...prone,
      duration: { rowId: item.id, timing: 'end', rounds: 1 },
    })

    await component.get('[test-id="clear"]').trigger('click')

    expect(component.emitted('update')).toEqual([[null]])
  })
})
