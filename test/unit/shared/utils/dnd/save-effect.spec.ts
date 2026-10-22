import { describe, expect, it } from 'vitest'

const breath2024 =
  'Dexterity Saving Throw: DC 21, each creature in a 60-foot Cone. Failure: 59 (17d6) Fire damage. Success: Half damage.'

const breath2014 =
  'The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 59 (17d6) fire damage on a failed save, or half as much damage on a successful one.'

const attack: DndAttack = {
  name: 'Fireball',
  attackType: 'rangedSpell',
  distanceUnit: 'feet',
  damageDieCount: 8,
  damageDieType: 'd6',
  damageType: 'fire',
  spellSave: 15,
  spellSaveType: 'dexterity',
}

function action(overrides: Partial<DndAction> = {}): DndAction {
  return {
    name: 'Fire Breath',
    desc: '',
    attacks: [],
    actionType: 'action',
    ...overrides,
  }
}

describe('parseSaveEffect', () => {
  it('parses the 2024 wording', () => {
    expect(parseSaveEffect(breath2024)).toEqual({
      dc: 21,
      ability: 'dexterity',
      dice: '17d6',
      bonus: 0,
      damageType: 'fire',
      halfOnSuccess: true,
    })
  })

  it('parses the 2014 wording', () => {
    expect(parseSaveEffect(breath2014)).toEqual({
      dc: 21,
      ability: 'dexterity',
      dice: '17d6',
      bonus: 0,
      damageType: 'fire',
      halfOnSuccess: true,
    })
  })

  it('reads a damage bonus', () => {
    expect(
      parseSaveEffect(
        'Constitution Saving Throw: DC 15, each creature in a 20-foot Emanation. Failure: 13 (2d8 + 4) Poison damage.',
      ),
    ).toMatchObject({ ability: 'constitution', dice: '2d8', bonus: 4 })
  })

  it('reads a damage penalty', () => {
    expect(
      parseSaveEffect(
        'Each creature must make a DC 10 Wisdom saving throw, taking 3 (1d6 - 1) psychic damage on a failed save.',
      ),
    ).toMatchObject({ dice: '1d6', bonus: -1, damageType: 'psychic' })
  })

  it('deals no damage on a success without half damage', () => {
    expect(
      parseSaveEffect(
        'Strength Saving Throw: DC 18, one creature. Failure: 22 (4d10) Bludgeoning damage, and the target has the Prone condition.',
      ),
    ).toMatchObject({ damageType: 'bludgeoning', halfOnSuccess: false })
  })

  it('leaves out an unknown damage type', () => {
    expect(
      parseSaveEffect(
        'Each creature must make a DC 12 Dexterity saving throw, taking 7 (2d6) damage on a failed save.',
      ),
    ).toMatchObject({ dice: '2d6', damageType: undefined })
  })

  it.each([
    [
      'a save without damage',
      'Wisdom Saving Throw: DC 14, one creature. Failure: The target has the Frightened condition.',
    ],
    ['damage without a save', 'Each creature takes 10 (3d6) fire damage.'],
    [
      'a save without a DC',
      'Each creature makes a Dexterity saving throw, taking 10 (3d6) fire damage.',
    ],
    [
      'an attack roll with a save rider',
      'Melee Attack Roll: +14, reach 10 ft. Hit: 19 (2d10 + 8) Piercing damage. If the target is a creature, it must succeed on a DC 21 Constitution saving throw.',
    ],
    [
      'damage before the save',
      'Hit: 10 (1d10 + 5) piercing damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned.',
    ],
    ['an empty description', ''],
  ])('ignores %s', (_label, desc) => {
    expect(parseSaveEffect(desc)).toBeUndefined()
  })
})

describe('attackSaveEffect', () => {
  it('uses the save of a homebrew attack', () => {
    expect(attackSaveEffect(attack)).toEqual({
      dc: 15,
      ability: 'dexterity',
      dice: '8d6',
      bonus: 0,
      damageType: 'fire',
      halfOnSuccess: true,
    })
  })

  it('adds the extra damage dice and bonuses', () => {
    expect(
      attackSaveEffect({
        ...attack,
        damageBonus: 2,
        extraDamageDieCount: 2,
        extraDamageDieType: 'd4',
        extraDamageBonus: 1,
      }),
    ).toMatchObject({ dice: '8d6 + 2d4', bonus: 3 })
  })

  it.each([
    ['without a DC', { spellSave: undefined }],
    ['without a save ability', { spellSaveType: undefined }],
    ['without damage dice', { damageDieCount: undefined }],
  ])('ignores an attack %s', (_label, overrides) => {
    expect(attackSaveEffect({ ...attack, ...overrides })).toBeUndefined()
  })
})

describe('actionSaveEffect', () => {
  it('prefers a homebrew attack save over the description', () => {
    expect(
      actionSaveEffect(action({ desc: breath2024, attacks: [attack] })),
    ).toMatchObject({ dc: 15, dice: '8d6' })
  })

  it('falls back to the description', () => {
    expect(actionSaveEffect(action({ desc: breath2024 }))).toMatchObject({
      dc: 21,
      dice: '17d6',
    })
  })

  it('is undefined for an action without a save', () => {
    expect(
      actionSaveEffect(action({ desc: 'The dragon makes three attacks.' })),
    ).toBeUndefined()
  })
})

describe('rollSaveEffectDamage', () => {
  it('rolls every die and adds the bonus', () => {
    const sides: number[] = []

    const total = rollSaveEffectDamage(
      { dice: '2d6 + 1d4', bonus: 3 },
      side => {
        sides.push(side)
        return 2
      },
    )

    expect(sides).toEqual([6, 6, 4])
    expect(total).toBe(9)
  })

  it('never rolls below 0', () => {
    expect(rollSaveEffectDamage({ dice: '1d4', bonus: -5 }, () => 1)).toBe(0)
  })
})
