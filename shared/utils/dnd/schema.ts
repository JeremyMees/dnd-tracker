import { z } from 'zod'
import { abilityType } from '~~/constants/validation'
import { sanitizeCondition } from './row'

export const deathSavesSchema = z.object({
  save: z.tuple([z.boolean(), z.boolean(), z.boolean()]),
  fail: z.tuple([z.boolean(), z.boolean(), z.boolean()]),
})

export const resourceUsesSchema = z
  .object({
    legendaryActions: z.int().min(0).max(10).optional(),
    legendaryResistances: z.int().min(0).max(10).optional(),
    reaction: z.boolean().optional(),
    actions: z
      .record(z.string().min(1).max(100), z.int().min(0).max(10))
      .optional(),
  })
  .strict()

export const conditionDurationSchema = z
  .object({
    rowId: z.string().min(1),
    timing: z.enum(['start', 'end']),
    rounds: z.int().min(1).max(100).nullish(),
    save: z
      .object({
        ability: z.enum(abilityType),
        dc: z.int().min(1).max(30),
      })
      .nullish(),
  })
  .refine(duration => !!duration.rounds || !!duration.save)

export const conditionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    desc: z.string(),
    level: z.number().nullish(),
    hasLevels: z.boolean().nullish(),
    duration: conditionDurationSchema.nullish(),
  })
  .transform(sanitizeCondition)

export const rowPatchSchema = z
  .object({
    hitPoints: z.number().int().optional(),
    maxHitPoints: z.number().int().optional(),
    maxHitPointsOld: z.number().int().nullish(),
    tempHitPoints: z.number().int().optional(),
    armorClass: z.number().int().optional(),
    maxArmorClass: z.number().int().optional(),
    maxArmorClassOld: z.number().int().nullish(),
    tempArmorClass: z.number().int().optional(),
    conditions: z.array(conditionSchema).optional(),
    deathSaves: deathSavesSchema.optional(),
    concentration: z.boolean().optional(),
    readied: z.boolean().optional(),
    hidden: z.boolean().optional(),
    resources: resourceUsesSchema.optional(),
    name: z.string().trim().min(2).max(50).optional(),
    note: z.string().max(250).optional(),
  })
  .strict()
