import { z } from 'zod'
import { homebrewType, maxCampaignHomebrews } from '~~/constants/validation'

export const maxTransferFileSize = 2 * 1024 * 1024

export class TransferError extends Error {
  constructor(
    public reason: TransferErrorReason,
    public count?: number,
  ) {
    super(reason)
  }
}

function jsonObject<T>() {
  return z.custom<T>(
    value =>
      typeof value === 'object' && value !== null && !Array.isArray(value),
  )
}

const transferConditionSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string(),
})

const transferRowSchema = z
  .looseObject({
    id: z.string().min(1),
    index: z.int(),
    initiative: z.int(),
    name: z.string().min(1),
    type: z.enum(homebrewType),
    conditions: z.array(transferConditionSchema),
  })
  .transform(({ campaign, homebrew, ...row }) => row as InitiativeSheetRow)

const encounterTransferSchema = z.object({
  title: z.string().trim().min(1).max(30),
  info: z.string().nullish(),
  rows: z.array(transferRowSchema),
  settings: jsonObject<InitiativeSettings>().optional(),
  infoCards: z.array(jsonObject<DndItem>()).max(10).default([]),
  round: z.int().min(1).default(1),
  activeIndex: z.int().min(0).default(0),
})

const homebrewTransferSchema = z.object({
  name: z.string().trim().min(1).max(50),
  type: z.enum(homebrewType).default('player'),
  player: z.string().nullish(),
  armorClass: z.int().nullish(),
  hitPoints: z.int().nullish(),
  link: z.string().nullish(),
  initiativeModifier: z
    .union([z.string(), z.int()])
    .nullish()
    .transform(value => (isDefined(value) ? String(value) : value)),
  hitDice: z.string().nullish(),
  armorDetail: z.string().nullish(),
  proficiencyBonus: z.int().nullish(),
  passivePerception: z.int().nullish(),
  speed: jsonObject<DndSpeed>().nullish(),
  sight: jsonObject<DndSight>().nullish(),
  languages: z.array(z.string()).nullish(),
  abilityScores: jsonObject<DndAbilityScores>().nullish(),
  modifiers: jsonObject<DndModifiers>().nullish(),
  savingThrows: jsonObject<DndSavingThrowBonuses>().nullish(),
  skillBonuses: jsonObject<DndSkillBonuses>().nullish(),
  resistancesAndImmunities: jsonObject<DndResistancesAndImmunities>().nullish(),
  traits: z.array(jsonObject<DndTrait>()).nullish(),
  actions: z.array(jsonObject<DndAction>()).default([]),
})

const transferSchemas: {
  [K in TransferKind]: z.ZodType<TransferItems[K][]>
} = {
  encounters: z.array(encounterTransferSchema).max(250),
  homebrews: z.array(homebrewTransferSchema).max(maxCampaignHomebrews),
}

const transferFileSchema = z.object({
  format: z.literal('dnd-tracker'),
  kind: z.enum(['encounters', 'homebrews']),
  version: z.literal(1),
  items: z.array(z.unknown()),
})

export function toEncounterTransfer(item: EncounterItem): EncounterTransfer {
  return {
    title: item.title,
    info: item.info,
    rows: item.rows.map(({ campaign, homebrew, ...row }) => row),
    settings: item.settings,
    infoCards: item.infoCards,
    round: item.round,
    activeIndex: item.activeIndex,
  }
}

export function toHomebrewTransfer(item: HomebrewItemRow): HomebrewTransfer {
  const { id, campaign, createdAt, ...homebrew } = item

  return homebrew
}

export function createTransferFile<K extends TransferKind>(
  kind: K,
  items: TransferItems[K][],
): TransferFile<K> {
  return {
    format: 'dnd-tracker',
    kind,
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
  }
}

export function transferFileName(kind: TransferKind): string {
  return `dnd-tracker-${kind}-${new Date().toISOString().slice(0, 10)}.json`
}

export function parseTransferFile<K extends TransferKind>(
  text: string,
  kind: K,
): TransferItems[K][] {
  let json: unknown

  try {
    json = JSON.parse(text)
  } catch {
    throw new TransferError('invalidFile')
  }

  const file = transferFileSchema.safeParse(json)

  if (!file.success) throw new TransferError('invalidFile')
  if (file.data.kind !== kind) throw new TransferError('wrongKind')
  if (!file.data.items.length) throw new TransferError('empty')

  const items = transferSchemas[kind].safeParse(file.data.items)

  if (!items.success) throw new TransferError('invalidFile')

  return items.data
}

export async function readTransferFile<K extends TransferKind>(
  file: File,
  kind: K,
): Promise<TransferItems[K][]> {
  if (file.size > maxTransferFileSize) throw new TransferError('tooLarge')

  return parseTransferFile(await file.text(), kind)
}

export function assertTransferRoom(amount: number, room: number): void {
  if (amount > room) throw new TransferError('tooMany', Math.max(room, 0))
}

export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}
