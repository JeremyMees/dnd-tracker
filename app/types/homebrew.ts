import type { z } from 'zod'
import type { homebrewFormSchema } from '~/utils/form-schema'

export type HomebrewTab = 'info' | 'stats' | 'traits' | 'actions'

export type HomebrewStartStep = 'type' | 'source' | 'bestiary' | 'file'

export type HomebrewStartSource = 'scratch' | 'bestiary' | 'file'

export type HomebrewFormValues = z.output<ReturnType<typeof homebrewFormSchema>>

export type HomebrewFormSource =
  (Partial<InitiativeSheetRow> & { name: string }) | HomebrewItemRow

export type HomebrewData = Omit<HomebrewItemUpdate, NotUpdatable>

export interface HomebrewSubmission {
  row: InitiativeSheetRowInsert
  homebrew: HomebrewData
  amount?: number
  initiative?: number
  initiativeModifier?: number
  summoner?: string
}
