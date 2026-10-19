export type ImportedRecord = Record<string, unknown>

export interface ParsedActionName {
  name: string
  usageLimits?: DndUsageLimits
  legendaryActionCost?: number
  limitedToForm?: string
}

export interface ImportedAction {
  name: string
  desc: string
  actionType: DndActionType
}

export interface StatblockEntry {
  name: string
  desc: string
}

export interface MarkdownStatblock {
  name: string
  properties: Record<string, string>
  abilityScores: Record<string, number>
  sections: Record<string, StatblockEntry[]>
}
