export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      lead_events: {
        Row: {
          created_at: string | null
          event_type: string
          field_name: string | null
          id: string
          lead_id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_email: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          field_name?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_email?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          field_name?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ad_pos: string | null
          ag_id: string | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          email: string | null
          expected_revenue: number | null
          first_name: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          is_new: boolean | null
          landing_page: string | null
          last_name: string | null
          last_seen: string | null
          name: string
          phone: string | null
          probability: number | null
          referrer: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_data: Json | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ad_pos?: string | null
          ag_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          expected_revenue?: number | null
          first_name?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          is_new?: boolean | null
          landing_page?: string | null
          last_name?: string | null
          last_seen?: string | null
          name: string
          phone?: string | null
          probability?: number | null
          referrer?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_data?: Json | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ad_pos?: string | null
          ag_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          expected_revenue?: number | null
          first_name?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          is_new?: boolean | null
          landing_page?: string | null
          last_name?: string | null
          last_seen?: string | null
          name?: string
          phone?: string | null
          probability?: number | null
          referrer?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_data?: Json | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
