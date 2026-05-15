import type { MergeDeep } from 'type-fest'
import type { Database } from './database-generated'

interface AllActions {
  actions: DndAction[]
}

interface DatabaseOverrides {
  public: {
    Tables: {
      homebrew_items: {
        Row: AllActions
        Insert: AllActions
        Update: Partial<AllActions>
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
    }
  }
}

// Override the Json type with more specific types that are the same as the json schema
export type DB = MergeDeep<
  Database,
  DatabaseOverrides
>
