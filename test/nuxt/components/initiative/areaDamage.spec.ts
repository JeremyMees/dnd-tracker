import { resetToast, toast } from '~~/test/nuxt/stubs/toast'
import { DOMWrapper, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AreaDamage from '~/components/initiative/AreaDamage.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet as sheetFixture } from '~~/test/fixtures/initiative-sheet'
import { settle, submitForm } from '~~/test/nuxt/stubs/form'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const goblin: InitiativeSheetRow = {
  id: 'goblin',
  index: 0,
  initiative: 15,
  name: 'Goblin',
  type: 'monster',
  conditions: [],
  hitPoints: 20,
  maxHitPoints: 20,
  savingThrows: { dexterity: 2 } as DndSavingThrowBonuses,
}

const imp: InitiativeSheetRow = {
  id: 'imp',
  index: 1,
  initiative: 12,
  name: 'Imp',
  type: 'monster',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 10,
  resistancesAndImmunities: {
    damageImmunities: ['fire'],
    damageResistances: ['cold'],
    damageVulnerabilities: ['radiant'],
    conditionImmunities: [],
  },
}

const elara: InitiativeSheetRow = {
  id: 'elara',
  index: 2,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 30,
  maxHitPoints: 30,
}

const lair: InitiativeSheetRow = {
  id: 'lair',
  index: 3,
  initiative: 20,
  name: 'Lair',
  type: 'lair',
  conditions: [],
}

const statue: InitiativeSheetRow = {
  id: 'statue',
  index: 4,
  initiative: 1,
  name: 'Statue',
  type: 'npc',
  conditions: [],
}

const patchRows = vi.fn()
const sheet = ref<InitiativeSheet | undefined>()

let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

const breath: DndAction = {
  name: 'Fire Breath',
  desc: '',
  attacks: [],
  actionType: 'action',
  usageLimits: { type: 'recharge', param: 5 },
}

const dragon: InitiativeSheetRow = {
  id: 'dragon',
  index: 5,
  initiative: 22,
  name: 'Dragon',
  type: 'monster',
  conditions: [],
  actions: [breath],
}

const prefill: AreaDamagePrefill = {
  values: {
    amount: 30,
    damageType: 'cold',
    dc: 13,
    ability: 'dexterity',
    halfOnSave: false,
  },
  source: { rowId: 'dragon', action: 'Fire Breath' },
}

async function mountWithPrefill(value: AreaDamagePrefill = prefill) {
  const component = await mount(false)

  await component.setProps({ open: true, prefill: value })
  await flushPromises()

  return component
}

async function mount(open = true) {
  wrapper = await mountWithTooltips(AreaDamage, {
    props: { open, 'onUpdate:open': vi.fn() },
    global: {
      provide: { [INITIATIVE_SHEET]: { sheet, patchRows } },
    },
  })

  return wrapper
}

function body() {
  return new DOMWrapper(document.body)
}

function target(id: string) {
  const index = ['goblin', 'imp', 'elara'].indexOf(id)

  return body().findAll('[test-id="target"]')[index]!
}

async function pick(...ids: string[]): Promise<void> {
  for (const id of ids) {
    await target(id).get('[test-id="select"]').trigger('click')
  }

  await flushPromises()
}

async function setDamageType(type: DndDamageType): Promise<void> {
  wrapper!
    .findAllComponents({ name: 'SelectRoot' })[0]!
    .vm.$emit('update:modelValue', type)
  await flushPromises()
}

async function fill(amount: number, dc?: number): Promise<void> {
  await body().get('input[name="amount"]').setValue(amount)
  if (dc) await body().get('[test-id="dc"]').setValue(dc)
  await flushPromises()
}

function damageText(id: string): string {
  return target(id).get('[test-id="damage"]').text()
}

describe('Initiative area damage', () => {
  beforeEach(() => {
    resetToast()
    patchRows.mockReset().mockResolvedValue(undefined)
    sheet.value = {
      ...sheetFixture,
      rows: [goblin, imp, elara, lair, statue, dragon],
    }
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
  })

  it('lists only creatures with hit points', async () => {
    await mount()

    expect(
      body()
        .findAll('[test-id="target"]')
        .map(row => row.text()),
    ).toEqual([
      expect.stringContaining('Goblin'),
      expect.stringContaining('Imp'),
      expect.stringContaining('Elara'),
    ])
  })

  it('disables apply until a target is picked', async () => {
    await mount()

    expect(body().get('[test-id="apply"]').attributes('disabled')).toBeDefined()

    await pick('goblin')

    expect(
      body().get('[test-id="apply"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('deals full damage to every picked target without a save', async () => {
    const component = await mount()

    await pick('goblin', 'elara')
    await fill(12)
    await submitForm(body())

    expect(patchRows).toHaveBeenCalledOnce()
    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'goblin', patch: { hitPoints: 8 } },
      { rowId: 'elara', patch: { hitPoints: 18 } },
    ])
    expect(component.emitted('update:open')).toEqual([[false]])
  })

  it('rolls monster saves and halves the damage on a success', async () => {
    await mount()

    await pick('goblin', 'imp')
    await fill(12, 13)

    expect(target('goblin').get('[test-id="roll"]').text()).toBe('13')
    expect(target('imp').get('[test-id="roll"]').text()).toBe('11')
    expect(damageText('goblin')).toBe('6')
    expect(damageText('imp')).toBe('12')

    await submitForm(body())

    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'goblin', patch: { hitPoints: 14 } },
      { rowId: 'imp', patch: { hitPoints: 0 } },
    ])
  })

  it('deals no damage on a success when half damage is off', async () => {
    await mount()

    await pick('goblin')
    await fill(12, 13)
    await body().get('[test-id="half-on-save"]').trigger('click')
    await flushPromises()

    expect(damageText('goblin')).toBe('0')
  })

  it('rerolls a monster save', async () => {
    await mount()

    await pick('goblin')
    await fill(12, 13)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    await target('goblin').get('[test-id="reroll"]').trigger('click')
    await settle()

    expect(target('goblin').get('[test-id="roll"]').text()).toBe('3')
    expect(damageText('goblin')).toBe('12')
    expect(patchRows).not.toHaveBeenCalled()
  })

  it('asks players to roll their own save', async () => {
    await mount()

    await pick('elara')

    expect(body().find('[test-id="ask-players"]').exists()).toBe(false)

    await fill(12, 15)

    expect(body().get('[test-id="ask-players"]').text()).toBe(
      'components.areaDamage.askPlayers',
    )
    expect(target('elara').find('[test-id="roll"]').exists()).toBe(false)
    expect(target('elara').find('[test-id="reroll"]').exists()).toBe(false)
    expect(damageText('elara')).toBe('12')
  })

  it('does not ask anyone to roll when only monsters are picked', async () => {
    await mount()

    await pick('goblin')
    await fill(12, 15)

    expect(body().find('[test-id="ask-players"]').exists()).toBe(false)
  })

  it('halves damage when a player saved', async () => {
    await mount()

    await pick('elara')
    await fill(12, 15)
    await target('elara').get('[test-id="saved"]').trigger('click')
    await flushPromises()

    expect(damageText('elara')).toBe('6')

    await submitForm(body())

    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'elara', patch: { hitPoints: 24 } },
    ])
  })

  it('marks a monster as failed when its save is flipped', async () => {
    await mount()

    await pick('goblin')
    await fill(12, 13)
    await target('goblin').get('[test-id="saved"]').trigger('click')
    await flushPromises()

    expect(damageText('goblin')).toBe('12')
  })

  it('skips an immune target', async () => {
    await mount()

    await pick('goblin', 'imp')
    await fill(10)
    await setDamageType('fire')

    expect(target('imp').get('[test-id="defense"]').text()).toBe(
      'components.areaDamage.defense.immune',
    )
    expect(damageText('imp')).toBe('0')

    await submitForm(body())

    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'goblin', patch: { hitPoints: 10 } },
    ])
  })

  it.each([
    ['cold', 'resistant', '5'],
    ['radiant', 'vulnerable', '20'],
  ] as const)('applies %s damage as %s', async (type, label, amount) => {
    await mount()

    await pick('imp')
    await fill(10)
    await setDamageType(type)

    expect(target('imp').get('[test-id="defense"]').text()).toBe(
      `components.areaDamage.defense.${label}`,
    )
    expect(damageText('imp')).toBe(amount)
  })

  it('shows a dash for targets that are not picked', async () => {
    await mount()

    await fill(10)

    expect(damageText('goblin')).toBe('–')
  })

  it('starts from the defaults again when it is reopened', async () => {
    const component = await mount()

    await pick('goblin')
    await fill(12, 13)
    await body().get('[test-id="half-on-save"]').trigger('click')

    await component.setProps({ open: false })
    await flushPromises()
    await component.setProps({ open: true })
    await flushPromises()

    expect(
      body().get('[test-id="half-on-save"]').attributes('aria-checked'),
    ).toBe('true')
    expect(body().get('[test-id="ability"]').text()).toBe('DEX')
    expect(
      target('goblin').get('[test-id="select"]').attributes('aria-checked'),
    ).toBe('false')
  })

  it('fills in the prefilled values when it opens', async () => {
    await mountWithPrefill()

    expect(
      (body().get('input[name="amount"]').element as HTMLInputElement).value,
    ).toBe('30')
    expect(
      (body().get('[test-id="dc"]').element as HTMLInputElement).value,
    ).toBe('13')
    expect(
      body().get('[test-id="half-on-save"]').attributes('aria-checked'),
    ).toBe('false')

    await pick('goblin', 'imp')

    expect(damageText('goblin')).toBe('0')
    expect(target('imp').get('[test-id="defense"]').text()).toBe(
      'components.areaDamage.defense.resistant',
    )
    expect(damageText('imp')).toBe('15')
  })

  it('marks the source action as used when the damage is applied', async () => {
    await mountWithPrefill()

    expect(
      body().get('[test-id="mark-used-checkbox"]').attributes('aria-checked'),
    ).toBe('true')

    await pick('imp')
    await submitForm(body())

    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'imp', patch: { hitPoints: 0 } },
      {
        rowId: 'dragon',
        patch: { resources: { actions: { 'Fire Breath': 1 } } },
      },
    ])
  })

  it('folds the used action into the damage of a source that is also a target', async () => {
    sheet.value = {
      ...sheet.value!,
      rows: [
        goblin,
        imp,
        elara,
        { ...dragon, hitPoints: 100, maxHitPoints: 100 },
      ],
    }
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await mountWithPrefill()

    await pick('imp')
    await body()
      .findAll('[test-id="target"]')[3]!
      .get('[test-id="select"]')
      .trigger('click')
    await settle()
    await submitForm(body())

    const [patches] = patchRows.mock.calls[0]! as [RowPatch[]]
    const dragonPatches = patches.filter(({ rowId }) => rowId === 'dragon')

    expect(dragonPatches).toHaveLength(1)
    expect(dragonPatches[0]!.patch).toMatchObject({
      hitPoints: expect.any(Number),
      resources: { actions: { 'Fire Breath': 1 } },
    })
  })

  it('leaves the source action alone when marking it is unticked', async () => {
    await mountWithPrefill()

    await body().get('[test-id="mark-used-checkbox"]').trigger('click')
    await pick('imp')
    await submitForm(body())

    expect(patchRows).toHaveBeenCalledWith([
      { rowId: 'imp', patch: { hitPoints: 0 } },
    ])
  })

  it('warns when the source action has no uses left', async () => {
    sheet.value = {
      ...sheet.value!,
      rows: [
        goblin,
        imp,
        elara,
        { ...dragon, resources: { actions: { 'Fire Breath': 1 } } },
      ],
    }

    await mountWithPrefill()

    expect(body().find('[test-id="mark-used"]').exists()).toBe(false)
    expect(body().get('[test-id="used-up"]').text()).toBe(
      'components.areaDamage.usedUp',
    )
  })

  it('does not offer to mark an unlimited action as used', async () => {
    sheet.value = {
      ...sheet.value!,
      rows: [
        goblin,
        imp,
        elara,
        { ...dragon, actions: [{ ...breath, usageLimits: undefined }] },
      ],
    }

    await mountWithPrefill()

    expect(body().find('[test-id="mark-used"]').exists()).toBe(false)
    expect(body().find('[test-id="used-up"]').exists()).toBe(false)
  })

  it('shows the concentration toast of a damaged target', async () => {
    await mount()

    sheet.value = {
      ...sheet.value!,
      rows: [{ ...goblin, concentration: true }, imp, elara],
    }
    await flushPromises()

    await pick('goblin')
    await fill(10)
    await submitForm(body())

    expect(toast.info).toHaveBeenCalled()
  })

  it('shows an error when the damage could not be applied', async () => {
    const component = await mount()

    patchRows.mockRejectedValue(new Error('Boom'))

    await pick('goblin')
    await fill(10)
    await submitForm(body())

    expect(body().text()).toContain('Boom')
    expect(component.emitted('update:open')).toBeUndefined()
  })
})
