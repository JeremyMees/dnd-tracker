import { damageTypes, dices } from '~~/constants/dnd'

const abilityNames: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

const attackLabels: Record<string, string> = {
  mw: 'Melee Weapon Attack:',
  rw: 'Ranged Weapon Attack:',
  'mw,rw': 'Melee or Ranged Weapon Attack:',
  ms: 'Melee Spell Attack:',
  rs: 'Ranged Spell Attack:',
  'ms,rs': 'Melee or Ranged Spell Attack:',
  m: 'Melee Attack Roll:',
  r: 'Ranged Attack Roll:',
  'm,r': 'Melee or Ranged Attack Roll:',
}

const fixedTags: Record<string, string> = {
  h: 'Hit: ',
  m: 'Miss: ',
  hom: 'Hit or Miss: ',
  actSaveFail: 'Failure:',
  actSaveSuccess: 'Success:',
  actSaveSuccessOrFail: 'Failure or Success:',
  actTrigger: 'Trigger:',
  actResponse: 'Response:',
}

function replaceTag(tag: string, text: string): string {
  if (tag in fixedTags && !text) return fixedTags[tag]!

  switch (tag) {
    case 'atk':
    case 'atkr':
      return attackLabels[text.replace(/\s/g, '')] ?? 'Attack:'
    case 'hit':
      return text.startsWith('-') ? text : `+${text}`
    case 'dc':
      return `DC ${text}`
    case 'recharge':
      return !text || text === '6' ? '(Recharge 6)' : `(Recharge ${text}–6)`
    case 'actSave':
      return `${abilityNames[text] ?? text} Saving Throw:`
    case 'actSaveFail':
      return `Failure by ${text} or More:`
    case 'chance':
      return `${text} percent`
    default: {
      const [label, , display] = text.split('|')

      return display || label || ''
    }
  }
}

export function stripFiveEToolsTags(text: string): string {
  let result = text
  let previous: string | undefined

  while (previous !== result) {
    previous = result
    result = result.replace(
      /\{@(\w+)(?:\s([^{}]*))?\}/g,
      (_match, tag: string, value: string | undefined) =>
        replaceTag(tag, value?.trim() ?? ''),
    )
  }

  return result.replace(/[ \t]{2,}/g, ' ').trim()
}

export function flattenEntries(entries: unknown): string {
  if (typeof entries === 'string') return stripFiveEToolsTags(entries)

  if (Array.isArray(entries)) {
    return entries.map(flattenEntries).filter(Boolean).join('\n')
  }

  if (typeof entries !== 'object' || entries === null) return ''

  const entry = entries as Record<string, unknown>

  if (Array.isArray(entry.items)) {
    return entry.items
      .map(item => `- ${flattenEntries(item)}`)
      .filter(item => item !== '- ')
      .join('\n')
  }

  const body = flattenEntries(entry.entries ?? entry.entry)
  const name =
    typeof entry.name === 'string' ? stripFiveEToolsTags(entry.name) : ''

  return name ? `${name}. ${body}`.trim() : body
}

export function parseActionName(raw: string): ParsedActionName {
  const parsed: ParsedActionName = { name: raw }
  const recharge = /\(Recharge (\d)(?:\s*[–-]\s*6)?\)/i.exec(raw)
  const perDay = /\((\d+)\/Day[^)]*\)/i.exec(raw)
  const perRest = /\(Recharges after a (?:Short or )?Long Rest\)/i.exec(raw)
  const cost = /\(Costs (\d+) Actions\)/i.exec(raw)
  const form = /\(([^()]+?) Form Only\)/i.exec(raw)

  if (recharge) {
    parsed.usageLimits = { type: 'recharge', param: Number(recharge[1]) }
  } else if (perDay) {
    parsed.usageLimits = { type: 'perDay', param: Number(perDay[1]) }
  } else if (perRest) {
    parsed.usageLimits = { type: 'perRest', param: 1 }
  }

  if (cost) parsed.legendaryActionCost = Number(cost[1])
  if (form) parsed.limitedToForm = form[1]!.slice(0, 50)

  parsed.name = [recharge, perDay, perRest, cost, form]
    .filter(isDefined)
    .reduce((name, match) => name.replace(match[0], ''), raw)
    .replace(/\s{2,}/g, ' ')
    .trim()

  return parsed
}

const dicePattern = /\(\s*(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+)\s*)?\)/g
const damageTypeSuffix = /\s*(?:([a-z]+)(?:\s+or\s+[a-z]+)?\s+)?damage/iy

function damageMatches(
  text: string,
): { dice: RegExpExecArray; type: string | undefined }[] {
  return [...text.matchAll(dicePattern)].flatMap(dice => {
    damageTypeSuffix.lastIndex = dice.index + dice[0].length

    const suffix = damageTypeSuffix.exec(text)

    return suffix ? [{ dice, type: suffix[1] }] : []
  })
}

function toDamage({
  dice: match,
  type: rawType,
}: ReturnType<typeof damageMatches>[number]) {
  const count = Number(match[1])
  const sides = Number(match[2]) as DndDiceSide
  const bonus = match[4] ? Number(`${match[3]}${match[4]}`) : undefined
  const type = rawType?.toLowerCase() as DndDamageType | undefined

  if (!dices.includes(sides) || count < 1 || count > 100) return undefined

  return {
    count,
    dice: `d${sides}` as DndDice,
    bonus: isDefined(bonus) && bonus >= -20 && bonus <= 100 ? bonus : undefined,
    type: type && damageTypes.includes(type) ? type : undefined,
  }
}

