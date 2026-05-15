import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ActionsTable from '~/components/atoms/ActionsTable.vue'

interface Props {
  actions: DndAction[]
}

const props: Props = {
  actions: [
    {
      name: 'Test Action',
      desc: 'Test Description',
      actionType: 'action',
      attacks: [
        {
          name: 'Test Attack',
          attackType: 'melee',
          toHitMod: 10,
          distanceUnit: 'feet',
          damageDieCount: 1,
          damageDieType: 'd10',
          damageBonus: 10,
        },
      ],
    },
  ],
}

const baseAttack: DndAttack = {
  name: 'Test Attack',
  attackType: 'melee',
  toHitMod: 10,
  distanceUnit: 'feet',
  damageDieCount: 1,
  damageDieType: 'd10',
  damageBonus: 10,
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

  it('Should not show attack name label when there is only one attack', async () => {
    const component = await mountSuspended(ActionsTable, { props })

    expect(component.text()).not.toContain('Test Attack')
  })

  it('Should show attack name when action has multiple attacks', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...props.actions[0]!,
          attacks: [
            { ...baseAttack, name: 'Claw' },
            { ...baseAttack, name: 'Bite' },
          ],
        }],
      },
    })

    expect(component.html()).toMatchSnapshot()
    expect(component.text()).toContain('Claw')
    expect(component.text()).toContain('Bite')
  })

  it('Should fall back to Attack N when attack has no name', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...props.actions[0]!,
          attacks: [
            { ...baseAttack, name: '' },
            { ...baseAttack, name: '' },
          ],
        }],
      },
    })

    expect(component.text()).toContain('Attack 1')
    expect(component.text()).toContain('Attack 2')
  })
})
