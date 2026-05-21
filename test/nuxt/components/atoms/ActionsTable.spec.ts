import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ActionsTable from '~/components/atoms/ActionsTable.vue'

const baseAttack: DndAttack = {
  name: 'Test Attack',
  attackType: 'melee',
  toHitMod: 10,
  distanceUnit: 'feet',
  damageDieCount: 1,
  damageDieType: 'd10',
  damageBonus: 10,
}

const baseAction: DndAction = {
  name: 'Test Action',
  desc: 'Test Description',
  actionType: 'action',
  attacks: [baseAttack],
}

describe('ActionsTable', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ActionsTable, { props: { actions: [baseAction] } })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render actions correctly', async () => {
    const component = await mountSuspended(ActionsTable, { props: { actions: [baseAction] } })

    expect(component.html()).toContain('Test Action')
    expect(component.html()).toContain('Test Description')
    expect(component.html()).toContain('To hit')
    expect(component.html()).toContain('+10')
    expect(component.html()).toContain('Damage')
    expect(component.html()).toContain('1d10')
  })

  it('Should not show attack name label when there is only one attack', async () => {
    const component = await mountSuspended(ActionsTable, { props: { actions: [baseAction] } })

    expect(component.text()).not.toContain('Test Attack')
  })

  it('Should show attack name when action has multiple attacks', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...baseAction,
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
          ...baseAction,
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

  it('Should show reach for melee attacks', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{ ...baseAction, attacks: [{ ...baseAttack, reach: 5 }] }],
      },
    })

    expect(component.text()).toContain('Reach')
    expect(component.text()).toContain('5 ft')
  })

  it('Should show range with long range for ranged attacks', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...baseAction,
          attacks: [{ ...baseAttack, attackType: 'ranged', range: 80, longRange: 320 }],
        }],
      },
    })

    expect(component.text()).toContain('Range')
    expect(component.text()).toContain('80/320 ft')
  })

  it('Should show spell save DC and ability', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...baseAction,
          attacks: [{ ...baseAttack, spellSave: 15, spellSaveType: 'wisdom' }],
        }],
      },
    })

    expect(component.text()).toContain('Save')
    expect(component.text()).toContain('DC 15')
    expect(component.text()).toContain('wisdom')
  })

  it('Should show target creature only label', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{ ...baseAction, attacks: [{ ...baseAttack, targetCreatureOnly: true }] }],
      },
    })

    expect(component.text()).toContain('components.actionsTable.oneTarget)')
  })

  it('Should show extra damage', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...baseAction,
          attacks: [{
            ...baseAttack,
            extraDamageDieCount: 2,
            extraDamageDieType: 'd6',
            extraDamageType: 'fire',
          }],
        }],
      },
    })

    expect(component.text()).toContain('2d6')
    expect(component.text()).toContain('fire')
  })

  it('Should show legendary action cost', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [{
          ...baseAction,
          actionType: 'legendaryAction',
          legendaryActionCost: 2,
        }],
      },
    })

    expect(component.text()).toContain('components.actionsTable.cost')
    expect(component.text()).toContain('general.legendaryAction')
  })

  it('Should show usage limits', async () => {
    const perDay = await mountSuspended(ActionsTable, {
      props: { actions: [{ ...baseAction, usageLimits: { type: 'perDay', param: 3 } }] },
    })
    expect(perDay.text()).toContain('3/day')

    const recharge = await mountSuspended(ActionsTable, {
      props: { actions: [{ ...baseAction, usageLimits: { type: 'recharge', param: 5 } }] },
    })
    expect(recharge.text()).toContain('Recharge 5-6')

    const atWill = await mountSuspended(ActionsTable, {
      props: { actions: [{ ...baseAction, usageLimits: { type: 'atWill', param: 1 } }] },
    })
    expect(atWill.text()).toContain('At will')

    const perRest = await mountSuspended(ActionsTable, {
      props: { actions: [{ ...baseAction, usageLimits: { type: 'perRest', param: 2 } }] },
    })
    expect(perRest.text()).toContain('2/rest')
  })

  it('Should show no actions message when actions array is empty', async () => {
    const component = await mountSuspended(ActionsTable, { props: { actions: [] } })

    expect(component.text()).toContain('components.encounterTable.noActions')
  })

  it('Should group actions by type', async () => {
    const component = await mountSuspended(ActionsTable, {
      props: {
        actions: [
          { ...baseAction, actionType: 'action', name: 'Strike' },
          { ...baseAction, actionType: 'reaction', name: 'Parry' },
        ],
      },
    })

    const html = component.html()
    expect(html).toContain('general.action')
    expect(html).toContain('general.reaction')
    expect(html).toContain('Strike')
    expect(html).toContain('Parry')
  })
})