function attackTypeOf(kind: string, isSpell: boolean): DndAttackType {
  const ranged = kind.startsWith('ranged')

  if (isSpell) return ranged ? 'rangedSpell' : 'meleeSpell'

  return ranged ? 'ranged' : 'melee'
}

function rangeFields(text: string): Partial<DndAttack> {
  const reach = /reach (\d+)\s*ft/i.exec(text)
  const range = /range (\d+)(?:\s*\/\s*(\d+))?\s*ft/i.exec(text)

  return {
    ...(reach ? { reach: Math.min(Number(reach[1]), 1200) } : {}),
    ...(range ? { range: Math.min(Number(range[1]), 1200) } : {}),
    ...(range?.[2] ? { longRange: Math.min(Number(range[2]), 1200) } : {}),
  }
}

function damageFields(damage: ReturnType<typeof toDamage>): Partial<DndAttack> {
  if (!damage) return {}

  return {
    damageDieCount: damage.count,
    damageDieType: damage.dice,
    ...(isDefined(damage.bonus) ? { damageBonus: damage.bonus } : {}),
    ...(damage.type ? { damageType: damage.type } : {}),
  }
}

function extraDamageFields(
  damage: ReturnType<typeof toDamage>,
): Partial<DndAttack> {
  if (!damage) return {}

  return {
    extraDamageDieCount: damage.count,
    extraDamageDieType: damage.dice,
    ...(isDefined(damage.bonus) ? { extraDamageBonus: damage.bonus } : {}),
    ...(damage.type ? { extraDamageType: damage.type } : {}),
  }
}

export function parseAttack(name: string, text: string): DndAttack | undefined {
  const attack =
    /(melee or ranged|melee|ranged)\s+(?:(weapon|spell)\s+)?attack(?:\s+roll)?:\s*([+-]?\d+)/i.exec(
      text,
    )

  if (!attack) return undefined

  const isSpell = attack[2]?.toLowerCase() === 'spell'
  const toHitMod = Number(attack[3])
  const hitIndex = text.search(/Hit:/i)
  const hitText = hitIndex >= 0 ? text.slice(hitIndex) : ''
  const [primary, extra] = damageMatches(hitText)
  const plus =
    extra && /plus(?:\s*\d+)?\s*$/i.test(hitText.slice(0, extra.dice.index))
      ? toDamage(extra)
      : undefined

  return {
    name: name.slice(0, 100),
    attackType: attackTypeOf(attack[1]!.toLowerCase(), isSpell),
    distanceUnit: 'feet',
    ...(toHitMod >= -20 && toHitMod <= 30 ? { toHitMod } : {}),
    ...rangeFields(text),
    ...damageFields(primary ? toDamage(primary) : undefined),
    ...extraDamageFields(plus),
  }
}

const entryPattern = /^(?:-\s*)?\*{2,3}([^*]+?)\.\*{2,3}(.*)$/
const propertyPattern = /^-?\s*\*\*([^*]+?)\*\*(.*)$/

function cleanMarkdown(text: string): string {
  return text
    .replace(/\[([^\][]*)\]\([^()]*\)/g, '$1')
    .replace(/\*+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function readAbilityTable(header: string, values: string) {
  const cells = (line: string) =>
    line
      .split('|')
      .map(cell => cell.trim())
      .filter(Boolean)
  const names = cells(header)
  const scores = cells(values)

  return Object.fromEntries(
    names
      .map((name, index) => [
        name.toLowerCase(),
        Number.parseInt(scores[index] ?? '', 10),
      ])
      .filter(([, score]) => Number.isFinite(score)),
  )
}

function parseStatblockLines(name: string, lines: string[]): MarkdownStatblock {
  const statblock: MarkdownStatblock = {
    name: cleanMarkdown(name),
    properties: {},
    abilityScores: {},
    sections: {},
  }
  let section = 'traits'
  let entry: StatblockEntry | undefined

  lines.forEach((line, index) => {
    const heading = /^#{3,}\s*([^#\s].*)$/.exec(line)
    const entryMatch = entryPattern.exec(line)
    const property = propertyPattern.exec(line)

    if (/^\|\s*:?-{3}/.test(line)) {
      statblock.abilityScores = readAbilityTable(
        lines[index - 1] ?? '',
        lines[index + 1] ?? '',
      )
    } else if (heading) {
      section = cleanMarkdown(heading[1]!).toLowerCase()
      entry = undefined
    } else if (entryMatch) {
      entry = {
        name: cleanMarkdown(entryMatch[1]!),
        desc: cleanMarkdown(entryMatch[2]!),
      }
      const list = statblock.sections[section] ?? []

      list.push(entry)
      statblock.sections[section] = list
    } else if (property && !entry && section === 'traits') {
      statblock.properties[cleanMarkdown(property[1]!).toLowerCase()] =
        cleanMarkdown(property[2]!)
    } else if (entry && line.trim() && !line.startsWith('|')) {
      entry.desc = `${entry.desc}\n${cleanMarkdown(line)}`.trim()
    }
  })

  return statblock
}

export function parseStatblockMarkdown(text: string): MarkdownStatblock[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*>\s?/, '').trimEnd())
    .filter(line => !/^(\\(column|page)break|_{3,}|-{3,})$/.test(line.trim()))
  const statblocks: MarkdownStatblock[] = []
  let current: { name: string; lines: string[] } | undefined

  for (const line of lines) {
    const title = /^##\s+(\S.*)$/.exec(line)

    if (title) {
      if (current)
        statblocks.push(parseStatblockLines(current.name, current.lines))
      current = { name: title[1]!, lines: [] }
    } else {
      current?.lines.push(line)
    }
  }

  if (current) statblocks.push(parseStatblockLines(current.name, current.lines))

  return statblocks
}
