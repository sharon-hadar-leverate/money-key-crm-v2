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
      playbooks: {
        Row: {
          id: string
          name: string
          content: string
          description: string | null
          category: string | null
          is_default: boolean
          created_by: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          content?: string
          description?: string | null
          category?: string | null
          is_default?: boolean
          created_by: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          content?: string
          description?: string | null
          category?: string | null
          is_default?: boolean
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          display_name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          display_name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          display_name?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          content: string
          user_id: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          content: string
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          content?: string
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
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
      questionnaires: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: string | null
          tags: Json
          settings: Json
          is_active: boolean
          display_order: number
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          category?: string | null
          tags?: Json
          settings?: Json
          is_active?: boolean
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          category?: string | null
          tags?: Json
          settings?: Json
          is_active?: boolean
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      questionnaire_fields: {
        Row: {
          id: string
          questionnaire_id: string
          slug: string
          label: string
          field_type: string
          config: Json
          is_required: boolean
          display_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          questionnaire_id: string
          slug: string
          label: string
          field_type?: string
          config?: Json
          is_required?: boolean
          display_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          questionnaire_id?: string
          slug?: string
          label?: string
          field_type?: string
          config?: Json
          is_required?: boolean
          display_order?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_fields_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          id: string
          questionnaire_id: string
          target_type: string
          target_id: string
          respondent_id: string | null
          answers: Json
          status: string
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          questionnaire_id: string
          target_type: string
          target_id: string
          respondent_id?: string | null
          answers?: Json
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          questionnaire_id?: string
          target_type?: string
          target_id?: string
          respondent_id?: string | null
          answers?: Json
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string | null
          metadata: Json
          actor_user_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string | null
          metadata?: Json
          actor_user_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string | null
          metadata?: Json
          actor_user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          created_by: string
          assigned_to: string | null
          lead_id: string | null
          status: string
          priority: string
          due_date: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_by: string
          assigned_to?: string | null
          lead_id?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_by?: string
          assigned_to?: string | null
          lead_id?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
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
          follow_up_at: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          is_new: boolean | null
          landing_page: string | null
          last_name: string | null
          last_seen: string | null
          name: string
          phone: string | null
          playbook_id: string | null
          probability: number | null
          refund_amount: number | null
          commission_rate: number | null
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
          whatsapp_avatar_url: string | null
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
          follow_up_at?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          is_new?: boolean | null
          landing_page?: string | null
          last_name?: string | null
          last_seen?: string | null
          name: string
          phone?: string | null
          playbook_id?: string | null
          probability?: number | null
          refund_amount?: number | null
          commission_rate?: number | null
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
          whatsapp_avatar_url?: string | null
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
          follow_up_at?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          is_new?: boolean | null
          landing_page?: string | null
          last_name?: string | null
          last_seen?: string | null
          name?: string
          phone?: string | null
          playbook_id?: string | null
          probability?: number | null
          refund_amount?: number | null
          commission_rate?: number | null
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
          whatsapp_avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
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
