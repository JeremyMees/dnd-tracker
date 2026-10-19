import 'zod/compile'
import { z } from 'zod'
import {
  damageTypes,
  conditionTypes,
  attackTypes,
  diceTypes,
  distanceUnits,
  usageTypes,
} from '~~/constants/dnd'
import {
  abilityType,
  actionType,
  homebrewType,
  initiativeSpacingOptions,
  initiativeDefaultRows,
  initiativePets,
  initiativeWidgets,
} from '~~/constants/validation'

export const skillBonusesSchema = z.object({
  acrobatics: z.int().gte(-10).lte(20).optional(),
  animalHandling: z.int().gte(-10).lte(20).optional(),
  arcana: z.int().gte(-10).lte(20).optional(),
  athletics: z.int().gte(-10).lte(20).optional(),
  deception: z.int().gte(-10).lte(20).optional(),
  history: z.int().gte(-10).lte(20).optional(),
  insight: z.int().gte(-10).lte(20).optional(),
  intimidation: z.int().gte(-10).lte(20).optional(),
  investigation: z.int().gte(-10).lte(20).optional(),
  medicine: z.int().gte(-10).lte(20).optional(),
  nature: z.int().gte(-10).lte(20).optional(),
  perception: z.int().gte(-10).lte(20).optional(),
  performance: z.int().gte(-10).lte(20).optional(),
  persuasion: z.int().gte(-10).lte(20).optional(),
  religion: z.int().gte(-10).lte(20).optional(),
  sleightOfHand: z.int().gte(-10).lte(20).optional(),
  stealth: z.int().gte(-10).lte(20).optional(),
  survival: z.int().gte(-10).lte(20).optional(),
})

export const traitSchema = z.object({
  name: z.string().min(3).max(100),
  desc: z.string().min(10).max(2000),
})

export const abilityScoresSchema = z.object({
  strength: z.int().gte(1).lte(50).optional(),
  dexterity: z.int().gte(1).lte(50).optional(),
  constitution: z.int().gte(1).lte(50).optional(),
  intelligence: z.int().gte(1).lte(50).optional(),
  wisdom: z.int().gte(1).lte(50).optional(),
  charisma: z.int().gte(1).lte(50).optional(),
})

export const abilityBonusSchema = z.object({
  strength: z.int().gte(-10).lte(20).optional(),
  dexterity: z.int().gte(-10).lte(20).optional(),
  constitution: z.int().gte(-10).lte(20).optional(),
  intelligence: z.int().gte(-10).lte(20).optional(),
  wisdom: z.int().gte(-10).lte(20).optional(),
  charisma: z.int().gte(-10).lte(20).optional(),
})

export const speedSchema = z.object({
  walk: z.int().gte(0).lte(500).optional(),
  crawl: z.int().gte(0).lte(500).optional(),
  fly: z.int().gte(0).lte(500).optional(),
  swim: z.int().gte(0).lte(500).optional(),
  burrow: z.int().gte(0).lte(500).optional(),
  climb: z.int().gte(0).lte(500).optional(),
  hover: z.boolean().optional(),
})

export const sightSchema = z.object({
  normalSightRange: z.int().gte(0).lte(50000).optional(),
  darkVisionRange: z.int().gte(0).lte(50000).optional(),
  blindSightRange: z.int().gte(0).lte(50000).optional(),
  tremorSenseRange: z.int().gte(0).lte(50000).optional(),
  trueSightRange: z.int().gte(0).lte(50000).optional(),
})

const damageTypeEnum = damageTypes as [DndDamageType, ...DndDamageType[]]
const conditionTypeEnum = conditionTypes as [
  DndConditionType,
  ...DndConditionType[],
]
const attackTypeEnum = attackTypes as [DndAttackType, ...DndAttackType[]]
const diceTypeEnum = [...diceTypes] as [DndDice, ...DndDice[]]
const distanceUnitEnum = distanceUnits as [
  DndDistanceUnit,
  ...DndDistanceUnit[],
]
const usageTypeEnum = usageTypes as [DndUsageType, ...DndUsageType[]]
const actionTypeEnum = [...actionType] as [DndActionType, ...DndActionType[]]
const abilityTypeEnum = [...abilityType] as [DndAbility, ...DndAbility[]]

export const attackSchema = z.object({
  name: z.string().min(1).max(100),
  attackType: z.enum(attackTypeEnum),
  toHitMod: z.int().gte(-20).lte(30).optional(),
  distanceUnit: z.enum(distanceUnitEnum),
  reach: z.int().gte(0).lte(1200).optional(),
  range: z.int().gte(0).lte(1200).optional(),
  longRange: z.int().gte(0).lte(1200).optional(),
  targetCreatureOnly: z.boolean().optional(),
  damageDieCount: z.int().gte(0).lte(100).optional(),
  damageDieType: z.enum(diceTypeEnum).optional(),
  damageBonus: z.int().gte(-20).lte(100).optional(),
  damageType: z.enum(damageTypeEnum).optional(),
  extraDamageDieCount: z.int().gte(1).lte(100).optional(),
  extraDamageDieType: z.enum(diceTypeEnum).optional(),
  extraDamageBonus: z.int().gte(-20).lte(100).optional(),
  extraDamageType: z.enum(damageTypeEnum).optional(),
  spellSave: z.int().gte(1).lte(30).optional(),
  spellSaveType: z.enum(abilityTypeEnum).optional(),
})

export const usageLimitsSchema = z.object({
  type: z.enum(usageTypeEnum),
  param: z.int().gte(1).lte(200),
})

