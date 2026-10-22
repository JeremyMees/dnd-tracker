import { abilityMap, skillKeyMap } from '~~/constants/dnd'

const abilities: DndAbility[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

const shortAbilities: Record<string, DndAbility> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
}

function toAbility(value: unknown): DndAbility | undefined {
  const key = normalizeKey(toTextOrUndefined(value))

  return shortAbilities[key] ?? abilityMap[key]
}

function toSkill(value: unknown): DndSkill | undefined {
  return skillKeyMap[
    normalizeKey(toTextOrUndefined(value)).replace(/\s+/g, '_')
  ]
}

function buildScores(scores: Partial<Record<DndAbility, number>>) {
  const abilityScores = Object.fromEntries(
    abilities.map(ability => [
      ability,
      integerInRange(scores[ability], 1, 50) ?? 10,
    ]),
  ) as DndAbilityScores

  const modifiers = Object.fromEntries(
    abilities.map(ability => [
      ability,
      modifierFromScore(abilityScores[ability]),
    ]),
  ) as DndModifiers

  return { abilityScores, modifiers }
}

function buildSavingThrows(
  modifiers: DndModifiers,
  saves: [unknown, unknown][],
): DndSavingThrowBonuses {
  const savingThrows = { ...modifiers }

  for (const [name, bonus] of saves) {
    const ability = toAbility(name)
    const value = integerInRange(toNumberOrUndefined(bonus), -10, 20)

    if (ability && isDefined(value)) savingThrows[ability] = value
  }

  return savingThrows
}

function buildSkills(skills: [unknown, unknown][]): DndSkillBonuses | null {
  const result: Partial<DndSkillBonuses> = {}

  for (const [name, bonus] of skills) {
    const skill = toSkill(name)
    const value = integerInRange(toNumberOrUndefined(bonus), -10, 20)

    if (skill && isDefined(value)) result[skill] = value
  }

  return Object.keys(result).length ? (result as DndSkillBonuses) : null
}

function buildSight(senses: string): DndSight | null {
  const sight: DndSight = { normalSightRange: 0 }
  const ranges = {
    darkVisionRange: parseSenseRange(senses, 'darkvision'),
    blindSightRange: parseSenseRange(senses, 'blindsight'),
    tremorSenseRange: parseSenseRange(senses, 'tremorsense'),
    trueSightRange: parseSenseRange(senses, 'truesight'),
  }

  for (const [key, value] of Object.entries(ranges)) {
    const range = integerInRange(value, 0, 50000)

    if (isDefined(range)) sight[key as keyof typeof ranges] = range
  }

  return Object.keys(sight).length > 1 ? sight : null
}

function buildSpeed(speeds: Partial<Record<keyof DndSpeed, unknown>>) {
  const speed: DndSpeed = { unit: 'feet', walk: 0 }

  for (const key of ['walk', 'fly', 'swim', 'climb', 'burrow', 'crawl']) {
    const value = integerInRange(
      toNumberOrUndefined(speeds[key as keyof DndSpeed]),
      0,
      500,
    )

    if (isDefined(value)) Object.assign(speed, { [key]: value })
  }

  if (speeds.hover) speed.hover = true

  return speed
}

function parseSpeedText(text: string): DndSpeed {
  const walk = /^\s*(\d+)\s*ft/i.exec(text)?.[1]
  const speeds: Partial<Record<keyof DndSpeed, unknown>> = { walk }

  for (const match of text.matchAll(
    /(fly|swim|climb|burrow|crawl)\s+(\d+)/gi,
  )) {
    speeds[match[1]!.toLowerCase() as keyof DndSpeed] = match[2]
  }

  speeds.hover = /hover/i.test(text)

  return buildSpeed(speeds)
}

function buildLanguages(languages: unknown[]): string[] | null {
  const result = languages
    .flatMap(language => toTextOrUndefined(language)?.split(/[,;]/) ?? [])
    .map(language => stripFiveEToolsTags(language).trim().slice(0, 50))
    .filter(language => language && language !== '—' && language !== '-')
    .slice(0, 20)

  return result.length ? result : null
}

