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

// 直接チャット機能用のAPI関数
export const directChatApi = {
    // 会話を取得または作成
    async getOrCreateConversation(childId: string, parentUserId: string) {
        const { data: existingConversation, error: fetchError } = await supabase
            .from('direct_chat_conversations')
            .select('*')
            .eq('child_id', childId)
            .eq('parent_user_id', parentUserId)
            .single();

        if (existingConversation) {
            return { data: existingConversation, error: null };
        }

        if (fetchError && fetchError.code !== 'PGRST116') {
            return { data: null, error: fetchError };
        }

        // 会話が存在しない場合は新しく作成
        const { data: newConversation, error: createError } = await supabase
            .from('direct_chat_conversations')
            .insert({
                child_id: childId,
                parent_user_id: parentUserId,
                status: 'active'
            })
            .select()
            .single();

        return { data: newConversation, error: createError };
    },

    // メッセージ一覧を取得
    async getMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('direct_chat_messages')
            .select(`
        *,
        sender:users(id, email, full_name)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        return { data, error };
    },

    // メッセージを送信
    async sendMessage(conversationId: string, senderUserId: string, senderType: 'parent' | 'admin', content: string) {
        const { data, error } = await supabase
            .from('direct_chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_user_id: senderUserId,
                sender_type: senderType,
                content: content
            })
            .select()
            .single();

        if (!error) {
            // 会話の最終メッセージ時刻を更新
            await supabase
                .from('direct_chat_conversations')
                .update({
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversationId);
        }

        return { data, error };
    },

    // 未読メッセージをマークする
    async markMessagesAsRead(conversationId: string, userId: string) {
        const { data, error } = await supabase
            .from('direct_chat_messages')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId)
            .neq('sender_user_id', userId)
            .eq('is_read', false);

        return { data, error };
    },

    // 未読メッセージ数を取得
    async getUnreadCount(conversationId: string, userId: string) {
        const { count, error } = await supabase
            .from('direct_chat_messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conversationId)
            .neq('sender_user_id', userId)
            .eq('is_read', false);

        return { count, error };
    },

    // 保護者の会話一覧を取得
    async getConversationsForParent(parentUserId: string) {
        const { data, error } = await supabase
            .from('direct_chat_conversations')
            .select(`
        *,
        child:children(*),
        direct_chat_messages(
          content,
          created_at,
          sender_type,
          is_read
        )
      `)
            .eq('parent_user_id', parentUserId)
            .eq('status', 'active')
            .order('last_message_at', { ascending: false });

        return { data, error };
    },

    // 管理者の会話一覧を取得
    async getConversationsForAdmin() {
        const { data, error } = await supabase
            .from('direct_chat_conversations')
            .select(`
        *,
        child:children(*),
        parent:users!parent_user_id(*),
        direct_chat_messages(
          content,
          created_at,
          sender_type,
          is_read
        )
      `)
            .eq('status', 'active')
            .order('last_message_at', { ascending: false });

        return { data, error };
    }
}; 