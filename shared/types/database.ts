import type { MergeDeep } from 'type-fest'
import type { Database } from './database-generated'

interface HomebrewItemRow {
  actions: DndAction[]
  abilityScores: DndAbilityScores | null
  modifiers: DndModifiers | null
  savingThrows: DndSavingThrowBonuses | null
  skillBonuses: DndSkillBonuses | null
  speed: DndSpeed | null
  sight: DndSight | null
  languages: string[] | null
  resistancesAndImmunities: DndResistancesAndImmunities | null
  traits: DndTrait[] | null
}

interface HomebrewItemInsert {
  actions: DndAction[]
  abilityScores?: DndAbilityScores | null
  modifiers?: DndModifiers | null
  savingThrows?: DndSavingThrowBonuses | null
  skillBonuses?: DndSkillBonuses | null
  speed?: DndSpeed | null
  sight?: DndSight | null
  languages?: string[] | null
  resistancesAndImmunities?: DndResistancesAndImmunities | null
  traits?: DndTrait[] | null
}

interface LiveSeat {
  seat: string
  row: string | null
  name: string
  spectator: boolean
}

interface DatabaseOverrides {
  public: {
    Tables: {
      homebrew_items: {
        Row: HomebrewItemRow
        Insert: HomebrewItemInsert
        Update: Partial<HomebrewItemRow>
      }
      initiative_sheets: {
        Row: {
          rows: InitiativeSheetRow[]
          settings: InitiativeSettings
          infoCards: DndItem[]
        }
        Insert: {
          rows: InitiativeSheetRow[]
          settings?: InitiativeSettings
          infoCards?: DndItem[]
        }
        Update: {
          rows?: InitiativeSheetRow[]
          settings?: InitiativeSettings
          infoCards?: DndItem[]
        }
      }
      profiles: {
        Row: {
          avatarOptions?: Record<string, string | number>
        }
        Insert: {
          avatarOptions?: Record<string, string | number>
        }
        Update: {
          avatarOptions?: Record<string, string | number>
        }
      }
      live_sessions: {
        Row: {
          seats: LiveSeat[]
        }
        Insert: {
          seats?: LiveSeat[]
        }
        Update: {
          seats?: LiveSeat[]
        }
      }
    }
    Functions: {
      claim_live_seat: {
        Args: {
          p_session: string
          p_row: string | null
          p_name: string
          p_spectator: boolean
        }
        Returns: LiveSeat
      }
      apply_live_action: {
        Args: {
          p_encounter: number
          p_row_id: string
          p_patch: Partial<InitiativeSheetRow>
        }
        Returns: InitiativeSheetRow
      }
    }
  }
}

// Override the Json type with more specific types that are the same as the json schema
export type DB = MergeDeep<Database, DatabaseOverrides>
