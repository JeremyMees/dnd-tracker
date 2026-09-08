import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import FantasyNameGenerator from '~/components/atoms/FantasyNameGenerator.vue'
import { clearQueryCache } from '~~/test/nuxt/stubs/query-client'
import {
  flushNames,
  holdNextNames,
  nameRequests,
} from '~~/test/nuxt/stubs/names'

interface Props {
  amount: number
}

const props: Props = {
  amount: 10,
}

const mockClipboard = vi.fn()

mockNuxtImport('useClipboard', () => () => ({
  copy: mockClipboard,
}))

function skeletons(component: { findAll: VueWrapper['findAll'] }) {
  return component.findAll('.animate-pulse')
}

async function mountGenerator(
  overrides: Partial<Props & { compact: boolean }> = {},
) {
  const component = await mountSuspended(FantasyNameGenerator, {
    props: { ...props, ...overrides },
  })

  await flushNames()

  return component
}

describe('FantasyNameGenerator', async () => {
  beforeEach(async () => {
    nameRequests.length = 0
    await clearQueryCache()
  })

  it('Should match snapshot', async () => {
    const component = await mountGenerator()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show the skeleton until the names arrive', async () => {
    const release = holdNextNames()

    const component = await mountSuspended(FantasyNameGenerator, { props })

    expect(skeletons(component).length).toBe(props.amount)

    release()

    await vi.waitFor(() => expect(skeletons(component).length).toBe(0))
  })

  it('Should render items correctly', async () => {
    const component = await mountGenerator()
    const names = component.findAll('li')

    expect(names.length).toBe(props.amount)
    names.forEach(name => expect(name.text()).toMatch(/^Test Name/))
  })

  it('Should ask the endpoint for the requested amount', async () => {
    await mountGenerator({ amount: 30 })

    expect(nameRequests[0]).toEqual({ amount: '30' })
  })

  it('Should generate new names when button is clicked', async () => {
    const component = await mountGenerator()

    const initialName = component.find('li').text()

    await component.find('[test-id="generate"]').trigger('click')
    await flushNames()

    expect(component.find('li').text()).not.toBe(initialName)
  })

  it('Should copy name when clicked', async () => {
    const component = await mountGenerator()

    await component.find('li').trigger('click')
    await nextTick()

    expect(mockClipboard).toHaveBeenCalled()
  })

  it('Should regenerate names when the race select changes', async () => {
    const component = await mountGenerator()

    const raceSelect = component.findAllComponents({ name: 'SelectRoot' })[0]!
    await raceSelect.vm.$emit('update:modelValue', 'elf')
    await flushNames()

    expect(nameRequests.length).toBe(2)
    expect(nameRequests[1]).toEqual({ amount: '10', race: 'elf' })
  })

  it('Should regenerate names when the gender select changes', async () => {
    const component = await mountGenerator()

    const genderSelect = component.findAllComponents({ name: 'SelectRoot' })[1]!
    await genderSelect.vm.$emit('update:modelValue', 'female')
    await flushNames()

    expect(nameRequests.length).toBe(2)
    expect(nameRequests[1]).toEqual({ amount: '10', gender: 'female' })
  })

  it('Should show everything when not in compact mode', async () => {
    const component = await mountGenerator()

    const labels = component.findAll('[test-id="label"]')
    const actions = component.find('[test-id="actions"]')
    const name = component.find('li')
    const columns = component.findAll('.flex.flex-col.gap-1')

    expect(labels.length).toBe(2)
    expect(actions.classes()).toContain('flex-col')
    expect(name.classes()).not.toContain('text-sm')
    expect(columns.length).toBe(2)
  })

  it('Should hide items in compact mode', async () => {
    const component = await mountGenerator({ compact: true })

    const labels = component.findAll('[test-id="label"]')
    const actions = component.find('[test-id="actions"]')
    const name = component.find('li')
    const columns = component.findAll('.flex.flex-col.gap-1')

    expect(labels.length).toBe(0)
    expect(actions.classes()).not.toContain('flex-col')
    expect(name.classes()).toContain('text-sm')
    expect(columns.length).toBe(1)
  })
})
