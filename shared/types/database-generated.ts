export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '10.2.0 (e07807d)'
  }
  public: {
    Tables: {
      badges: {
        Row: {
          background: string
          code: string | null
          color: string
          created_at: string
          description: Json
          icon: string
          id: number
          label: Json
        }
        Insert: {
          background: string
          code?: string | null
          color: string
          created_at?: string
          description: Json
          icon: string
          id?: number
          label: Json
        }
        Update: {
          background?: string
          code?: string | null
          color?: string
          created_at?: string
          description?: Json
          icon?: string
          id?: number
          label?: Json
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          created_by: string
          id: number
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: number
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          created_by: string
          id: number
          status: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text?: string
          title?: string
          voted?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'features_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      homebrew_items: {
        Row: {
          ac: number | null
          actions: Json
          campaign: number
          created_at: string
          health: number | null
          id: number
          initiative_modifier: string | null
          legendary_actions: Json
          link: string | null
          name: string
          player: string | null
          reactions: Json
          special_abilities: Json
          type: Database['public']['Enums']['homebrew_type']
        }
        Insert: {
          ac?: number | null
          actions: Json
          campaign: number
          created_at?: string
          health?: number | null
          id?: number
          initiative_modifier?: string | null
          legendary_actions: Json
          link?: string | null
          name: string
          player?: string | null
          reactions: Json
          special_abilities: Json
          type?: Database['public']['Enums']['homebrew_type']
        }
        Update: {
          ac?: number | null
          actions?: Json
          campaign?: number
          created_at?: string
          health?: number | null
          id?: number
          initiative_modifier?: string | null
          legendary_actions?: Json
          link?: string | null
          name?: string
          player?: string | null
          reactions?: Json
          special_abilities?: Json
          type?: Database['public']['Enums']['homebrew_type']
        }
        Relationships: [
          {
            foreignKeyName: 'homebrew_items_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      initiative_sheets: {
        Row: {
          activeIndex: number
          campaign: number | null
          created_at: string | null
          created_by: string
          id: number
          info: string | null
          info_cards: Json
          round: number
          rows: Json
          settings: Json | null
          title: string
        }
        Insert: {
          activeIndex?: number
          campaign?: number | null
          created_at?: string | null
          created_by?: string
          id?: number
          info?: string | null
          info_cards?: Json
          round?: number
          rows: Json
          settings?: Json | null
          title: string
        }
        Update: {
          activeIndex?: number
          campaign?: number | null
          created_at?: string | null
          created_by?: string
          id?: number
          info?: string | null
          info_cards?: Json
          round?: number
          rows?: Json
          settings?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'initiative_sheets_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'initiative_sheets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      join_campaign: {
        Row: {
          campaign: number
          created_at: string
          id: number
          role: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Insert: {
          campaign: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Update: {
          campaign?: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          token?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: 'join_campaign_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'join_campaign_user_fkey'
            columns: ['user']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notes: {
        Row: {
          campaign: number
          created_at: string | null
          id: number
          text: string | null
          title: string
        }
        Insert: {
          campaign: number
          created_at?: string | null
          id?: number
          text?: string | null
          title: string
        }
        Update: {
          campaign?: number
          created_at?: string | null
          id?: number
          text?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notes_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          avatar_options: Json | null
          badges: Json
          completedTour: boolean
          created_at: string
          email: string
          id: string
          marketing: boolean
          name: string
          stripe_id: string | null
          stripe_session_id: string | null
          subscription_type: Database['public']['Enums']['subscription_type']
          temp_subscription: Database['public']['Enums']['subscription_type']
          username: string
        }
        Insert: {
          avatar: string
          avatar_options?: Json | null
          badges?: Json
          completedTour?: boolean
          created_at?: string
          email: string
          id: string
          marketing?: boolean
          name: string
          stripe_id?: string | null
          stripe_session_id?: string | null
          subscription_type?: Database['public']['Enums']['subscription_type']
          temp_subscription?: Database['public']['Enums']['subscription_type']
          username: string
        }
        Update: {
          avatar?: string
          avatar_options?: Json | null
          badges?: Json
          completedTour?: boolean
          created_at?: string
          email?: string
          id?: string
          marketing?: boolean
          name?: string
          stripe_id?: string | null
          stripe_session_id?: string | null
          subscription_type?: Database['public']['Enums']['subscription_type']
          temp_subscription?: Database['public']['Enums']['subscription_type']
          username?: string
        }
        Relationships: []
      }
      team: {
        Row: {
          campaign: number
          created_at: string
          id: number
          role: Database['public']['Enums']['user_role']
          user: string
        }
        Insert: {
          campaign: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          user: string
        }
        Update: {
          campaign?: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_user_fkey'
            columns: ['user']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never, Returns: number }
      show_trgm: { Args: { '': string }, Returns: string[] }
    }
    Enums: {
      feature_request_status: 'review' | 'accepted' | 'progress' | 'added'
      homebrew_type: 'player' | 'summon' | 'npc' | 'monster' | 'lair'
      initiative_pet:
        | 'cat'
        | 'chicken'
        | 'barmaid'
        | 'crawler'
        | 'dragon'
        | 'fairy'
        | 'redcap'
        | 'wolf-rider'
      subscription_type: 'free' | 'medior' | 'pro'
      table_spacing: 'compact' | 'normal' | 'cozy'
      user_role: 'Viewer' | 'Admin' | 'Owner' | 'Player'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      feature_request_status: ['review', 'accepted', 'progress', 'added'],
      homebrew_type: ['player', 'summon', 'npc', 'monster', 'lair'],
      initiative_pet: [
        'cat',
        'chicken',
        'barmaid',
        'crawler',
        'dragon',
        'fairy',
        'redcap',
        'wolf-rider',
      ],
      subscription_type: ['free', 'medior', 'pro'],
      table_spacing: ['compact', 'normal', 'cozy'],
      user_role: ['Viewer', 'Admin', 'Owner', 'Player'],
    },
  },
} as const
