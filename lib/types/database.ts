export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          permissions: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          permissions?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          permissions?: any
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          display_order: number
          parent_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          price: number
          compare_at_price: number | null
          stock_quantity: number
          low_stock_threshold: number
          sku: string | null
          weight: number | null
          dimensions: any | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          price: number
          compare_at_price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          sku?: string | null
          weight?: number | null
          dimensions?: any | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          price?: number
          compare_at_price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          sku?: string | null
          weight?: number | null
          dimensions?: any | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          alt_text: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          value: string
          price: number | null
          stock: number
          sku: string | null
          color_code: string | null
          color_image: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          value: string
          price?: number | null
          stock?: number
          sku?: string | null
          color_code?: string | null
          color_image?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          value?: string
          price?: number | null
          stock?: number
          sku?: string | null
          color_code?: string | null
          color_image?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          product_id: string
          category_id: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          category_id: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          category_id?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: string
          subtotal: number
          tax: number
          shipping: number
          total: number
          currency: string
          shipping_name: string
          shipping_email: string
          shipping_phone: string | null
          shipping_address1: string
          shipping_address2: string | null
          shipping_city: string
          shipping_state: string
          shipping_zip: string
          shipping_country: string
          billing_name: string | null
          billing_email: string | null
          billing_phone: string | null
          billing_address1: string | null
          billing_address2: string | null
          billing_city: string | null
          billing_state: string | null
          billing_zip: string | null
          billing_country: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          status?: string
          subtotal: number
          tax?: number
          shipping?: number
          total: number
          currency?: string
          shipping_name: string
          shipping_email: string
          shipping_phone?: string | null
          shipping_address1: string
          shipping_address2?: string | null
          shipping_city: string
          shipping_state: string
          shipping_zip: string
          shipping_country?: string
          billing_name?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          billing_address1?: string | null
          billing_address2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip?: string | null
          billing_country?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: string
          subtotal?: number
          tax?: number
          shipping?: number
          total?: number
          currency?: string
          shipping_name?: string
          shipping_email?: string
          shipping_phone?: string | null
          shipping_address1?: string
          shipping_address2?: string | null
          shipping_city?: string
          shipping_state?: string
          shipping_zip?: string
          shipping_country?: string
          billing_name?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          billing_address1?: string | null
          billing_address2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip?: string | null
          billing_country?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          product_variant_id: string | null
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          product_variant_id?: string | null
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          product_id: string
          rating: number
          title: string | null
          comment: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          rating: number
          title?: string | null
          comment?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}