function buildResistances(
  lists: Record<keyof DndResistancesAndImmunities, string[]>,
): DndResistancesAndImmunities | null {
  const result: DndResistancesAndImmunities = {
    damageImmunities: mapDamageTypes(lists.damageImmunities.join(', ')),
    damageResistances: mapDamageTypes(lists.damageResistances.join(', ')),
    damageVulnerabilities: mapDamageTypes(
      lists.damageVulnerabilities.join(', '),
    ),
    conditionImmunities: mapConditionTypes(
      lists.conditionImmunities.join(', '),
    ),
  }

  return Object.values(result).some(list => list.length) ? result : null
}

function buildTraits(traits: { name: string; desc: string }[]) {
  const result = traits
    .map(trait => ({
      name: trait.name.trim().slice(0, 100),
      desc: trait.desc.trim().slice(0, 2000),
    }))
    .filter(trait => trait.name.length >= 3 && trait.desc.length >= 10)
    .slice(0, 40)

  return result.length ? result : null
}

function buildActions(actions: ImportedAction[]): DndAction[] {
  return actions
    .map(action => {
      const parsed = parseActionName(stripFiveEToolsTags(action.name))
      const desc = action.desc.trim().slice(0, 2000)
      const attack = parseAttack(parsed.name, desc)

      return {
        name: parsed.name.slice(0, 150),
        desc,
        actionType: action.actionType,
        attacks: attack ? [attack] : [],
        ...(parsed.usageLimits ? { usageLimits: parsed.usageLimits } : {}),
        ...(parsed.legendaryActionCost && parsed.legendaryActionCost <= 10
          ? { legendaryActionCost: parsed.legendaryActionCost }
          : {}),
        ...(parsed.limitedToForm
          ? { limitedToForm: parsed.limitedToForm }
          : {}),
      }
    })
    .filter(action => action.name && action.desc)
    .slice(0, 40)
}

function baseCreature(
  name: string,
  type: HomebrewType = 'monster',
): HomebrewTransfer {
  return {
    name: name.slice(0, 50),
    type,
    player: null,
    level: null,
    challengeRating: null,
    link: null,
    armorClass: null,
    armorDetail: null,
    hitPoints: null,
    hitDice: null,
    initiativeModifier: null,
    proficiencyBonus: null,
    passivePerception: null,
    speed: null,
    sight: null,
    languages: null,
    abilityScores: null,
    modifiers: null,
    savingThrows: null,
    skillBonuses: null,
    resistancesAndImmunities: null,
    traits: null,
    actions: [],
  }
}

function spellcastingText(block: ImportedRecord): string {
  const lines = [flattenEntries(block.headerEntries)]
  const will = toListOrEmpty(block.will)
  const daily = toRecordOrUndefined(block.daily) ?? {}
  const spells = toRecordOrUndefined(block.spells) ?? {}

  if (will.length) lines.push(`At will: ${flattenEntries(will.join(', '))}`)

  for (const [key, list] of Object.entries(daily)) {
    const each = key.endsWith('e') ? ' each' : ''

    lines.push(
      `${Number.parseInt(key, 10)}/day${each}: ${flattenEntries(toListOrEmpty(list).join(', '))}`,
    )
  }

  for (const [level, value] of Object.entries(spells)) {
    const entry = toRecordOrUndefined(value) ?? {}
    const list = flattenEntries(toListOrEmpty(entry.spells).join(', '))
    const slots = toNumberOrUndefined(entry.slots)
    const slotText = slots ? ` (${slots} slots)` : ''
    const label =
      level === '0' ? 'Cantrips (at will)' : `Level ${level}${slotText}`

    lines.push(`${label}: ${list}`)
  }

  lines.push(flattenEntries(block.footerEntries))

  return lines.filter(Boolean).join('\n')
}

export function isFiveEToolsCreature(value: ImportedRecord): boolean {
  return (
    typeof value.name === 'string' &&
    'str' in value &&
    ('hp' in value || 'ac' in value)
  )
}

