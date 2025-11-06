export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accompaniments: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_required: boolean | null;
          menu_item_id: string | null;
          name: string;
          price: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_required?: boolean | null;
          menu_item_id?: string | null;
          name: string;
          price?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_required?: boolean | null;
          menu_item_id?: string | null;
          name?: string;
          price?: number | null;
        };
        Relationships: [];
      };
      admin_notifications: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          data: Json | null;
          id: string;
          message: string;
          read_at: string | null;
          read_by: string | null;
          restaurant_id: string | null;
          status: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          data?: Json | null;
          id?: string;
          message: string;
          read_at?: string | null;
          read_by?: string | null;
          restaurant_id?: string | null;
          status?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          data?: Json | null;
          id?: string;
          message?: string;
          read_at?: string | null;
          read_by?: string | null;
          restaurant_id?: string | null;
          status?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          menu_group_id: string | null;
          name: string;
          restaurant_id: string | null;
          translations: Json | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          menu_group_id?: string | null;
          name: string;
          restaurant_id?: string | null;
          translations?: Json | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          menu_group_id?: string | null;
          name?: string;
          restaurant_id?: string | null;
          translations?: Json | null;
        };
        Relationships: [];
      };
      global_countries: {
        Row: {
          code: string;
          common_languages: Json | null;
          created_at: string | null;
          date_format: string | null;
          default_currency: string | null;
          default_language: string | null;
          default_timezone: string | null;
          is_supported: boolean | null;
          local_name: string | null;
          name: string;
          number_format: Json | null;
          phone_code: string | null;
          time_format: string | null;
        };
        Insert: {
          code: string;
          common_languages?: Json | null;
          created_at?: string | null;
          date_format?: string | null;
          default_currency?: string | null;
          default_language?: string | null;
          default_timezone?: string | null;
          is_supported?: boolean | null;
          local_name?: string | null;
          name: string;
          number_format?: Json | null;
          phone_code?: string | null;
          time_format?: string | null;
        };
        Update: {
          code?: string;
          common_languages?: Json | null;
          created_at?: string | null;
          date_format?: string | null;
          default_currency?: string | null;
          default_language?: string | null;
          default_timezone?: string | null;
          is_supported?: boolean | null;
          local_name?: string | null;
          name?: string;
          number_format?: Json | null;
          phone_code?: string | null;
          time_format?: string | null;
        };
        Relationships: [];
      };
      global_currencies: {
        Row: {
          code: string;
          created_at: string | null;
          decimal_places: number | null;
          exchange_rate_to_usd: number | null;
          is_active: boolean | null;
          name: string;
          symbol: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          decimal_places?: number | null;
          exchange_rate_to_usd?: number | null;
          is_active?: boolean | null;
          name: string;
          symbol: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          decimal_places?: number | null;
          exchange_rate_to_usd?: number | null;
          is_active?: boolean | null;
          name?: string;
          symbol?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      global_languages: {
        Row: {
          code: string;
          created_at: string | null;
          is_active: boolean | null;
          local_name: string | null;
          name: string;
          rtl: boolean | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          is_active?: boolean | null;
          local_name?: string | null;
          name: string;
          rtl?: boolean | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          is_active?: boolean | null;
          local_name?: string | null;
          name?: string;
          rtl?: boolean | null;
        };
        Relationships: [];
      };
      item_variations: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          menu_item_id: string;
          name: string;
          price_modifier: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          menu_item_id: string;
          name: string;
          price_modifier?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          menu_item_id?: string;
          name?: string;
          price_modifier?: number | null;
        };
        Relationships: [];
      };
      menu_groups: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          restaurant_id: string;
          slug: string;
          translations: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          restaurant_id: string;
          slug: string;
          translations?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          restaurant_id?: string;
          slug?: string;
          translations?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          base_price: number;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_available: boolean | null;
          menu_group_id: string | null;
          name: string;
          restaurant_id: string;
          translations: Json | null;
        };
        Insert: {
          base_price: number;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_available?: boolean | null;
          menu_group_id?: string | null;
          name: string;
          restaurant_id: string;
          translations?: Json | null;
        };
        Update: {
          base_price?: number;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_available?: boolean | null;
          menu_group_id?: string | null;
          name?: string;
          restaurant_id?: string;
          translations?: Json | null;
        };
        Relationships: [];
      };
      payment_gateways: {
        Row: {
          config: Json | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          provider: string;
          supported_countries: Json | null;
          supported_currencies: Json | null;
          updated_at: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          provider: string;
          supported_countries?: Json | null;
          supported_currencies?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          provider?: string;
          supported_countries?: Json | null;
          supported_currencies?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          first_name: string | null;
          full_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          full_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          full_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      regional_pricing: {
        Row: {
          country_code: string | null;
          created_at: string | null;
          currency: string | null;
          discount_percentage: number | null;
          id: string;
          plan_id: string | null;
          price: number;
          updated_at: string | null;
        };
        Insert: {
          country_code?: string | null;
          created_at?: string | null;
          currency?: string | null;
          discount_percentage?: number | null;
          id?: string;
          plan_id?: string | null;
          price: number;
          updated_at?: string | null;
        };
        Update: {
          country_code?: string | null;
          created_at?: string | null;
          currency?: string | null;
          discount_percentage?: number | null;
          id?: string;
          plan_id?: string | null;
          price?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          billing_interval: string;
          created_at: string | null;
          currency: string;
          description: string | null;
          display_order: number | null;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          max_menu_items: number | null;
          max_tables: number | null;
          name: string;
          price: number;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          billing_interval?: string;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          display_order?: number | null;
          features?: Json | null;
          id: string;
          is_active?: boolean | null;
          max_menu_items?: number | null;
          max_tables?: number | null;
          name: string;
          price: number;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          billing_interval?: string;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          display_order?: number | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          max_menu_items?: number | null;
          max_tables?: number | null;
          name?: string;
          price?: number;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          address: Json | null;
          background_color: string | null;
          background_image: string | null;
          background_style: string | null;
          background_video: string | null;
          background_youtube_url: string | null;
          brand_color: string | null;
          button_style: string | null;
          card_background: string | null;
          card_shadow: string | null;
          card_style: string | null;
          country: string | null;
          created_at: string | null;
          current_subscription_id: string | null;
          email: string;
          font_family: string | null;
          grace_period_end_date: string | null;
          id: string;
          last_payment_date: string | null;
          logo_url: string | null;
          menu_layout: string | null;
          name: string;
          notes: string | null;
          operating_hours: Json | null;
          phone: string;
          primary_currency: string | null;
          primary_language: string | null;
          secondary_color: string | null;
          show_animations: boolean | null;
          show_logo_border: boolean | null;
          slug: string;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          subscription_status: string | null;
          supported_currencies: Json | null;
          supported_languages: Json | null;
          tax_settings: Json | null;
          text_color: string | null;
          timezone: string | null;
          trial_end_date: string | null;
          updated_at: string | null;
          user_id: string | null;
          whatsapp_button_color: string | null;
          whatsapp_button_price_bg: string | null;
          whatsapp_button_price_color: string | null;
          whatsapp_button_style: string | null;
          whatsapp_button_text: string | null;
          whatsapp_button_text_color: string | null;
          whatsapp_number: string;
        };
        Insert: {
          address?: Json | null;
          background_color?: string | null;
          background_image?: string | null;
          background_style?: string | null;
          background_video?: string | null;
          background_youtube_url?: string | null;
          brand_color?: string | null;
          button_style?: string | null;
          card_background?: string | null;
          card_shadow?: string | null;
          card_style?: string | null;
          country?: string | null;
          created_at?: string | null;
          current_subscription_id?: string | null;
          email: string;
          font_family?: string | null;
          grace_period_end_date?: string | null;
          id?: string;
          last_payment_date?: string | null;
          logo_url?: string | null;
          menu_layout?: string | null;
          name: string;
          notes?: string | null;
          operating_hours?: Json | null;
          phone: string;
          primary_currency?: string | null;
          primary_language?: string | null;
          secondary_color?: string | null;
          show_animations?: boolean | null;
          show_logo_border?: boolean | null;
          slug: string;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          supported_currencies?: Json | null;
          supported_languages?: Json | null;
          tax_settings?: Json | null;
          text_color?: string | null;
          timezone?: string | null;
          trial_end_date?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          whatsapp_button_color?: string | null;
          whatsapp_button_price_bg?: string | null;
          whatsapp_button_price_color?: string | null;
          whatsapp_button_style?: string | null;
          whatsapp_button_text?: string | null;
          whatsapp_button_text_color?: string | null;
          whatsapp_number: string;
        };
        Update: {
          address?: Json | null;
          background_color?: string | null;
          background_image?: string | null;
          background_style?: string | null;
          background_video?: string | null;
          background_youtube_url?: string | null;
          brand_color?: string | null;
          button_style?: string | null;
          card_background?: string | null;
          card_shadow?: string | null;
          card_style?: string | null;
          country?: string | null;
          created_at?: string | null;
          current_subscription_id?: string | null;
          email?: string;
          font_family?: string | null;
          grace_period_end_date?: string | null;
          id?: string;
          last_payment_date?: string | null;
          logo_url?: string | null;
          menu_layout?: string | null;
          name?: string;
          notes?: string | null;
          operating_hours?: Json | null;
          phone?: string;
          primary_currency?: string | null;
          primary_language?: string | null;
          secondary_color?: string | null;
          show_animations?: boolean | null;
          show_logo_border?: boolean | null;
          slug?: string;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          supported_currencies?: Json | null;
          supported_languages?: Json | null;
          tax_settings?: Json | null;
          text_color?: string | null;
          timezone?: string | null;
          trial_end_date?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          whatsapp_button_color?: string | null;
          whatsapp_button_price_bg?: string | null;
          whatsapp_button_price_color?: string | null;
          whatsapp_button_style?: string | null;
          whatsapp_button_text?: string | null;
          whatsapp_button_text_color?: string | null;
          whatsapp_number?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          amount: number;
          billing_interval: string;
          cancel_at_period_end: boolean | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          created_by: string | null;
          currency: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          last_payment_date: string | null;
          next_billing_date: string | null;
          notes: string | null;
          plan_id: string;
          restaurant_id: string;
          status: string;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          billing_interval?: string;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          last_payment_date?: string | null;
          next_billing_date?: string | null;
          notes?: string | null;
          plan_id: string;
          restaurant_id: string;
          status?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          billing_interval?: string;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          last_payment_date?: string | null;
          next_billing_date?: string | null;
          notes?: string | null;
          plan_id?: string;
          restaurant_id?: string;
          status?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
