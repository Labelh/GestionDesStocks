import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée des clés Supabase depuis les variables d'environnement
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Vérification que les variables d'environnement sont bien définies
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans le fichier .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
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
          packaging_type: 'unit' | 'lot' | null;
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
