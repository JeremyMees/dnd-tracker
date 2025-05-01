import type { MergeDeep } from 'type-fest'
import type { Database } from './database-generated'

// Override the Json type with more specific types that are the same as the json schema
export type DB = MergeDeep<
  Database,
  {
    public: {
      Tables: {
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
        homebrew_items: {
          Row: {
            actions: Action[]
            legendary_actions: Action[]
            reactions: Action[]
            special_abilities: Action[]
          }
          Insert: {
            actions: Action[]
            legendary_actions: Action[]
            reactions: Action[]
            special_abilities: Action[]
          }
          Update: {
            actions?: Action[]
            legendary_actions?: Action[]
            reactions?: Action[]
            special_abilities?: Action[]
          }
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
>
