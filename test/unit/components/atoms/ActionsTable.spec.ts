import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ActionsTable from '~/components/atoms/ActionsTable.vue'

interface Props {
  actions?: (Action | ActionOpen5E)[]
  reactions?: (Action | ActionOpen5E)[]
  legendaryActions?: (Action | ActionOpen5E)[]
  specialAbilities?: (Action | ActionOpen5E)[]
}

const props: Props = {
  actions: [
    {
      name: 'Test Action',
      desc: 'Test Description',
      type: 'actions',
      attack_bonus: 10,
      damage_bonus: 10,
      damage_dice: '1d10',
    },
  ],
}

describe('ActionsTable', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ActionsTable, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render actions correctly', async () => {
    const component = await mountSuspended(ActionsTable, { props })

    expect(component.html()).toContain('Test Action')
    expect(component.html()).toContain('Test Description')
    expect(component.html()).toContain('To hit')
    expect(component.html()).toContain('+10')
    expect(component.html()).toContain('Dice')
    expect(component.html()).toContain('1d10')
  })
})
