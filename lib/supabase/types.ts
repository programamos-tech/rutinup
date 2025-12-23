// Tipos generados automáticamente por Supabase
// Estos tipos se pueden generar con: npx supabase gen types typescript --local > lib/supabase/types.ts
// Por ahora, los definimos manualmente basados en nuestro esquema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          city: string | null
          opening_time: string | null
          closing_time: string | null
          timezone: string
          logo_url: string | null
          onboarding_step: number | null
          payment_methods: string[] | null
          plan: 'starter' | 'pro' | 'enterprise'
          status: 'pending' | 'active' | 'suspended' | 'cancelled'
          subscription_start_date: string | null
          subscription_end_date: string | null
          last_payment_date: string | null
          next_payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['gyms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['gyms']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      gym_accounts: {
        Row: {
          id: string
          gym_id: string
          email: string
          name: string
          role: 'admin' | 'receptionist' | 'trainer'
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['gym_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['gym_accounts']['Insert']>
      }
      clients: {
        Row: {
          id: string
          gym_id: string
          name: string
          email: string | null
          phone: string | null
          document_id: string | null
          birth_date: string | null
          address: string | null
          photo_url: string | null
          notes: string | null
          initial_weight: number | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      membership_types: {
        Row: {
          id: string
          gym_id: string
          name: string
          price: number
          duration_days: number
          description: string | null
          includes: Json
          restrictions: Json
          max_capacity: number | null
          is_active: boolean
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['membership_types']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['membership_types']['Insert']>
      }
      membership_clients: {
        Row: {
          id: string
          membership_id: string
          client_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['membership_clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['membership_clients']['Insert']>
      }
      memberships: {
        Row: {
          id: string
          gym_id: string
          client_id: string | null
          membership_type_id: string
          start_date: string
          end_date: string
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['memberships']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
      }
      payments: {
        Row: {
          id: string
          gym_id: string
          client_id: string
          membership_id: string | null
          amount: number
          method: 'cash' | 'card' | 'transfer' | 'other'
          payment_date: string
          status: 'completed' | 'pending' | 'cancelled'
          notes: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      trainers: {
        Row: {
          id: string
          gym_id: string
          name: string
          email: string | null
          phone: string | null
          specialization: string | null
          bio: string | null
          photo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trainers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trainers']['Insert']>
      }
      classes: {
        Row: {
          id: string
          gym_id: string
          trainer_id: string
          name: string
          description: string | null
          days_of_week: number[]
          start_time: string
          duration: number
          capacity: number
          requires_membership: boolean
          color: string
          status: 'active' | 'inactive' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      class_enrollments: {
        Row: {
          id: string
          gym_id: string
          class_id: string
          client_id: string
          enrolled_at: string
        }
        Insert: Omit<Database['public']['Tables']['class_enrollments']['Row'], 'id' | 'enrolled_at'>
        Update: Partial<Database['public']['Tables']['class_enrollments']['Insert']>
      }
      attendances: {
        Row: {
          id: string
          gym_id: string
          class_id: string
          client_id: string
          attendance_date: string
          present: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendances']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>
      }
      medical_records: {
        Row: {
          id: string
          gym_id: string
          client_id: string
          condition: string
          description: string | null
          restrictions: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_records']['Insert']>
      }
      communications: {
        Row: {
          id: string
          gym_id: string
          client_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          subject: string | null
          message: string
          sent_at: string
          status: 'sent' | 'failed' | 'pending'
        }
        Insert: Omit<Database['public']['Tables']['communications']['Row'], 'id' | 'sent_at'>
        Update: Partial<Database['public']['Tables']['communications']['Insert']>
      }
      weight_records: {
        Row: {
          id: string
          gym_id: string
          client_id: string
          weight: number
          recorded_at: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weight_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weight_records']['Insert']>
      }
      goals: {
        Row: {
          id: string
          gym_id: string
          client_id: string
          title: string
          description: string | null
          target_weight: number | null
          target_date: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_gym_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_gym_and_user: {
        Args: {
          p_user_id: string
          p_gym_name: string
          p_user_email: string
          p_user_name: string
        }
        Returns: {
          success: boolean
          gym_id?: string
          user_id?: string
          error?: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

