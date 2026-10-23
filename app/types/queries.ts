import type { QueryKey } from '@tanstack/vue-query'

export interface QueryDefaults {
  onError?: (error: string) => void
  onSuccess?: () => void
  onSettled?: (error?: string) => void
}

export type UpdateInitiativeSheetData = InitiativeSheetUpdate

export type CrudAction = 'create' | 'update' | 'delete' | 'copy'

export interface CrudMutationOptions<TVariables extends QueryDefaults, TData> {
  type: string
  action: CrudAction
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidate: (variables: TVariables) => QueryKey[]
  remove?: (variables: TVariables) => QueryKey[]
}
