import { z } from 'zod'

export const deathSavesSchema = z.object({
  save: z.tuple([z.boolean(), z.boolean(), z.boolean()]),
  fail: z.tuple([z.boolean(), z.boolean(), z.boolean()]),
})

export const conditionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string(),
  level: z.number().optional(),
  hasLevels: z.boolean().optional(),
})
