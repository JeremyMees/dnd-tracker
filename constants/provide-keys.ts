import type { EventHookOn } from '@vueuse/core'

export const INITIATIVE_SHEET: InjectionKey<{
  sheet: Ref<InitiativeSheet | undefined>
  update: (
    payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>,
  ) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
  onTurnReminders?: EventHookOn<TurnReminders>
  log?: (events: CombatEventDraft[]) => void
  undo?: () => Promise<boolean>
  canUndo?: Readonly<Ref<boolean>>
  redo?: () => Promise<boolean>
  canRedo?: Readonly<Ref<boolean>>
  activeRow: Ref<InitiativeSheetRow | undefined>
}> = Symbol('initiativeSheet')