export function isImprovedInitiativeStatBlock(value: ImportedRecord): boolean {
  return (
    typeof value.Name === 'string' &&
    (!!toRecordOrUndefined(value.HP) ||
      !!toRecordOrUndefined(value.AC) ||
      !!toRecordOrUndefined(value.Abilities))
  )
}

export function isKoboldFightClubCreature(value: ImportedRecord): boolean {
  return (
    typeof value.name === 'string' &&
    'cr' in value &&
    ('hp' in value || 'ac' in value) &&
    !('str' in value)
  )
}

export function fromFiveETools(creature: ImportedRecord): HomebrewTransfer {
  const result = baseCreature(
    stripFiveEToolsTags(toTextOrUndefined(creature.name) ?? ''),
  )
  const ac = toListOrEmpty(creature.ac)[0]
  const acRecord = toRecordOrUndefined(ac)
  const hp = toRecordOrUndefined(creature.hp)
  const scores = buildScores(
    Object.fromEntries(
      Object.entries(shortAbilities).map(([short, ability]) => [
        ability,
        toNumberOrUndefined(creature[short]),
      ]),
    ),
  )
  const challenge = toNumberOrUndefined(
    toRecordOrUndefined(creature.cr)?.cr ?? creature.cr,
  )
  const proficiency = proficiencyFromChallenge(challenge)
  const initiative = creature.initiative
  const initiativeProficiency = toNumberOrUndefined(
    toRecordOrUndefined(initiative)?.proficiency,
  )
  const speed = toRecordOrUndefined(creature.speed) ?? {}
  const flatten = (key: string, nested: string) =>
    toListOrEmpty(creature[key]).flatMap(entry =>
      typeof entry === 'string'
        ? [entry]
        : toListOrEmpty(toRecordOrUndefined(entry)?.[nested]).filter(
            (item): item is string => typeof item === 'string',
          ),
    )
  const spellcasting = toListOrEmpty(creature.spellcasting)
    .map(toRecordOrUndefined)
    .filter(isDefined)
    .map(block => ({
      name: stripFiveEToolsTags(
        toTextOrUndefined(block.name) ?? 'Spellcasting',
      ),
      desc: spellcastingText(block),
      displayAs: block.displayAs,
    }))
  const section = (key: string, actionType: DndActionType): ImportedAction[] =>
    toListOrEmpty(creature[key])
      .map(toRecordOrUndefined)
      .filter(isDefined)
      .map(entry => ({
        name: toTextOrUndefined(entry.name) ?? '',
        desc: flattenEntries(entry.entries),
        actionType,
      }))

  result.armorClass =
    integerInRange(toNumberOrUndefined(acRecord?.ac ?? ac), 1, 100) ?? null
  result.armorDetail =
    toListOrEmpty(acRecord?.from)
      .map(item => stripFiveEToolsTags(String(item)))
      .join(', ')
      .slice(0, 100) || null
  result.hitPoints =
    integerInRange(toNumberOrUndefined(hp?.average), 1, 1000) ?? null
  result.hitDice = parseHitDiceText(hp?.formula) ?? null
  result.abilityScores = scores.abilityScores
  result.modifiers = scores.modifiers
  result.challengeRating = toChallengeRating(challenge) ?? null
  result.proficiencyBonus = proficiency ?? null
  result.initiativeModifier = String(
    integerInRange(
      toNumberOrUndefined(initiative) ??
        scores.modifiers.dexterity +
          (initiativeProficiency ?? 0) * (proficiency ?? 2),
      -20,
      20,
    ) ?? scores.modifiers.dexterity,
  )
  result.passivePerception =
    integerInRange(toNumberOrUndefined(creature.passive), 0, 50) ?? null
  result.speed = buildSpeed({
    walk: toNumberOrUndefined(
      toRecordOrUndefined(speed.walk)?.number ?? speed.walk,
    ),
    fly: toNumberOrUndefined(
      toRecordOrUndefined(speed.fly)?.number ?? speed.fly,
    ),
    swim: toNumberOrUndefined(
      toRecordOrUndefined(speed.swim)?.number ?? speed.swim,
    ),
    climb: toNumberOrUndefined(
      toRecordOrUndefined(speed.climb)?.number ?? speed.climb,
    ),
    burrow: toNumberOrUndefined(
      toRecordOrUndefined(speed.burrow)?.number ?? speed.burrow,
    ),
    hover: speed.canHover === true,
  })
  result.sight = buildSight(
    toListOrEmpty(creature.senses).map(String).join(', '),
  )
  result.languages = buildLanguages(toListOrEmpty(creature.languages))
  result.savingThrows = buildSavingThrows(
    scores.modifiers,
    Object.entries(toRecordOrUndefined(creature.save) ?? {}),
  )
  result.skillBonuses = buildSkills(
    Object.entries(toRecordOrUndefined(creature.skill) ?? {}),
  )
  result.resistancesAndImmunities = buildResistances({
    damageImmunities: flatten('immune', 'immune'),
    damageResistances: flatten('resist', 'resist'),
    damageVulnerabilities: flatten('vulnerable', 'vulnerable'),
    conditionImmunities: flatten('conditionImmune', 'conditionImmune'),
  })
  result.traits = buildTraits([
    ...section('trait', 'specialAbility'),
    ...spellcasting.filter(block => block.displayAs !== 'action'),
  ])
  result.actions = buildActions([
    ...spellcasting
      .filter(block => block.displayAs === 'action')
      .map(block => ({ ...block, actionType: 'action' as const })),
    ...section('action', 'action'),
    ...section('bonus', 'bonusAction'),
    ...section('reaction', 'reaction'),
    ...section('legendary', 'legendaryAction'),
    ...section('mythic', 'mythicAction'),
  ])

  return result
}

