import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import CreateButton from '~/components/atoms/CreateButton'

interface Props {
  allowCreate: boolean
  disabled?: boolean
  loading?: boolean
}

const props: Props = {
  allowCreate: true,
}

describe('CreateButton', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(CreateButton, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render with default props correctly', async () => {
    const component = await mountSuspended(CreateButton, { props })
    const button = component.find('button')

    expect(button.exists()).toBeTruthy()
    expect(button.text()).toBe('actions.create')
    expect(button.attributes('aria-label')).toBe('actions.create')
  })

  it('Should render disabled when disabled prop is true', async () => {
    const component = await mountSuspended(CreateButton, { props: { ...props, disabled: true } })
    const button = component.find('button')

    await button.trigger('click')
    await nextTick()

    expect(component.emitted('create')).toBeFalsy()
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('Should render a loading state', async () => {
    const component = await mountSuspended(CreateButton, { props: { ...props, loading: true } })

    expect(component.find('[data-test-skeleton]').exists()).toBeTruthy()
    expect(component.find('button').exists()).toBeFalsy()
  })

  it('Should emit create event when clicked and allowed', async () => {
    const component = await mountSuspended(CreateButton, { props })

    await component.find('button').trigger('click')

    const emitted = component.emitted('create')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
  })

  it('Should emit hitLimit event when clicked but not allowed', async () => {
    const component = await mountSuspended(CreateButton, { props: { allowCreate: false } })

    await component.find('button').trigger('click')
    await nextTick()

    const emitted = component.emitted('hitLimit')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
  })
})
