export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sku: string | null;
          base_cost: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sku?: string | null;
          base_cost: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sku?: string | null;
          base_cost?: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_markets: {
        Row: {
          id: string;
          product_id: string;
          channel: string;
          sub_option_id: string | null;
          selling_price: number;
          platform_fee_rate: number;
          payment_fee_rate: number;
          additional_costs: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          channel: string;
          sub_option_id?: string | null;
          selling_price: number;
          platform_fee_rate: number;
          payment_fee_rate: number;
          additional_costs?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          channel?: string;
          sub_option_id?: string | null;
          selling_price?: number;
          platform_fee_rate?: number;
          payment_fee_rate?: number;
          additional_costs?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          user_id: string;
          custom_presets: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          custom_presets?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          custom_presets?: Json | null;
          updated_at?: string;
        };
      };
      sales_records: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          product_market_id: string | null;
          channel: string;
          sale_date: string;
          quantity: number;
          unit_price: number;
          total_revenue: number;
          platform_fee: number;
          payment_fee: number;
          net_profit: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          product_market_id?: string | null;
          channel: string;
          sale_date: string;
          quantity: number;
          unit_price: number;
          total_revenue: number;
          platform_fee?: number;
          payment_fee?: number;
          net_profit?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          product_market_id?: string | null;
          channel?: string;
          sale_date?: string;
          quantity?: number;
          unit_price?: number;
          total_revenue?: number;
          platform_fee?: number;
          payment_fee?: number;
          net_profit?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      advertising_costs: {
        Row: {
          id: string;
          user_id: string;
          channel: string;
          ad_date: string;
          cost: number;
          impressions: number;
          clicks: number;
          conversions: number;
          ad_type: string | null;
          campaign_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: string;
          ad_date: string;
          cost: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          ad_type?: string | null;
          campaign_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: string;
          ad_date?: string;
          cost?: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          ad_type?: string | null;
          campaign_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      operating_expenses: {
        Row: {
          id: string;
          user_id: string;
          expense_date: string;
          category: string;
          amount: number;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expense_date: string;
          category: string;
          amount: number;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expense_date?: string;
          category?: string;
          amount?: number;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          target_revenue: number;
          target_margin_rate: number;
          target_roas: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          target_revenue?: number;
          target_margin_rate?: number;
          target_roas?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          target_revenue?: number;
          target_margin_rate?: number;
          target_roas?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          admin_id: string;
          title: string;
          content: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          title: string;
          content: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          title?: string;
          content?: string;
          is_active?: boolean;
        };
      };
      user_activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource?: string | null;
          metadata?: Json | null;
        };
      };
      user_status: {
        Row: {
          user_id: string;
          status: string;
          suspended_reason: string | null;
          suspended_at: string | null;
          suspended_by: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: string;
          suspended_reason?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
        };
        Update: {
          user_id?: string;
          status?: string;
          suspended_reason?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
        };
      };
      page_views: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string;
          page_path: string;
          referrer_path: string | null;
          entered_at: string;
          left_at: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id: string;
          page_path: string;
          referrer_path?: string | null;
          entered_at: string;
          left_at?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string;
          page_path?: string;
          referrer_path?: string | null;
          entered_at?: string;
          left_at?: string | null;
          duration_seconds?: number | null;
        };
      };
      ad_banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          highlight: string | null;
          link_url: string | null;
          image_url: string | null;
          bg_color: string;
          text_color: string;
          highlight_color: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          highlight?: string | null;
          link_url?: string | null;
          image_url?: string | null;
          bg_color?: string;
          text_color?: string;
          highlight_color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          highlight?: string | null;
          link_url?: string | null;
          image_url?: string | null;
          bg_color?: string;
          text_color?: string;
          highlight_color?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          started_at: string;
          ended_at: string | null;
          entry_page: string | null;
          exit_page: string | null;
          page_count: number;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          started_at?: string;
          ended_at?: string | null;
          entry_page?: string | null;
          exit_page?: string | null;
          page_count?: number;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          started_at?: string;
          ended_at?: string | null;
          entry_page?: string | null;
          exit_page?: string | null;
          page_count?: number;
          user_agent?: string | null;
        };
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
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductMarket = Database['public']['Tables']['product_markets']['Row'];
export type PlatformSettings = Database['public']['Tables']['platform_settings']['Row'];
export type SalesRecord = Database['public']['Tables']['sales_records']['Row'];
export type AdvertisingCost = Database['public']['Tables']['advertising_costs']['Row'];
export type OperatingExpense = Database['public']['Tables']['operating_expenses']['Row'];

export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type ProductMarketInsert = Database['public']['Tables']['product_markets']['Insert'];
export type ProductMarketUpdate = Database['public']['Tables']['product_markets']['Update'];
export type SalesRecordInsert = Database['public']['Tables']['sales_records']['Insert'];
export type SalesRecordUpdate = Database['public']['Tables']['sales_records']['Update'];
export type AdvertisingCostInsert = Database['public']['Tables']['advertising_costs']['Insert'];
export type AdvertisingCostUpdate = Database['public']['Tables']['advertising_costs']['Update'];
export type OperatingExpenseInsert = Database['public']['Tables']['operating_expenses']['Insert'];
export type OperatingExpenseUpdate = Database['public']['Tables']['operating_expenses']['Update'];

export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export type AdBanner = Database['public']['Tables']['ad_banners']['Row'];
export type AdBannerInsert = Database['public']['Tables']['ad_banners']['Insert'];
export type AdBannerUpdate = Database['public']['Tables']['ad_banners']['Update'];

export type SaleStatus = 'completed' | 'returned' | 'cancelled' | 'exchanged';