export function fromImprovedInitiative(
  statBlock: ImportedRecord,
): HomebrewTransfer {
  const player = toTextOrUndefined(statBlock.Player)
  const result = baseCreature(
    toTextOrUndefined(statBlock.Name) ?? '',
    player === 'player' || player === 'npc' ? player : 'monster',
  )
  const ac = toRecordOrUndefined(statBlock.AC)
  const hp = toRecordOrUndefined(statBlock.HP)
  const abilityRecord = toRecordOrUndefined(statBlock.Abilities)
  const scores = abilityRecord
    ? buildScores(
        Object.fromEntries(
          Object.entries(abilityRecord).map(([key, value]) => [
            toAbility(key),
            toNumberOrUndefined(value),
          ]),
        ),
      )
    : undefined
  const senses = toListOrEmpty(statBlock.Senses).map(String).join(', ')
  const pairs = (key: string): [unknown, unknown][] =>
    toListOrEmpty(statBlock[key])
      .map(toRecordOrUndefined)
      .filter(isDefined)
      .map(entry => [entry.Name, entry.Modifier])
  const strings = (key: string) =>
    toListOrEmpty(statBlock[key]).filter(
      (item): item is string => typeof item === 'string',
    )
  const section = (key: string, actionType: DndActionType): ImportedAction[] =>
    toListOrEmpty(statBlock[key])
      .map(toRecordOrUndefined)
      .filter(isDefined)
      .map(entry => {
        const name = toTextOrUndefined(entry.Name) ?? ''
        const usage = toTextOrUndefined(entry.Usage)

        return {
          name: usage ? `${name} (${usage})` : name,
          desc: toTextOrUndefined(entry.Content) ?? '',
          actionType,
        }
      })
  const initiative =
    toNumberOrUndefined(statBlock.InitiativeModifier) ??
    toNumberOrUndefined(statBlock.TotalInitiativeModifier) ??
    scores?.modifiers.dexterity

  result.armorClass =
    integerInRange(toNumberOrUndefined(ac?.Value), 1, 100) ?? null
  result.armorDetail =
    toTextOrUndefined(ac?.Notes)
      ?.replace(/^\(|\)$/g, '')
      .slice(0, 100) || null
  result.hitPoints =
    integerInRange(toNumberOrUndefined(hp?.Value), 1, 1000) ?? null
  result.hitDice = parseHitDiceText(hp?.Notes) ?? null
  result.initiativeModifier = isDefined(integerInRange(initiative, -20, 20))
    ? String(integerInRange(initiative, -20, 20))
    : null
  result.challengeRating = toChallengeRating(statBlock.Challenge) ?? null
  result.proficiencyBonus =
    proficiencyFromChallenge(toNumberOrUndefined(statBlock.Challenge)) ?? null
  result.passivePerception =
    integerInRange(
      toNumberOrUndefined(/passive perception (\d+)/i.exec(senses)?.[1]),
      0,
      50,
    ) ?? null
  result.speed = strings('Speed').length
    ? parseSpeedText(strings('Speed').join(', '))
    : null
  result.sight = buildSight(senses)
  result.languages = buildLanguages(strings('Languages'))
  result.abilityScores = scores?.abilityScores ?? null
  result.modifiers = scores?.modifiers ?? null
  result.savingThrows = scores
    ? buildSavingThrows(scores.modifiers, pairs('Saves'))
    : null
  result.skillBonuses = buildSkills(pairs('Skills'))
  result.resistancesAndImmunities = buildResistances({
    damageImmunities: strings('DamageImmunities'),
    damageResistances: strings('DamageResistances'),
    damageVulnerabilities: strings('DamageVulnerabilities'),
    conditionImmunities: strings('ConditionImmunities'),
  })
  result.traits = buildTraits(section('Traits', 'specialAbility'))
  result.actions = buildActions([
    ...section('Actions', 'action'),
    ...section('BonusActions', 'bonusAction'),
    ...section('Reactions', 'reaction'),
    ...section('LegendaryActions', 'legendaryAction'),
    ...section('MythicActions', 'mythicAction'),
  ])

  return result
}

