export function hasResistances(resistances: DndResistancesAndImmunities): boolean {
  const {
    damageImmunities,
    damageResistances,
    damageVulnerabilities,
    conditionImmunities,
  } = resistances

  return damageImmunities.length > 0
    || damageResistances.length > 0
    || damageVulnerabilities.length > 0
    || conditionImmunities.length > 0
}

export function hasCreatureStats(creature: DndCreatureStats): boolean {
  return (
    Object.keys(creature.savingThrows ?? {}).length > 0
    || Object.keys(creature.speed ?? {}).length > 0
    || Object.keys(creature.sight ?? {}).length > 0
    || Object.keys(creature.skillBonuses ?? {}).length > 0
    || (creature.languages?.length ?? 0) > 0
    || (creature.traits?.length ?? 0) > 0
    || (creature.resistancesAndImmunities != null && hasResistances(creature.resistancesAndImmunities))
  )
}

export function hasAbilityScores(creature: { abilityScores?: DndAbilityScores | null }): boolean {
  return Object.keys(creature.abilityScores ?? {}).length > 0
}

export function hasMaxCharacters(sheet?: InitiativeSheet): boolean {
  return sheet ? sheet.rows.length >= 50 : false
}

export function concentrationDC(damage: number): number {
  const halfDamage = Math.floor(Math.max(0, damage) / 2)

  return Math.min(30, Math.max(10, halfDamage))
}

export function isSpell(item: DndItem): item is DndSpell {
  return 'castingOptions' in item && 'school' in item
}

export function isMagicItem(item: DndItem): item is DndMagicItem {
  return 'isMagicItem' in item && 'rarity' in item
}

export function isWeapon(item: DndItem): item is DndWeapon {
  return 'damageDice' in item && 'isSimple' in item && !('isMagicItem' in item)
}

export function isArmor(item: DndItem): item is DndArmor {
  return 'acDisplay' in item && 'acBase' in item && !('isMagicItem' in item)
}

export function isCondition(item: DndItem): item is DndCondition {
  return 'desc' in item
    && !('castingOptions' in item)
    && !('isMagicItem' in item)
    && !('challengeRating' in item)
    && !('damageDice' in item)
    && !('acDisplay' in item)
}

export function isMonster(item: DndItem): item is DndMonster {
  return 'challengeRating' in item && 'abilityScores' in item
}
