import { z } from 'zod'
import { damageTypes, conditionTypes, attackTypes, diceTypes, distanceUnits, usageTypes } from '~~/constants/dnd'
import { abilityType, actionType } from '~~/constants/validation'

export const skillBonusesSchema = z.object({
  acrobatics: z.number().gte(-10).lte(20).optional(),
  animalHandling: z.number().gte(-10).lte(20).optional(),
  arcana: z.number().gte(-10).lte(20).optional(),
  athletics: z.number().gte(-10).lte(20).optional(),
  deception: z.number().gte(-10).lte(20).optional(),
  history: z.number().gte(-10).lte(20).optional(),
  insight: z.number().gte(-10).lte(20).optional(),
  intimidation: z.number().gte(-10).lte(20).optional(),
  investigation: z.number().gte(-10).lte(20).optional(),
  medicine: z.number().gte(-10).lte(20).optional(),
  nature: z.number().gte(-10).lte(20).optional(),
  perception: z.number().gte(-10).lte(20).optional(),
  performance: z.number().gte(-10).lte(20).optional(),
  persuasion: z.number().gte(-10).lte(20).optional(),
  religion: z.number().gte(-10).lte(20).optional(),
  sleightOfHand: z.number().gte(-10).lte(20).optional(),
  stealth: z.number().gte(-10).lte(20).optional(),
  survival: z.number().gte(-10).lte(20).optional(),
})

export const traitSchema = z.object({
  name: z.string().min(3).max(30),
  desc: z.string().min(10).max(1000),
})

export const abilityScoresSchema = z.object({
  strength: z.number().gte(1).lte(30).optional(),
  dexterity: z.number().gte(1).lte(30).optional(),
  constitution: z.number().gte(1).lte(30).optional(),
  intelligence: z.number().gte(1).lte(30).optional(),
  wisdom: z.number().gte(1).lte(30).optional(),
  charisma: z.number().gte(1).lte(30).optional(),
})

export const abilityBonusSchema = z.object({
  strength: z.number().gte(-10).lte(20).optional(),
  dexterity: z.number().gte(-10).lte(20).optional(),
  constitution: z.number().gte(-10).lte(20).optional(),
  intelligence: z.number().gte(-10).lte(20).optional(),
  wisdom: z.number().gte(-10).lte(20).optional(),
  charisma: z.number().gte(-10).lte(20).optional(),
})

export const speedSchema = z.object({
  walk: z.number().gte(0).lte(500).optional(),
  crawl: z.number().gte(0).lte(500).optional(),
  fly: z.number().gte(0).lte(500).optional(),
  swim: z.number().gte(0).lte(500).optional(),
  burrow: z.number().gte(0).lte(500).optional(),
  climb: z.number().gte(0).lte(500).optional(),
  hover: z.boolean().optional(),
})

export const sightSchema = z.object({
  normalSightRange: z.number().gte(0).lte(10000).optional(),
  darkVisionRange: z.number().gte(0).lte(10000).optional(),
  blindSightRange: z.number().gte(0).lte(10000).optional(),
  tremorSenseRange: z.number().gte(0).lte(10000).optional(),
  trueSightRange: z.number().gte(0).lte(10000).optional(),
})

const damageTypeEnum = damageTypes as [DndDamageType, ...DndDamageType[]]
const conditionTypeEnum = conditionTypes as [DndConditionType, ...DndConditionType[]]
const attackTypeEnum = attackTypes as [DndAttackType, ...DndAttackType[]]
const diceTypeEnum = diceTypes as [DndDice, ...DndDice[]]
const distanceUnitEnum = distanceUnits as [DndDistanceUnit, ...DndDistanceUnit[]]
const usageTypeEnum = usageTypes as [DndUsageType, ...DndUsageType[]]
const actionTypeEnum = [...actionType] as [DndActionType, ...DndActionType[]]
const abilityTypeEnum = [...abilityType] as [DndAbility, ...DndAbility[]]

export const attackSchema = z.object({
  name: z.string().min(1).max(50),
  attackType: z.enum(attackTypeEnum),
  toHitMod: z.number().gte(-20).lte(30).optional(),
  distanceUnit: z.enum(distanceUnitEnum),
  reach: z.number().gte(0).lte(1200).optional(),
  range: z.number().gte(0).lte(1200).optional(),
  longRange: z.number().gte(0).lte(1200).optional(),
  targetCreatureOnly: z.boolean().optional(),
  damageDieCount: z.number().gte(1).lte(100).optional(),
  damageDieType: z.enum(diceTypeEnum).optional(),
  damageBonus: z.number().gte(-20).lte(100).optional(),
  damageType: z.enum(damageTypeEnum).optional(),
  extraDamageDieCount: z.number().gte(1).lte(100).optional(),
  extraDamageDieType: z.enum(diceTypeEnum).optional(),
  extraDamageBonus: z.number().gte(-20).lte(100).optional(),
  extraDamageType: z.enum(damageTypeEnum).optional(),
  spellSave: z.number().gte(1).lte(30).optional(),
  spellSaveType: z.enum(abilityTypeEnum).optional(),
})

export const usageLimitsSchema = z.object({
  type: z.enum(usageTypeEnum),
  param: z.number().gte(1).lte(100),
})

export const actionSchema = z.object({
  actionType: z.enum(actionTypeEnum),
  name: z.string().min(3).max(100),
  desc: z.string().min(1).max(2000),
  attacks: z.array(attackSchema).max(10),
  legendaryActionCost: z.number().gte(1).lte(10).optional(),
  limitedToForm: z.string().max(50).optional().or(z.literal('')),
  usageLimits: usageLimitsSchema.optional(),
})

export const resistancesAndImmunitiesSchema = z.object({
  damageImmunities: z.array(z.enum(damageTypeEnum)).default([]),
  damageResistances: z.array(z.enum(damageTypeEnum)).default([]),
  damageVulnerabilities: z.array(z.enum(damageTypeEnum)).default([]),
  conditionImmunities: z.array(z.enum(conditionTypeEnum)).default([]),
})