export function fromKoboldFightClub(
  creature: ImportedRecord,
): HomebrewTransfer {
  const result = baseCreature(toTextOrUndefined(creature.name) ?? '')
  const initiative = integerInRange(toNumberOrUndefined(creature.init), -20, 20)

  result.armorClass =
    integerInRange(toNumberOrUndefined(creature.ac), 1, 100) ?? null
  result.hitPoints =
    integerInRange(toNumberOrUndefined(creature.hp), 1, 1000) ?? null
  result.initiativeModifier = isDefined(initiative) ? String(initiative) : null
  result.challengeRating = toChallengeRating(creature.cr) ?? null
  result.proficiencyBonus =
    proficiencyFromChallenge(toNumberOrUndefined(creature.cr)) ?? null

  return result
}

function signedPairs(text: string | undefined): [unknown, unknown][] {
  return (text ?? '')
    .split(',')
    .map(part => /^(.+?)([+-]\d+)/.exec(part.trim()))
    .filter(isDefined)
    .map(match => [match[1]!.trim(), match[2]])
}

export function fromStatblockMarkdown(
  statblock: MarkdownStatblock,
): HomebrewTransfer {
  const result = baseCreature(statblock.name)
  const property = (key: string) => statblock.properties[key]
  const scores = buildScores(
    Object.fromEntries(
      Object.entries(statblock.abilityScores).map(([key, value]) => [
        toAbility(key),
        value,
      ]),
    ),
  )
  const challenge = toNumberOrUndefined(property('challenge')?.split(/\s/)[0])
  const proficiency =
    integerInRange(toNumberOrUndefined(property('proficiency bonus')), 0, 10) ??
    proficiencyFromChallenge(challenge)
  const initiative = integerInRange(
    toNumberOrUndefined(property('initiative')?.match(/[+-]?\d+/)?.[0]),
    -20,
    20,
  )
  const senses = property('senses') ?? ''
  const immunities = property('immunities') ?? ''
  const section = (key: string, actionType: DndActionType): ImportedAction[] =>
    (statblock.sections[key] ?? []).map(entry => ({ ...entry, actionType }))
  const hasScores = Object.keys(statblock.abilityScores).length > 0

  result.armorClass =
    integerInRange(
      toNumberOrUndefined(property('armor class')?.match(/\d+/)?.[0]),
      1,
      100,
    ) ?? null
  result.armorDetail =
    property('armor class')
      ?.match(/\(([^()]+)\)/)?.[1]
      ?.slice(0, 100) ?? null
  result.hitPoints =
    integerInRange(
      toNumberOrUndefined(property('hit points')?.match(/\d+/)?.[0]),
      1,
      1000,
    ) ?? null
  result.hitDice = parseHitDiceText(property('hit points')) ?? null
  result.speed = property('speed') ? parseSpeedText(property('speed')!) : null
  result.abilityScores = hasScores ? scores.abilityScores : null
  result.modifiers = hasScores ? scores.modifiers : null
  result.initiativeModifier = String(
    initiative ?? (hasScores ? scores.modifiers.dexterity : 0),
  )
  result.challengeRating = toChallengeRating(challenge) ?? null
  result.proficiencyBonus = proficiency ?? null
  result.savingThrows = hasScores
    ? buildSavingThrows(
        scores.modifiers,
        signedPairs(property('saving throws')),
      )
    : null
  result.skillBonuses = buildSkills(signedPairs(property('skills')))
  result.passivePerception =
    integerInRange(
      toNumberOrUndefined(/passive perception (\d+)/i.exec(senses)?.[1]),
      0,
      50,
    ) ?? null
  result.sight = buildSight(senses)
  result.languages = buildLanguages([property('languages')])
  result.resistancesAndImmunities = buildResistances({
    damageImmunities: [property('damage immunities') ?? '', immunities],
    damageResistances: [property('damage resistances') ?? ''],
    damageVulnerabilities: [property('damage vulnerabilities') ?? ''],
    conditionImmunities: [property('condition immunities') ?? '', immunities],
  })
  result.traits = buildTraits(statblock.sections.traits ?? [])
  result.actions = buildActions([
    ...section('actions', 'action'),
    ...section('bonus actions', 'bonusAction'),
    ...section('reactions', 'reaction'),
    ...section('legendary actions', 'legendaryAction'),
    ...section('mythic actions', 'mythicAction'),
  ])

  return result
}

