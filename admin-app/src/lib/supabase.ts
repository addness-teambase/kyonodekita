import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ローカルストレージ版では、Supabaseが設定されていなくても動作させる
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase接続が設定されました');
} else {
    console.warn('Supabase環境変数が設定されていません。ローカルストレージモードで動作します。');

    // ダミーのSupabaseクライアントを作成（使用されないが、インポートエラーを防ぐため）
    supabase = {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
            insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
            update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
        })
    };
}

export { supabase };

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