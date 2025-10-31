export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accompaniments: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_required: boolean | null
          menu_item_id: string | null
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean | null
          menu_item_id?: string | null
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean | null
          menu_item_id?: string | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accompaniments_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json | null
          id: string
          message: string
          read_at: string | null
          read_by: string | null
          restaurant_id: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          read_by?: string | null
          restaurant_id?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          read_by?: string | null
          restaurant_id?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          menu_group_id: string | null
          name: string
          restaurant_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          menu_group_id?: string | null
          name: string
          restaurant_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          menu_group_id?: string | null
          name?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_menu_group_id_fkey"
            columns: ["menu_group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      item_variations: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          menu_item_id: string | null
          name: string
          price_modifier: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          menu_item_id?: string | null
          name: string
          price_modifier?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          menu_item_id?: string | null
          name?: string
          price_modifier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "item_variations_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payment_config: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string | null
          enabled: boolean | null
          id: number
          mobile_money_number: string | null
          mobile_money_provider: string | null
          payment_instructions: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          payment_instructions?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          payment_instructions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      manual_payment_instructions: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          mobile_money_numbers: Json | null
          payment_instructions: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mobile_money_numbers?: Json | null
          payment_instructions?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mobile_money_numbers?: Json | null
          payment_instructions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_groups: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          restaurant_id: string | null
        }
        Insert: {
          base_price: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          restaurant_id?: string | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_date: string | null
          payment_method: string
          payment_proof_url: string | null
          reference_number: string | null
          status: string
          subscription_id: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_date?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          reference_number?: string | null
          status?: string
          subscription_id: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_date?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          reference_number?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          grace_period_end: string | null
          id: string
          paid_at: string | null
          payment_instructions: string | null
          payment_method: string | null
          payment_proof_url: string | null
          reference_number: string | null
          restaurant_id: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          grace_period_end?: string | null
          id?: string
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          reference_number?: string | null
          restaurant_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          grace_period_end?: string | null
          id?: string
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          reference_number?: string | null
          restaurant_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          background_color: string | null
          background_image: string | null
          background_style: string | null
          background_video: string | null
          background_youtube_url: string | null
          brand_color: string | null
          button_style: string | null
          card_background: string | null
          card_shadow: string | null
          card_style: string | null
          created_at: string | null
          current_subscription_id: string | null
          email: string
          font_family: string | null
          grace_period_end_date: string | null
          id: string
          last_payment_date: string | null
          logo_url: string | null
          menu_layout: string | null
          name: string
          notes: string | null
          phone: string
          secondary_color: string | null
          show_animations: boolean | null
          show_logo_border: boolean | null
          slug: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          text_color: string | null
          trial_end_date: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_button_color: string | null
          whatsapp_button_price_bg: string | null
          whatsapp_button_price_color: string | null
          whatsapp_button_style: string | null
          whatsapp_button_text: string | null
          whatsapp_button_text_color: string | null
          whatsapp_number: string
        }
        Insert: {
          background_color?: string | null
          background_image?: string | null
          background_style?: string | null
          background_video?: string | null
          background_youtube_url?: string | null
          brand_color?: string | null
          button_style?: string | null
          card_background?: string | null
          card_shadow?: string | null
          card_style?: string | null
          created_at?: string | null
          current_subscription_id?: string | null
          email: string
          font_family?: string | null
          grace_period_end_date?: string | null
          id?: string
          last_payment_date?: string | null
          logo_url?: string | null
          menu_layout?: string | null
          name: string
          notes?: string | null
          phone: string
          secondary_color?: string | null
          show_animations?: boolean | null
          show_logo_border?: boolean | null
          slug: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          text_color?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_button_color?: string | null
          whatsapp_button_price_bg?: string | null
          whatsapp_button_price_color?: string | null
          whatsapp_button_style?: string | null
          whatsapp_button_text?: string | null
          whatsapp_button_text_color?: string | null
          whatsapp_number: string
        }
        Update: {
          background_color?: string | null
          background_image?: string | null
          background_style?: string | null
          background_video?: string | null
          background_youtube_url?: string | null
          brand_color?: string | null
          button_style?: string | null
          card_background?: string | null
          card_shadow?: string | null
          card_style?: string | null
          created_at?: string | null
          current_subscription_id?: string | null
          email?: string
          font_family?: string | null
          grace_period_end_date?: string | null
          id?: string
          last_payment_date?: string | null
          logo_url?: string | null
          menu_layout?: string | null
          name?: string
          notes?: string | null
          phone?: string
          secondary_color?: string | null
          show_animations?: boolean | null
          show_logo_border?: boolean | null
          slug?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          text_color?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_button_color?: string | null
          whatsapp_button_price_bg?: string | null
          whatsapp_button_price_color?: string | null
          whatsapp_button_style?: string | null
          whatsapp_button_text?: string | null
          whatsapp_button_text_color?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_current_subscription_id_fkey"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string | null
          currency: string
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_menu_items: number | null
          max_tables: number | null
          name: string
          price: number
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_interval?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          max_menu_items?: number | null
          max_tables?: number | null
          name: string
          price: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_menu_items?: number | null
          max_tables?: number | null
          name?: string
          price?: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_interval: string
          cancel_at_period_end: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_date: string | null
          next_billing_date: string | null
          notes: string | null
          plan_id: string
          restaurant_id: string
          status: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_interval?: string
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          plan_id: string
          restaurant_id: string
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_interval?: string
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          plan_id?: string
          restaurant_id?: string
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          name: string
          qr_code_data: string | null
          qr_code_url: string | null
          restaurant_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          qr_code_data?: string | null
          qr_code_url?: string | null
          restaurant_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          qr_code_data?: string | null
          qr_code_url?: string | null
          restaurant_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_notifications: {
        Row: {
          created_at: string | null
          id: string
          message_content: string | null
          message_type: string
          phone_number: string
          restaurant_id: string | null
          sent_at: string | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_content?: string | null
          message_type: string
          phone_number: string
          restaurant_id?: string | null
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_content?: string | null
          message_type?: string
          phone_number?: string
          restaurant_id?: string | null
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_system_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: string
      }
      check_restaurant_subscription_access: {
        Args: { restaurant_id: string }
        Returns: boolean
      }
      check_subscription_access: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      create_user_subscription: {
        Args: {
          p_billing_interval?: string
          p_plan_id: string
          p_restaurant_id?: string
          p_user_id: string
        }
        Returns: string
      }
      get_admin_dashboard_data: {
        Args: never
        Returns: {
          active_restaurants: number
          recent_signups: number
          total_restaurants: number
          total_users: number
          trial_restaurants: number
        }[]
      }
      get_public_restaurant_data: {
        Args: { restaurant_slug: string }
        Returns: {
          background_color: string
          background_style: string
          brand_color: string
          button_style: string
          card_shadow: string
          card_style: string
          font_family: string
          id: string
          logo_url: string
          menu_layout: string
          name: string
          whatsapp_button_color: string
          whatsapp_button_style: string
          whatsapp_button_text: string
          whatsapp_button_text_color: string
        }[]
      }
      get_restaurant_menu_data: {
        Args: { restaurant_slug: string }
        Returns: {
          background_color: string
          background_style: string
          brand_color: string
          button_style: string
          card_shadow: string
          card_style: string
          category_id: string
          category_name: string
          category_order: number
          font_family: string
          item_available: boolean
          item_description: string
          item_id: string
          item_image_url: string
          item_name: string
          item_order: number
          item_price: number
          logo_url: string
          menu_layout: string
          restaurant_email: string
          restaurant_id: string
          restaurant_name: string
          restaurant_phone: string
          restaurant_whatsapp: string
          whatsapp_button_color: string
          whatsapp_button_text: string
        }[]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_system_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      user_owns_restaurant: {
        Args: { restaurant_id: string }
        Returns: boolean
      }
      validate_whatsapp_number: { Args: { _number: string }; Returns: boolean }
      verify_admin_access: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: "super_admin" | "admin"
      payment_status: "pending" | "verified" | "rejected"
      subscription_status: "pending" | "active" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["super_admin", "admin"],
      payment_status: ["pending", "verified", "rejected"],
      subscription_status: ["pending", "active", "expired", "cancelled"],
    },
  },
} as const