export const actionSchema = z.object({
  actionType: z.enum(actionTypeEnum),
  name: z.string().min(1).max(150),
  desc: z.string().min(1).max(2000),
  attacks: z.array(attackSchema).max(10),
  legendaryActionCost: z.int().gte(1).lte(10).optional(),
  limitedToForm: z.string().max(50).optional().or(z.literal('')),
  usageLimits: usageLimitsSchema.optional(),
})

export const resistancesAndImmunitiesSchema = z.object({
  damageImmunities: z.array(z.enum(damageTypeEnum)).default([]),
  damageResistances: z.array(z.enum(damageTypeEnum)).default([]),
  damageVulnerabilities: z.array(z.enum(damageTypeEnum)).default([]),
  conditionImmunities: z.array(z.enum(conditionTypeEnum)).default([]),
})

export const initiativeSettingsSchema = z.object({
  spacing: z.enum(initiativeSpacingOptions),
  rows: z.array(z.enum(initiativeDefaultRows)),
  widgets: z.array(z.enum(initiativeWidgets)),
  pet: z
    .union([z.enum(initiativePets), z.literal('none')])
    .optional()
    .transform(val => (val === 'none' ? undefined : val)),
  negative: z.boolean(),
  bloodied: z.boolean(),
})

export function initiativeSettingsInitialValues(settings?: InitiativeSettings) {
  const isModified = settings?.modified ?? false

  return {
    spacing: settings?.spacing || 'normal',
    rows: isModified ? settings?.rows || [] : [...initiativeDefaultRows],
    widgets: isModified ? settings?.widgets || [] : [...initiativeWidgets],
    pet: settings?.pet || undefined,
    negative: settings?.negative || false,
    bloodied: isBloodiedEnabled(settings),
  }
}

export function homebrewFormSchema({
  isEncounter,
  isEditingRow,
  t,
}: {
  isEncounter: boolean
  isEditingRow: boolean
  t: (key: string) => string
}) {
  return z
    .object({
      type: z.enum(homebrewType),
      amount: z.int().gte(1).lte(15).optional(),
      summoner: z.string().max(50).optional().or(z.literal('')),
      name: z.string().min(3).max(50),
      player: z.string().min(3).max(30).optional().or(z.literal('')),
      level: z.int().gte(1).lte(20).optional(),
      initiative: z.int().gte(1).lte(50).optional(),
      initiativeModifier: z.int().gte(-20).lte(20).optional(),
      armorClass: z.int().gte(1).lte(100).optional(),
      hitPoints: z.int().gte(1).lte(1000).optional(),
      link: z.url().optional().or(z.literal('')),
      hitDice: z
        .string()
        .min(3)
        .max(15)
        .regex(hitDiceExpression, { error: () => t('zod.hitDiceExpression') })
        .optional()
        .or(z.literal('')),
      armorDetail: z.string().max(100).optional().or(z.literal('')),
      proficiencyBonus: z.int().gte(0).lte(10).optional(),
      passivePerception: z.int().gte(0).lte(50).optional(),
      speed: speedSchema.optional(),
      sight: sightSchema.optional(),
      languages: z.array(z.string().min(1).max(50)).max(20),
      abilityScores: abilityScoresSchema.optional(),
      modifiers: abilityBonusSchema.optional(),
      savingThrows: abilityBonusSchema.optional(),
      skillBonuses: skillBonusesSchema.optional(),
      resistancesAndImmunities: resistancesAndImmunitiesSchema.optional(),
      traits: z.array(traitSchema).max(40),
      actions: z.array(actionSchema).max(40),
    })
    .refine(
      data =>
        !isEncounter ||
        isEditingRow ||
        !(['monster', 'summon'].includes(data.type) && !data.amount),
      { error: () => t('zod.required'), path: ['amount'] },
    )
    .refine(
      data => !isEncounter || !(data.type === 'summon' && !data.summoner),
      { error: () => t('zod.required'), path: ['summoner'] },
    )
}

export function homebrewInitialValues(
  source?: HomebrewFormSource,
  { amount, summoner }: { amount?: number; summoner?: string } = {},
) {
  return {
    type: source?.type || 'player',
    summoner,
    name: source?.name || '',
    player: source?.player || '',
    level: source?.level || undefined,
    amount,
    initiative: undefined,
    initiativeModifier: toIntegerOrUndefined(source?.initiativeModifier),
    armorClass: source?.armorClass || undefined,
    hitPoints: source?.hitPoints || undefined,
    link: source?.link || '',
    hitDice: source?.hitDice || '',
    armorDetail: source?.armorDetail || '',
    proficiencyBonus: source?.proficiencyBonus || undefined,
    passivePerception: source?.passivePerception || undefined,
    speed: source?.speed || undefined,
    sight: source?.sight || undefined,
    languages: source?.languages || [],
    abilityScores: source?.abilityScores || undefined,
    modifiers: source?.modifiers || undefined,
    savingThrows: source?.savingThrows || undefined,
    skillBonuses: source?.skillBonuses || undefined,
    resistancesAndImmunities: {
      damageImmunities:
        source?.resistancesAndImmunities?.damageImmunities ?? [],
      damageResistances:
        source?.resistancesAndImmunities?.damageResistances ?? [],
      damageVulnerabilities:
        source?.resistancesAndImmunities?.damageVulnerabilities ?? [],
      conditionImmunities:
        source?.resistancesAndImmunities?.conditionImmunities ?? [],
    },
    traits: (source?.traits ?? []) as { name: string; desc: string }[],
    actions: source?.actions ?? [],
  }
}
