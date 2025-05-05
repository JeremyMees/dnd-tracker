import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import * as dndHelpers from '~/utils/dnd-helpers'
import FantasyNameGenerator from '~/components/atoms/FantasyNameGenerator.vue'

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

describe('FantasyNameGenerator', async () => {
  it('Should match snapshot', async () => {
    vi.spyOn(dndHelpers, 'randomName').mockReturnValue('Test Name')

    const component = await mountSuspended(FantasyNameGenerator, { props })
    expect(component.html()).toMatchSnapshot()

    vi.restoreAllMocks()
  })

  it('Should render actions correctly', async () => {
    const component = await mountSuspended(FantasyNameGenerator, { props })
    const names = component.findAll('li')

    expect(names.length).toBe(props.amount)
  })

  it('Should generate new names when button is clicked', async () => {
    const component = await mountSuspended(FantasyNameGenerator, { props })

    const initialName = component.find('li').text()

    const generateButton = component.find('[data-test-generate]')
    await generateButton.trigger('click')
    await nextTick()

    const newName = component.find('li').text()

    expect(newName).not.toBe(initialName)
  })

  it('Should copy name when clicked', async () => {
    const component = await mountSuspended(FantasyNameGenerator, { props })

    const name = component.find('li')

    await name.trigger('click')
    await nextTick()

    expect(mockClipboard).toHaveBeenCalled()
  })
})
