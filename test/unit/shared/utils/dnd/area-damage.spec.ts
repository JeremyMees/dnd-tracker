import { describe, expect, it } from 'vitest'

const defenses: DndResistancesAndImmunities = {
  damageImmunities: ['poison'],
  damageResistances: ['fire'],
  damageVulnerabilities: ['cold'],
  conditionImmunities: [],
}

const scores: DndAbilityScores = {
  strength: 10,
  dexterity: 14,
  constitution: 12,
  intelligence: 8,
  wisdom: 10,
  charisma: 6,
}

describe('saveBonus', () => {
  it('uses the saving throw bonus first', () => {
    expect(
      saveBonus(
        {
          savingThrows: { dexterity: 5 } as DndSavingThrowBonuses,
          modifiers: { dexterity: 2 } as DndModifiers,
        },
        'dexterity',
      ),
    ).toBe(5)
  })

  it('falls back to the ability modifier', () => {
    expect(
      saveBonus({ modifiers: { dexterity: 2 } as DndModifiers }, 'dexterity'),
    ).toBe(2)
  })

  it('falls back to the ability score', () => {
    expect(saveBonus({ abilityScores: scores }, 'charisma')).toBe(-2)
  })

  it('is 0 without any stats', () => {
    expect(saveBonus({}, 'wisdom')).toBe(0)
  })
})

describe('rollSave', () => {
  it('adds the save bonus to a d20', () => {
    const sides: number[] = []

    const total = rollSave({ abilityScores: scores }, 'dexterity', side => {
      sides.push(side)
      return 11
    })

    expect(sides).toEqual([20])
    expect(total).toBe(13)
  })
})

describe('rollsOwnSave', () => {
  it('lets players roll their own saves', () => {
    expect(rollsOwnSave({ type: 'player' })).toBe(true)
  })

  it.each(['monster', 'npc', 'summon'] as const)(
    'rolls saves for a %s',
    type => {
      expect(rollsOwnSave({ type })).toBe(false)
    },
  )
})

describe('damageDefense', () => {
  it.each([
    ['poison', 'immune'],
    ['fire', 'resistant'],
    ['cold', 'vulnerable'],
    ['acid', undefined],
  ] as const)('maps %s damage to %s', (type, defense) => {
    expect(damageDefense({ resistancesAndImmunities: defenses }, type)).toBe(
      defense,
    )
  })

  it('has no defense without a damage type', () => {
    expect(
      damageDefense({ resistancesAndImmunities: defenses }),
    ).toBeUndefined()
  })

  it('has no defense without resistances', () => {
    expect(damageDefense({}, 'fire')).toBeUndefined()
  })
})

describe('areaDamageAmount', () => {
  it('deals full damage on a failed save', () => {
    expect(areaDamageAmount(25, { saved: false, halfOnSave: true })).toBe(25)
  })

  it('halves damage on a successful save, rounding down', () => {
    expect(areaDamageAmount(25, { saved: true, halfOnSave: true })).toBe(12)
  })

  it('deals no damage on a successful save without half damage', () => {
    expect(areaDamageAmount(25, { saved: true, halfOnSave: false })).toBe(0)
  })

  it('deals no damage to an immune target', () => {
    expect(
      areaDamageAmount(25, {
        saved: false,
        halfOnSave: true,
        defense: 'immune',
      }),
    ).toBe(0)
  })

  it('halves the saved damage again for a resistant target', () => {
    expect(
      areaDamageAmount(25, {
        saved: true,
        halfOnSave: true,
        defense: 'resistant',
      }),
    ).toBe(6)
  })

  it('doubles the damage for a vulnerable target', () => {
    expect(
      areaDamageAmount(25, {
        saved: true,
        halfOnSave: true,
        defense: 'vulnerable',
      }),
    ).toBe(24)
  })
})

describe('applyDefense', () => {
  it.each([
    [undefined, 9],
    ['immune', 0],
    ['resistant', 4],
    ['vulnerable', 18],
  ] as const)('applies %s to the damage', (defense, amount) => {
    expect(applyDefense(9, defense)).toBe(amount)
  })
})

describe('damageAfterDefenses', () => {
  it('applies the defense of each damage type separately', () => {
    expect(
      damageAfterDefenses({ resistancesAndImmunities: defenses }, [
        { amount: 9, type: 'fire' },
        { amount: 5, type: 'cold' },
        { amount: 7, type: 'poison' },
        { amount: 3 },
      ]),
    ).toBe(17)
  })

  it('deals the full damage without resistances', () => {
    expect(damageAfterDefenses({}, [{ amount: 9, type: 'fire' }])).toBe(9)
  })
})

describe('damageDefenses', () => {
  it('lists only the damage types the target defends against', () => {
    expect(
      damageDefenses({ resistancesAndImmunities: defenses }, [
        { amount: 9, type: 'fire' },
        { amount: 5, type: 'acid' },
        { amount: 3 },
      ]),
    ).toEqual([{ type: 'fire', defense: 'resistant' }])
  })
})