export function creaturesFromMarkdown(text: string): HomebrewTransfer[] {
  return uniqueByName(parseStatblockMarkdown(text).map(fromStatblockMarkdown))
}

function collectCreatures(
  value: unknown,
  found: HomebrewTransfer[],
  depth = 0,
): void {
  if (depth > 6) return

  if (typeof value === 'string') {
    if (!/^\s*[[{]/.test(value)) return

    try {
      collectCreatures(JSON.parse(value), found, depth + 1)
    } catch {
      return
    }

    return
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectCreatures(item, found, depth + 1))

    return
  }

  const record = toRecordOrUndefined(value)

  if (!record) return

  if (isFiveEToolsCreature(record)) found.push(fromFiveETools(record))
  else if (isImprovedInitiativeStatBlock(record))
    found.push(fromImprovedInitiative(record))
  else if (isKoboldFightClubCreature(record))
    found.push(fromKoboldFightClub(record))
  else
    Object.values(record).forEach(item =>
      collectCreatures(item, found, depth + 1),
    )
}

function uniqueByName(creatures: HomebrewTransfer[]): HomebrewTransfer[] {
  const seen = new Set<string>()

  return creatures.filter(creature => {
    const key = creature.name.toLowerCase()

    if (!creature.name || seen.has(key)) return false

    seen.add(key)

    return true
  })
}

export function findImportedCreatures(json: unknown): HomebrewTransfer[] {
  const found: HomebrewTransfer[] = []

  collectCreatures(json, found)

  return uniqueByName(found)
}

export function creaturesFromCsv(text: string): HomebrewTransfer[] {
  return uniqueByName(
    parseCsv(text)
      .filter(row => row.name && (row.hp || row.ac))
      .map(row =>
        fromKoboldFightClub({ ...row, init: row.init ?? row.initiative }),
      ),
  )
}
