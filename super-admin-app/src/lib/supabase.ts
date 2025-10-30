import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 型定義
export interface User {
    id: string;
    username: string;
    user_type: 'super_admin';
    display_name: string | null;
    email: string | null;
}

export interface Facility {
    id: string;
    name: string;
    facility_code: string;
    admin_user_id: string | null;
    business_type: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user_count?: number;
    admin_name?: string;
}

export interface FacilityStats {
    total_facilities: number;
    total_users: number;
    active_facilities: number;
    new_facilities_this_month: number;
}






