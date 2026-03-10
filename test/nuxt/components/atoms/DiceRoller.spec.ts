import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import DiceRoller from '~/components/atoms/DiceRoller'

interface Props { styled?: boolean }

const props: Props = { styled: true }

describe('DiceRoller', () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(DiceRoller, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render dice rollers correctly', async () => {
    const component = await mountSuspended(DiceRoller, { props })

    expect(component.html()).toContain('d4')
    expect(component.html()).toContain('d6')
    expect(component.html()).toContain('d8')
    expect(component.html()).toContain('d10')
    expect(component.html()).toContain('d12')
    expect(component.html()).toContain('d20')
    expect(component.html()).toContain('d100')
  })
})
