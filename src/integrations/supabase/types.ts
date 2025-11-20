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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          related_table: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          related_table?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          image_url: string
          image_url_desktop: string | null
          image_url_mobile: string | null
          image_url_tablet: string | null
          is_active: boolean
          link_url: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url?: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          created_by: string | null
          excerpt: string
          id: string
          image_url: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string | null
          created_by?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_variant_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_variant_id: string
          quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_variant_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string
          name_en: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar: string
          name_en: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      celebrity_routines: {
        Row: {
          celebrity_name_ar: string
          celebrity_name_en: string | null
          country_ar: string
          country_en: string | null
          created_at: string | null
          display_order: number | null
          evening_routine_ar: string
          evening_routine_en: string | null
          expert_notes_ar: string | null
          expert_notes_en: string | null
          favorite_products: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          morning_routine_ar: string
          morning_routine_en: string | null
          region: string | null
          skin_type: Database["public"]["Enums"]["skin_type"]
          tagline_ar: string | null
          tagline_en: string | null
          tips_ar: string | null
          tips_en: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          celebrity_name_ar: string
          celebrity_name_en?: string | null
          country_ar: string
          country_en?: string | null
          created_at?: string | null
          display_order?: number | null
          evening_routine_ar: string
          evening_routine_en?: string | null
          expert_notes_ar?: string | null
          expert_notes_en?: string | null
          favorite_products?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          morning_routine_ar: string
          morning_routine_en?: string | null
          region?: string | null
          skin_type: Database["public"]["Enums"]["skin_type"]
          tagline_ar?: string | null
          tagline_en?: string | null
          tips_ar?: string | null
          tips_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          celebrity_name_ar?: string
          celebrity_name_en?: string | null
          country_ar?: string
          country_en?: string | null
          created_at?: string | null
          display_order?: number | null
          evening_routine_ar?: string
          evening_routine_en?: string | null
          expert_notes_ar?: string | null
          expert_notes_en?: string | null
          favorite_products?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          morning_routine_ar?: string
          morning_routine_en?: string | null
          region?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"]
          tagline_ar?: string | null
          tagline_en?: string | null
          tips_ar?: string | null
          tips_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          additional_notes: string | null
          admin_notes: string | null
          admin_response: string | null
          age: number
          allergies: string | null
          balanced_diet: boolean
          chronic_diseases: string | null
          cleanser_type: string | null
          consultation_preference: string
          created_at: string
          current_medications: string | null
          daily_water_intake: string
          face_wash_frequency: string
          full_name: string
          gender: string
          id: string
          image_urls: string[] | null
          is_pregnant_nursing: boolean | null
          location: string
          main_concerns: string[]
          moisturizer_type: string | null
          other_concern: string | null
          phone: string
          preferred_contact_time: string
          previous_treatment: boolean
          previous_treatment_details: string | null
          problem_duration: string
          product_preference: string
          removes_makeup: string | null
          responded_at: string | null
          responded_by: string | null
          serum_details: string | null
          skin_type: string | null
          smoking_alcohol: boolean
          status: string
          stress_levels: boolean
          sun_exposure: string
          updated_at: string
          user_id: string | null
          uses_contraceptives: boolean | null
          uses_moisturizer: boolean
          uses_serums: boolean
          uses_sunscreen: boolean
          work_environment: string | null
        }
        Insert: {
          additional_notes?: string | null
          admin_notes?: string | null
          admin_response?: string | null
          age: number
          allergies?: string | null
          balanced_diet: boolean
          chronic_diseases?: string | null
          cleanser_type?: string | null
          consultation_preference: string
          created_at?: string
          current_medications?: string | null
          daily_water_intake: string
          face_wash_frequency: string
          full_name: string
          gender: string
          id?: string
          image_urls?: string[] | null
          is_pregnant_nursing?: boolean | null
          location: string
          main_concerns: string[]
          moisturizer_type?: string | null
          other_concern?: string | null
          phone: string
          preferred_contact_time: string
          previous_treatment: boolean
          previous_treatment_details?: string | null
          problem_duration: string
          product_preference: string
          removes_makeup?: string | null
          responded_at?: string | null
          responded_by?: string | null
          serum_details?: string | null
          skin_type?: string | null
          smoking_alcohol: boolean
          status?: string
          stress_levels: boolean
          sun_exposure: string
          updated_at?: string
          user_id?: string | null
          uses_contraceptives?: boolean | null
          uses_moisturizer: boolean
          uses_serums: boolean
          uses_sunscreen: boolean
          work_environment?: string | null
        }
        Update: {
          additional_notes?: string | null
          admin_notes?: string | null
          admin_response?: string | null
          age?: number
          allergies?: string | null
          balanced_diet?: boolean
          chronic_diseases?: string | null
          cleanser_type?: string | null
          consultation_preference?: string
          created_at?: string
          current_medications?: string | null
          daily_water_intake?: string
          face_wash_frequency?: string
          full_name?: string
          gender?: string
          id?: string
          image_urls?: string[] | null
          is_pregnant_nursing?: boolean | null
          location?: string
          main_concerns?: string[]
          moisturizer_type?: string | null
          other_concern?: string | null
          phone?: string
          preferred_contact_time?: string
          previous_treatment?: boolean
          previous_treatment_details?: string | null
          problem_duration?: string
          product_preference?: string
          removes_makeup?: string | null
          responded_at?: string | null
          responded_by?: string | null
          serum_details?: string | null
          skin_type?: string | null
          smoking_alcohol?: boolean
          status?: string
          stress_levels?: boolean
          sun_exposure?: string
          updated_at?: string
          user_id?: string | null
          uses_contraceptives?: boolean | null
          uses_moisturizer?: boolean
          uses_serums?: boolean
          uses_sunscreen?: boolean
          work_environment?: string | null
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          comment: string
          created_at: string
          customer_image: string | null
          customer_name: string
          display_order: number
          id: string
          is_active: boolean
          rating: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          customer_image?: string | null
          customer_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          rating: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          customer_image?: string | null
          customer_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          rating?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number
          id: string
          is_active: boolean
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percentage: number
          id?: string
          is_active?: boolean
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      drop_hint_settings: {
        Row: {
          button_text_ar: string
          created_at: string
          discount_code: string | null
          discount_suffix_ar: string | null
          formal_message_ar: string
          funny_message_ar: string
          id: string
          is_active: boolean
          updated_at: string
          urgent_message_ar: string
        }
        Insert: {
          button_text_ar?: string
          created_at?: string
          discount_code?: string | null
          discount_suffix_ar?: string | null
          formal_message_ar?: string
          funny_message_ar?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          urgent_message_ar?: string
        }
        Update: {
          button_text_ar?: string
          created_at?: string
          discount_code?: string | null
          discount_suffix_ar?: string | null
          formal_message_ar?: string
          funny_message_ar?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          urgent_message_ar?: string
        }
        Relationships: []
      }
      friendly_stores: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guarantee_settings: {
        Row: {
          banner_button_text_ar: string | null
          banner_button_text_en: string | null
          banner_description_ar: string | null
          banner_description_en: string | null
          banner_title_ar: string | null
          banner_title_en: string | null
          contact_description_ar: string | null
          contact_description_en: string | null
          contact_title_ar: string | null
          contact_title_en: string | null
          created_at: string
          features: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          page_description_ar: string
          page_description_en: string
          page_subtitle_ar: string | null
          page_subtitle_en: string | null
          page_title_ar: string
          page_title_en: string
          terms_ar: string | null
          terms_en: string | null
          updated_at: string
        }
        Insert: {
          banner_button_text_ar?: string | null
          banner_button_text_en?: string | null
          banner_description_ar?: string | null
          banner_description_en?: string | null
          banner_title_ar?: string | null
          banner_title_en?: string | null
          contact_description_ar?: string | null
          contact_description_en?: string | null
          contact_title_ar?: string | null
          contact_title_en?: string | null
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          page_description_ar?: string
          page_description_en?: string
          page_subtitle_ar?: string | null
          page_subtitle_en?: string | null
          page_title_ar?: string
          page_title_en?: string
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string
        }
        Update: {
          banner_button_text_ar?: string | null
          banner_button_text_en?: string | null
          banner_description_ar?: string | null
          banner_description_en?: string | null
          banner_title_ar?: string | null
          banner_title_en?: string | null
          contact_description_ar?: string | null
          contact_description_en?: string | null
          contact_title_ar?: string | null
          contact_title_en?: string | null
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          page_description_ar?: string
          page_description_en?: string
          page_subtitle_ar?: string | null
          page_subtitle_en?: string | null
          page_title_ar?: string
          page_title_en?: string
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      makeup_banner: {
        Row: {
          background_color: string | null
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          text_color: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          text_color?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      makeup_categories: {
        Row: {
          category_id: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "makeup_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_categories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_links: {
        Row: {
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          show_in_navbar: boolean
          show_in_sidebar: boolean
          title_ar: string
          title_en: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon: string
          id?: string
          is_active?: boolean
          show_in_navbar?: boolean
          show_in_sidebar?: boolean
          title_ar: string
          title_en?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          show_in_navbar?: boolean
          show_in_sidebar?: boolean
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_name_ar: string
          product_name_en: string
          product_variant_id: string | null
          quantity: number
          subtotal: number
          variant_size_ar: string
          variant_size_en: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_name_ar: string
          product_name_en: string
          product_variant_id?: string | null
          quantity: number
          subtotal: number
          variant_size_ar: string
          variant_size_en: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_name_ar?: string
          product_name_en?: string
          product_variant_id?: string | null
          quantity?: number
          subtotal?: number
          variant_size_ar?: string
          variant_size_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_address: string
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          discount_code_id: string | null
          id: string
          notes: string | null
          shipping_amount: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_address: string
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          notes?: string | null
          shipping_amount?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          notes?: string | null
          shipping_amount?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          admin_id: string | null
          affected_products_count: number
          change_amount: number
          change_type: string
          created_at: string | null
          id: string
        }
        Insert: {
          admin_id?: string | null
          affected_products_count?: number
          change_amount: number
          change_type: string
          created_at?: string | null
          id?: string
        }
        Update: {
          admin_id?: string | null
          affected_products_count?: number
          change_amount?: number
          change_type?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_clothing_attributes: {
        Row: {
          available_colors: string[] | null
          available_sizes: string[] | null
          care_instructions: string | null
          created_at: string | null
          fit_type: string | null
          id: string
          material: string | null
          product_id: string
          season: string | null
          updated_at: string | null
        }
        Insert: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          care_instructions?: string | null
          created_at?: string | null
          fit_type?: string | null
          id?: string
          material?: string | null
          product_id: string
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          care_instructions?: string | null
          created_at?: string | null
          fit_type?: string | null
          id?: string
          material?: string | null
          product_id?: string
          season?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clothing_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_discounts: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          is_active: boolean
          product_id: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          id?: string
          is_active?: boolean
          product_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          product_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_discounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_makeup_categories: {
        Row: {
          created_at: string
          id: string
          makeup_category_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          makeup_category_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          makeup_category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_makeup_categories_makeup_category_id_fkey"
            columns: ["makeup_category_id"]
            isOneToOne: false
            referencedRelation: "makeup_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_makeup_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string | null
          customer_name: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          customer_name: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          customer_name?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sub_problems: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sub_problem_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sub_problem_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sub_problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sub_problems_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_problems_sub_problem_id_fkey"
            columns: ["sub_problem_id"]
            isOneToOne: false
            referencedRelation: "sub_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          price: number
          product_id: string
          size_ar: string
          size_en: string
          sku: string | null
          stock_quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          product_id: string
          size_ar: string
          size_en: string
          sku?: string | null
          stock_quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          product_id?: string
          size_ar?: string
          size_en?: string
          sku?: string | null
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_watch_attributes: {
        Row: {
          case_diameter: string | null
          case_material: string | null
          created_at: string | null
          dial_color: string | null
          id: string
          movement_type: string | null
          product_id: string
          strap_color: string | null
          strap_type: string | null
          updated_at: string | null
          warranty_years: number | null
          water_resistance: string | null
        }
        Insert: {
          case_diameter?: string | null
          case_material?: string | null
          created_at?: string | null
          dial_color?: string | null
          id?: string
          movement_type?: string | null
          product_id: string
          strap_color?: string | null
          strap_type?: string | null
          updated_at?: string | null
          warranty_years?: number | null
          water_resistance?: string | null
        }
        Update: {
          case_diameter?: string | null
          case_material?: string | null
          created_at?: string | null
          dial_color?: string | null
          id?: string
          movement_type?: string | null
          product_id?: string
          strap_color?: string | null
          strap_type?: string | null
          updated_at?: string | null
          warranty_years?: number | null
          water_resistance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_watch_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          company_name_ar: string | null
          company_name_en: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_expert_choice: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          name_ar: string
          name_en: string
          product_type: string | null
          skin_type: Database["public"]["Enums"]["skin_type"][] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_expert_choice?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          name_ar: string
          name_en: string
          product_type?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"][] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_expert_choice?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          name_ar?: string
          name_en?: string
          product_type?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"][] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_celebrity_routines: {
        Row: {
          created_at: string | null
          id: string
          routine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          routine_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          routine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_celebrity_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "celebrity_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_banners: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          image_url: string
          image_url_desktop: string | null
          image_url_mobile: string | null
          image_url_tablet: string | null
          is_active: boolean
          link_url: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url?: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          created_at: string
          delivery_fee: number
          free_delivery_threshold: number | null
          id: string
          is_free_delivery: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: string
          is_free_delivery?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: string
          is_free_delivery?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about_ar: string | null
          about_en: string | null
          address_ar: string | null
          address_en: string | null
          created_at: string
          currency: string
          dark_accent: string | null
          dark_background: string | null
          dark_border: string | null
          dark_card: string | null
          dark_foreground: string | null
          dark_muted: string | null
          dark_primary: string | null
          dark_secondary: string | null
          email: string | null
          facebook_url: string | null
          footer_text_ar: string | null
          footer_text_en: string | null
          id: string
          instagram_url: string | null
          light_accent: string | null
          light_background: string | null
          light_border: string | null
          light_card: string | null
          light_foreground: string | null
          light_muted: string | null
          light_primary: string | null
          light_secondary: string | null
          logo_url: string | null
          phone: string | null
          store_name: string
          theme_accent_color: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
          tiktok_url: string | null
          updated_at: string
          whatsapp_url: string | null
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          address_ar?: string | null
          address_en?: string | null
          created_at?: string
          currency?: string
          dark_accent?: string | null
          dark_background?: string | null
          dark_border?: string | null
          dark_card?: string | null
          dark_foreground?: string | null
          dark_muted?: string | null
          dark_primary?: string | null
          dark_secondary?: string | null
          email?: string | null
          facebook_url?: string | null
          footer_text_ar?: string | null
          footer_text_en?: string | null
          id?: string
          instagram_url?: string | null
          light_accent?: string | null
          light_background?: string | null
          light_border?: string | null
          light_card?: string | null
          light_foreground?: string | null
          light_muted?: string | null
          light_primary?: string | null
          light_secondary?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          address_ar?: string | null
          address_en?: string | null
          created_at?: string
          currency?: string
          dark_accent?: string | null
          dark_background?: string | null
          dark_border?: string | null
          dark_card?: string | null
          dark_foreground?: string | null
          dark_muted?: string | null
          dark_primary?: string | null
          dark_secondary?: string | null
          email?: string | null
          facebook_url?: string | null
          footer_text_ar?: string | null
          footer_text_en?: string | null
          id?: string
          instagram_url?: string | null
          light_accent?: string | null
          light_background?: string | null
          light_border?: string | null
          light_card?: string | null
          light_foreground?: string | null
          light_muted?: string | null
          light_primary?: string | null
          light_secondary?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      sub_problems: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_problems_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "problem_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tertiary_banners: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          image_url: string
          image_url_desktop: string | null
          image_url_mobile: string | null
          image_url_tablet: string | null
          is_active: boolean
          link_url: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          image_url?: string
          image_url_desktop?: string | null
          image_url_mobile?: string | null
          image_url_tablet?: string | null
          is_active?: boolean
          link_url?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
      update_all_product_prices: {
        Args: {
          amount_to_add: number
          p_admin_id: string
          p_change_type: string
        }
        Returns: {
          updated_count: number
        }[]
      }
    }
    Enums: {
      order_status: "new" | "processing" | "shipped" | "delivered" | "cancelled"
      skin_type: "normal" | "dry" | "oily" | "combination" | "sensitive"
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
      order_status: ["new", "processing", "shipped", "delivered", "cancelled"],
      skin_type: ["normal", "dry", "oily", "combination", "sensitive"],
    },
  },
} as const
