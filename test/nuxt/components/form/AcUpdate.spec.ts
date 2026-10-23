import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AcUpdate from '~/components/form/AcUpdate.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn()

const item = sheet.rows[0]!

type AcAction = Extract<DndAcType, 'add' | 'temp' | 'remove'>

const buttons: Record<AcAction, number> = { add: 0, temp: 1, remove: 2 }

function mountAcUpdate() {
  return mountSuspended(AcUpdate, { props: { item, apply } })
}

async function submitAs(
  component: Awaited<ReturnType<typeof mountAcUpdate>>,
  type: AcAction,
  amount = 5,
) {
  const submits = component.findAll('button[type="submit"]')

  await component.get('input[name="amount"]').setValue(amount)
  await submits[buttons[type]!]!.trigger('click')
  await submitForm(component)
}

describe('AcUpdate', () => {
  beforeEach(() => {
    apply.mockReset()
    apply.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountAcUpdate()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the dice roll input and the three actions', async () => {
    const component = await mountAcUpdate()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.findAll('button[type="submit"]')).toHaveLength(3)
    expect(component.text()).toContain('actions.increase')
    expect(component.text()).toContain('actions.temp')
    expect(component.text()).toContain('actions.decrease')
  })

  it('Should increase the AC', async () => {
    const component = await mountAcUpdate()

    await submitAs(component, 'add', 3)

    expect(apply).toHaveBeenCalledWith({ type: 'add', amount: 3 })
  })

  it('Should add temporary AC', async () => {
    const component = await mountAcUpdate()

    await submitAs(component, 'temp', 4)

    expect(apply).toHaveBeenCalledWith({ type: 'temp', amount: 4 })
  })

  it('Should decrease the AC', async () => {
    const component = await mountAcUpdate()

    await submitAs(component, 'remove', 6)

    expect(apply).toHaveBeenCalledWith({ type: 'remove', amount: 6 })
  })

  it('Should decrease by default when the form is submitted directly', async () => {
    const component = await mountAcUpdate()

    await component.get('input[name="amount"]').setValue(2)
    await submitForm(component)

    expect(apply).toHaveBeenCalledWith({ type: 'remove', amount: 2 })
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountAcUpdate()

    await submitAs(component, 'add', 1001)

    expect(apply).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    apply.mockRejectedValue(new Error('Update failed'))

    const component = await mountAcUpdate()

    await submitAs(component, 'add')

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    apply.mockRejectedValue({})

    const component = await mountAcUpdate()

    await submitAs(component, 'add')

    expect(component.text()).toContain('An error occurred while updating AC')
  })
})
