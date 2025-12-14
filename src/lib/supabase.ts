import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACEZ CES VALEURS PAR VOS VRAIES CLÉS SUPABASE
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://jxymbulpvnzzysfcsxvw.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eW1idWxwdm56enlzZmNzeHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjc0OTAsImV4cCI6MjA3NTk0MzQ5MH0.J2EFM3FgswrWw1KGRmA-3t9fon0a_nff_0bcqEaeJCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Types pour TypeScript
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      };
      units: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          is_default: boolean;
          created_at: string;
        };
      };
      storage_zones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          reference: string;
          designation: string;
          category_id: string;
          storage_zone_id: string | null;
          shelf: number | null;
          position: number | null;
          location: string;
          current_stock: number;
          min_stock: number;
          max_stock: number;
          unit_id: string;
          photo: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      exit_requests: {
        Row: {
          id: string;
          product_id: string;
          product_reference: string;
          product_designation: string;
          quantity: number;
          requested_by: string;
          requested_at: string;
          status: 'pending' | 'approved' | 'rejected';
          approved_by: string | null;
          approved_at: string | null;
          reason: string | null;
          notes: string | null;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          product_reference: string;
          product_designation: string;
          movement_type: 'entry' | 'exit' | 'adjustment' | 'initial';
          quantity: number;
          previous_stock: number;
          new_stock: number;
          user_id: string;
          user_name: string;
          reason: string;
          notes: string | null;
          timestamp: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          username: string;
          name: string;
          role: 'user' | 'manager';
          badge_number: string | null;
          alert_email: string | null;
          enable_stock_alerts: boolean;
          enable_consumption_alerts: boolean;
          created_at: string;
        };
      };
    };
  };
}
