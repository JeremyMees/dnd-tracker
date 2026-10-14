export interface QueryDefaults {
  onError?: (error: string) => void
  onSuccess?: () => void
  onSettled?: (error?: string) => void
}

export type UpdateInitiativeSheetData = Omit<
  Partial<InitiativeSheet>,
  NotUpdatable | 'campaign'
>
