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
      menu_groups: {
        Row: {
          add_button_bg_color: string | null
          add_button_border_radius: string | null
          add_button_hover_bg_color: string | null
          add_button_text_color: string | null
          background_color: string | null
          background_image: string | null
          background_style: string | null
          background_video: string | null
          background_youtube_url: string | null
          body_font_size: string | null
          body_line_height: string | null
          brand_color: string | null
          button_style: string | null
          card_background: string | null
          card_background_color: string | null
          card_border_color: string | null
          card_border_radius: string | null
          card_padding: string | null
          card_shadow: string | null
          card_style: string | null
          cart_button_bg_color: string | null
          cart_button_border_radius: string | null
          cart_button_text_color: string | null
          cart_continue_button_bg: string | null
          cart_continue_button_text: string | null
          cart_dialog_bg_color: string | null
          cart_dialog_border_radius: string | null
          cart_dialog_header_bg_color: string | null
          cart_item_bg_color: string | null
          cart_item_text_color: string | null
          cart_remove_button_color: string | null
          cart_total_text_color: string | null
          category_button_active_bg_color: string | null
          category_button_active_text_color: string | null
          category_button_bg_color: string | null
          category_button_border_radius: string | null
          category_button_text_color: string | null
          created_at: string
          description: string
          display_order: number
          font_family: string | null
          global_border_radius: string | null
          global_spacing: string | null
          header_background_overlay: string | null
          header_font_size: string | null
          header_font_weight: string | null
          header_text_color: string | null
          header_text_shadow: boolean | null
          heading_font_family: string | null
          heading_font_size: string | null
          id: string
          image_aspect_ratio: string | null
          image_border_radius: string | null
          is_active: boolean
          logo_border_color: string | null
          logo_border_radius: string | null
          logo_border_width: string | null
          logo_show_border: boolean | null
          logo_url: string | null
          menu_layout: string | null
          name: string
          price_font_size: string | null
          price_font_weight: string | null
          price_text_color: string | null
          quantity_button_bg_color: string | null
          quantity_button_text_color: string | null
          quantity_text_color: string | null
          restaurant_id: string
          search_bg_color: string | null
          search_border_radius: string | null
          search_text_color: string | null
          secondary_color: string | null
          show_animations: boolean | null
          show_logo_border: boolean | null
          slug: string
          text_color: string | null
          translations: Json
          updated_at: string
          whatsapp_button_bg_color: string | null
          whatsapp_button_border_radius: string | null
          whatsapp_button_color: string | null
          whatsapp_button_price_bg: string | null
          whatsapp_button_price_color: string | null
          whatsapp_button_style: string | null
          whatsapp_button_text: string | null
          whatsapp_button_text_color: string | null
        }
      }
    }
  }
}
