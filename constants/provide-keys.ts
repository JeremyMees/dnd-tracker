import type { EventHookOn } from '@vueuse/core'

export const INITIATIVE_SHEET: InjectionKey<{
  sheet: Ref<InitiativeSheet | undefined>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  patchRows: (patches: RowPatch[]) => Promise<void>
  editRows: (rows: InitiativeSheetRow[]) => Promise<void>
  updateSheet: (fields: SheetFieldsUpdate) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
  previousTurn: () => Promise<void>
  reset: (hard: boolean) => Promise<void>
  onTurnReminders?: EventHookOn<TurnReminders>
  log?: (events: CombatEventDraft[]) => void
  undo?: () => Promise<boolean>
  canUndo?: Readonly<Ref<boolean>>
  redo?: () => Promise<boolean>
  canRedo?: Readonly<Ref<boolean>>
  activeRow: Ref<InitiativeSheetRow | undefined>
  portal?: Readonly<Ref<boolean>>
  claimedRows?: Readonly<Ref<Set<string>>>
}> = Symbol('initiativeSheet')
