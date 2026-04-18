import type { MergeDeep } from 'type-fest'
import type { Database } from './database-generated'

interface AllActions {
  actions: Action[]
  bonus_actions: Action[]
  legendary_actions: Action[]
  reactions: Action[]
  mythic_actions: Action[]
  special_abilities: Action[]
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
          info_cards: Open5eItem[]
        }
        Insert: {
          rows: InitiativeSheetRow[]
          settings?: InitiativeSettings
          info_cards?: Open5eItem[]
        }
        Update: {
          rows?: InitiativeSheetRow[]
          settings?: InitiativeSettings
          info_cards?: Open5eItem[]
        }
      }
      monsters: {
        Row: AllActions
        Insert: Partial<AllActions>
        Update: Partial<AllActions>
      }
      profiles: {
        Row: {
          avatar_options?: Record<string, string | number>
        }
        Insert: {
          avatar_options?: Record<string, string | number>
        }
        Update: {
          avatar_options?: Record<string, string | number>
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
