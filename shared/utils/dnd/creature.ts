export function readInitiativeModifier(
  stored: string | number | null | undefined,
): number | undefined {
  return toIntegerOrUndefined(stored)
}

export function storeInitiativeModifier(
  value: string | number | null | undefined,
): string | null {
  const modifier = toIntegerOrUndefined(value)

  return isDefined(modifier) ? String(modifier) : null
}

export function monsterToRow(monster: DndMonster): NewInitiativeRow {
  const {
    initiativeBonus,
    hitDice,
    languages,
    proficiencyBonus,
    type: _type,
    size: _size,
    alignment: _alignment,
    experiencePoints: _experiencePoints,
    ...rest
  } = monster

  return {
    ...rest,
    type: 'monster',
    hitDice: parseDndDiceToString(hitDice),
    languages: parseDndLanguages(languages),
    initiativeModifier: initiativeBonus,
    proficiencyBonus: proficiencyBonus ?? undefined,
  }
}

export function homebrewToRow(homebrew: HomebrewItemRow): NewInitiativeRow {
  const { id, initiativeModifier, ...rest } = homebrew

  return {
    ...nullsToUndefined(rest),
    homebrew: id,
    initiativeModifier: readInitiativeModifier(initiativeModifier),
  }
}

export function toHomebrewTransfer(item: HomebrewItemRow): HomebrewTransfer {
  const { id, campaign, createdAt, ...homebrew } = item

  return homebrew
}

export function homebrewTransferToRow(
  item: HomebrewTransfer,
): NewInitiativeRow {
  const { initiativeModifier, type, ...rest } = item

  return {
    ...nullsToUndefined(rest),
    type: type ?? 'monster',
    initiativeModifier: readInitiativeModifier(initiativeModifier),
  }
}
