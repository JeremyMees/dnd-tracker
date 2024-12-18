import type { MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from './database-generated'

export type { Json } from './database-generated'

// Override the Json type with more specific types that are the same as the json schema
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
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
            badges: BadgeJson[]
            avatar_options?: Record<string, string | number>
          }
          Insert: {
            badges?: BadgeJson[]
            avatar_options?: Record<string, string | number>
          }
          Update: {
            badges?: BadgeJson[]
            avatar_options?: Record<string, string | number>
          }
        }
        badges: {
          Row: {
            description: I18NText
            label: I18NText
          }
          Insert: {
            description: I18NText
            label: I18NText
          }
          Update: {
            description?: I18NText
            label?: I18NText
          }
        }
      }
    }
  }
>
