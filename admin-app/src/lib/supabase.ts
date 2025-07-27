import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration error:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl ? 'set' : 'missing',
        key: supabaseKey ? 'set' : 'missing'
    })

    // 本番環境での一時的なフォールバック
    if (typeof window !== 'undefined') {
        window.location.href = '/error.html'
    }

    throw new Error('Supabase URL and Key are required. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 型定義
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    username: string
                    password: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    username: string
                    password: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    password?: string
                    updated_at?: string
                }
            }
            daily_records: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    status: 'happy' | 'good' | 'okay' | 'tired' | 'sad'
                    memo: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    status: 'happy' | 'good' | 'okay' | 'tired' | 'sad'
                    memo?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    status?: 'happy' | 'good' | 'okay' | 'tired' | 'sad'
                    memo?: string | null
                    updated_at?: string
                }
            }
            chat_sessions: {
                Row: {
                    id: string
                    user_id: string
                    theme: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    theme: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    theme?: string
                    updated_at?: string
                }
            }
            chat_messages: {
                Row: {
                    id: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    role?: 'user' | 'assistant'
                    content?: string
                }
            }
        }
    }
} 