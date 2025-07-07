import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベースの型定義
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    created_at: string
                    username: string
                    avatar_image: string | null
                    email: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    username: string
                    avatar_image?: string | null
                    email?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    username?: string
                    avatar_image?: string | null
                    email?: string | null
                }
            }
            children: {
                Row: {
                    id: string
                    user_id: string
                    created_at: string
                    name: string
                    age: number
                    birthdate: string | null
                    gender: 'male' | 'female' | null
                    avatar_image: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    created_at?: string
                    name: string
                    age: number
                    birthdate?: string | null
                    gender?: 'male' | 'female' | null
                    avatar_image?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    created_at?: string
                    name?: string
                    age?: number
                    birthdate?: string | null
                    gender?: 'male' | 'female' | null
                    avatar_image?: string | null
                }
            }
            record_events: {
                Row: {
                    id: string
                    user_id: string
                    child_id: string
                    created_at: string
                    timestamp: string
                    category: 'achievement' | 'happy' | 'failure' | 'trouble'
                    note: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    child_id: string
                    created_at?: string
                    timestamp: string
                    category: 'achievement' | 'happy' | 'failure' | 'trouble'
                    note: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    child_id?: string
                    created_at?: string
                    timestamp?: string
                    category?: 'achievement' | 'happy' | 'failure' | 'trouble'
                    note?: string
                }
            }
            calendar_events: {
                Row: {
                    id: string
                    user_id: string
                    created_at: string
                    date: string
                    title: string
                    time: string | null
                    description: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    created_at?: string
                    date: string
                    title: string
                    time?: string | null
                    description?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    created_at?: string
                    date?: string
                    title?: string
                    time?: string | null
                    description?: string | null
                }
            }
            growth_records: {
                Row: {
                    id: string
                    user_id: string
                    child_id: string
                    created_at: string
                    title: string
                    description: string
                    category: string
                    media_type: 'image' | 'video' | null
                    media_data: string | null
                    media_name: string | null
                    media_size: number | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    child_id: string
                    created_at?: string
                    title: string
                    description: string
                    category: string
                    media_type?: 'image' | 'video' | null
                    media_data?: string | null
                    media_name?: string | null
                    media_size?: number | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    child_id?: string
                    created_at?: string
                    title?: string
                    description?: string
                    category?: string
                    media_type?: 'image' | 'video' | null
                    media_data?: string | null
                    media_name?: string | null
                    media_size?: number | null
                }
            }
        }
    }
}

// 型付きのSupabaseクライアントをエクスポート
export type SupabaseClient = typeof supabase 