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
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          createdAt: string | null
          createdBy: string
          id: number
          title: string
        }
        Insert: {
          createdAt?: string | null
          createdBy: string
          id?: number
          title: string
        }
        Update: {
          createdAt?: string | null
          createdBy?: string
          id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_created_by_fkey'
            columns: ['createdBy']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      features: {
        Row: {
          createdAt: string
          createdBy: string
          id: number
          status: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted: Json
        }
        Insert: {
          createdAt?: string
          createdBy: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted?: Json
        }
        Update: {
          createdAt?: string
          createdBy?: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text?: string
          title?: string
          voted?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'features_created_by_fkey'
            columns: ['createdBy']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      homebrew_items: {
        Row: {
          abilityScores: Json | null
          actions: Json
          armorClass: number | null
          armorDetail: string | null
          campaign: number
          createdAt: string
          hitDice: string | null
          hitPoints: number | null
          id: number
          initiativeModifier: string | null
          languages: Json | null
          link: string | null
          modifiers: Json | null
          name: string
          passivePerception: number | null
          player: string | null
          proficiencyBonus: number | null
          resistancesAndImmunities: Json | null
          savingThrows: Json | null
          sight: Json | null
          skillBonuses: Json | null
          speed: Json | null
          traits: Json | null
          type: Database['public']['Enums']['homebrew_type']
        }
        Insert: {
          abilityScores?: Json | null
          actions: Json
          armorClass?: number | null
          armorDetail?: string | null
          campaign: number
          createdAt?: string
          hitDice?: string | null
          hitPoints?: number | null
          id?: number
          initiativeModifier?: string | null
          languages?: Json | null
          link?: string | null
          modifiers?: Json | null
          name: string
          passivePerception?: number | null
          player?: string | null
          proficiencyBonus?: number | null
          resistancesAndImmunities?: Json | null
          savingThrows?: Json | null
          sight?: Json | null
          skillBonuses?: Json | null
          speed?: Json | null
          traits?: Json | null
          type?: Database['public']['Enums']['homebrew_type']
        }
        Update: {
          abilityScores?: Json | null
          actions?: Json
          armorClass?: number | null
          armorDetail?: string | null
          campaign?: number
          createdAt?: string
          hitDice?: string | null
          hitPoints?: number | null
          id?: number
          initiativeModifier?: string | null
          languages?: Json | null
          link?: string | null
          modifiers?: Json | null
          name?: string
          passivePerception?: number | null
          player?: string | null
          proficiencyBonus?: number | null
          resistancesAndImmunities?: Json | null
          savingThrows?: Json | null
          sight?: Json | null
          skillBonuses?: Json | null
          speed?: Json | null
          traits?: Json | null
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
          createdAt: string | null
          createdBy: string
          id: number
          info: string | null
          infoCards: Json
          round: number
          rows: Json
          settings: Json | null
          title: string
        }
        Insert: {
          activeIndex?: number
          campaign?: number | null
          createdAt?: string | null
          createdBy?: string
          id?: number
          info?: string | null
          infoCards?: Json
          round?: number
          rows: Json
          settings?: Json | null
          title: string
        }
        Update: {
          activeIndex?: number
          campaign?: number | null
          createdAt?: string | null
          createdBy?: string
          id?: number
          info?: string | null
          infoCards?: Json
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
            columns: ['createdBy']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      join_campaign: {
        Row: {
          campaign: number
          createdAt: string
          id: number
          role: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Insert: {
          campaign: number
          createdAt?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Update: {
          campaign?: number
          createdAt?: string
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
          createdAt: string | null
          id: number
          text: string | null
          title: string
        }
        Insert: {
          campaign: number
          createdAt?: string | null
          id?: number
          text?: string | null
          title: string
        }
        Update: {
          campaign?: number
          createdAt?: string | null
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
          avatarOptions: Json | null
          completedTour: boolean
          createdAt: string
          email: string
          id: string
          marketing: boolean
          name: string
          stripeId: string | null
          stripeSessionId: string | null
          subscriptionType: Database['public']['Enums']['subscription_type']
          tempSubscription: Database['public']['Enums']['subscription_type']
          username: string
        }
        Insert: {
          avatar: string
          avatarOptions?: Json | null
          completedTour?: boolean
          createdAt?: string
          email: string
          id: string
          marketing?: boolean
          name: string
          stripeId?: string | null
          stripeSessionId?: string | null
          subscriptionType?: Database['public']['Enums']['subscription_type']
          tempSubscription?: Database['public']['Enums']['subscription_type']
          username: string
        }
        Update: {
          avatar?: string
          avatarOptions?: Json | null
          completedTour?: boolean
          createdAt?: string
          email?: string
          id?: string
          marketing?: boolean
          name?: string
          stripeId?: string | null
          stripeSessionId?: string | null
          subscriptionType?: Database['public']['Enums']['subscription_type']
          tempSubscription?: Database['public']['Enums']['subscription_type']
          username?: string
        }
        Relationships: []
      }
      team: {
        Row: {
          campaign: number
          createdAt: string
          id: number
          role: Database['public']['Enums']['user_role']
          user: string
        }
        Insert: {
          campaign: number
          createdAt?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          user: string
        }
        Update: {
          campaign?: number
          createdAt?: string
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
      is_valid_languages: { Args: { _j: Json }, Returns: boolean }
      is_valid_resistances: { Args: { _j: Json }, Returns: boolean }
      is_valid_traits: { Args: { _j: Json }, Returns: boolean }
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
