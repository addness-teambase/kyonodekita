import { createClient } from '@supabase/supabase-js'

// Supabase設定（正しいAPIキーに更新）
const supabaseUrl = 'https://ognianlobgsqcjpacgqo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbmlhbmxvYmdzcWNqcGFjZ3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjI5NTUsImV4cCI6MjA2NzYzODk1NX0.ppq_YYElXq7LgsYtJt_tG8IG0-Ch7FYtkxqQ3cQshic'

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client initialized successfully.');

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
            attendance_schedules: {
                Row: {
                    id: string
                    child_id: string
                    date: string
                    scheduled_arrival_time: string | null
                    scheduled_departure_time: string | null
                    actual_arrival_time: string | null
                    actual_departure_time: string | null
                    attendance_status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_departure' | 'sick'
                    notes: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    date: string
                    scheduled_arrival_time?: string | null
                    scheduled_departure_time?: string | null
                    actual_arrival_time?: string | null
                    actual_departure_time?: string | null
                    attendance_status?: 'scheduled' | 'present' | 'absent' | 'late' | 'early_departure' | 'sick'
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    date?: string
                    scheduled_arrival_time?: string | null
                    scheduled_departure_time?: string | null
                    actual_arrival_time?: string | null
                    actual_departure_time?: string | null
                    attendance_status?: 'scheduled' | 'present' | 'absent' | 'late' | 'early_departure' | 'sick'
                    notes?: string | null
                    created_by?: string | null
                    updated_at?: string
                }
            }
        }
    }
}

// 直接チャット機能用のAPI関数
export const directChatApi = {
    // 会話を取得または作成
    async getOrCreateConversation(childId: string, parentUserId: string) {
        // まず、facility_childrenテーブルから正しいfacility_idを取得
        const { data: facilityChild, error: facilityError } = await supabase
            .from('facility_children')
            .select('facility_id')
            .eq('child_id', childId)
            .eq('parent_user_id', parentUserId)
            .eq('status', 'active')
            .maybeSingle(); // singleではなくmaybeSingleを使用

        if (facilityError || !facilityChild) {
            console.error('facility_children情報の取得エラー:', facilityError);
            return { data: null, error: facilityError };
        }

        const { data: existingConversation, error: fetchError } = await supabase
            .from('direct_chat_conversations')
            .select('*')
            .eq('child_id', childId)
            .eq('parent_user_id', parentUserId)
            .eq('facility_id', facilityChild.facility_id)
            .maybeSingle(); // singleではなくmaybeSingleを使用

        if (existingConversation) {
            return { data: existingConversation, error: null };
        }

        if (fetchError) {
            console.error('既存会話の取得エラー:', fetchError);
            return { data: null, error: fetchError };
        }

        // 会話が存在しない場合は新しく作成
        const { data: newConversation, error: createError } = await supabase
            .from('direct_chat_conversations')
            .insert({
                child_id: childId,
                parent_user_id: parentUserId,
                facility_id: facilityChild.facility_id,
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
    async sendMessage(conversationId: string, senderUserId: string, senderType: 'parent' | 'facility_admin', content: string) {
        const { data, error } = await supabase
            .from('direct_chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_user_id: senderUserId,
                sender_type: senderType,
                content: content,
                is_read: false
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
    },

    // メッセージを削除
    async deleteMessage(messageId: string, userId: string) {
        // 自分が送信したメッセージのみ削除可能
        const { data, error } = await supabase
            .from('direct_chat_messages')
            .delete()
            .eq('id', messageId)
            .eq('sender_user_id', userId);

        return { data, error };
    }
};

// 一斉メッセージ機能用のAPI関数
export const announcementApi = {
    // 園からの一斉メッセージを取得
    async getAnnouncements(userId: string) {
        try {
            // まず、ユーザーの施設IDを取得（facility_childrenテーブルを使用）
            const { data: facilityChildData, error: membershipError } = await supabase
                .from('facility_children')
                .select('facility_id')
                .eq('parent_user_id', userId)
                .eq('status', 'active')
                .maybeSingle();

            if (membershipError) {
                console.error('❌ 施設情報の取得エラー:', membershipError);
                return { data: [], error: membershipError };
            }

            if (!facilityChildData) {
                console.log('⚠️ 施設に所属していません');
                return { data: [], error: null };
            }

            // その施設の一斉メッセージを取得
            const { data: announcements, error } = await supabase
                .from('announcement_messages')
                .select('*')
                .eq('facility_id', facilityChildData.facility_id)
                .eq('is_published', true)
                .order('published_at', { ascending: false });

            return { data: announcements || [], error };
        } catch (error) {
            console.error('❌ 一斉メッセージ取得エラー:', error);
            return { data: [], error };
        }
    },

    // 一斉メッセージの既読状態を更新
    async markAnnouncementAsRead(announcementId: string, userId: string) {
        try {
            const { data, error } = await supabase
                .from('announcement_read_status')
                .upsert({
                    announcement_id: announcementId,
                    user_id: userId,
                    is_read: true,
                    read_at: new Date().toISOString()
                }, {
                    onConflict: 'announcement_id,user_id'
                })
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('既読状態更新エラー:', error);
            return { data: null, error };
        }
    },

    // 未読の一斉メッセージ数を取得
    async getUnreadAnnouncementsCount(userId: string) {
        try {
            // ユーザーの施設IDを取得（facility_childrenテーブルを使用）
            const { data: facilityChildData, error: membershipError } = await supabase
                .from('facility_children')
                .select('facility_id')
                .eq('parent_user_id', userId)
                .eq('status', 'active')
                .maybeSingle();

            if (membershipError) {
                console.error('❌ 施設情報の取得エラー:', membershipError);
                return { count: 0, error: membershipError };
            }

            if (!facilityChildData) {
                console.log('⚠️ 施設に所属していません');
                return { count: 0, error: null };
            }

            // その施設の一斉メッセージの中で未読のものをカウント
            const { data: announcements, error: announcementsError } = await supabase
                .from('announcement_messages')
                .select('id')
                .eq('facility_id', facilityChildData.facility_id)
                .eq('is_published', true);

            if (announcementsError) {
                console.error('❌ 一斉メッセージ取得エラー:', announcementsError);
                return { count: 0, error: announcementsError };
            }

            if (!announcements || announcements.length === 0) {
                return { count: 0, error: null };
            }

            const announcementIds = announcements.map(a => a.id);

            // 既読状態をチェック
            const { data: readStatus, error: readError } = await supabase
                .from('announcement_read_status')
                .select('announcement_id')
                .in('announcement_id', announcementIds)
                .eq('user_id', userId)
                .eq('is_read', true);

            if (readError) {
                console.error('❌ 既読状態取得エラー:', readError);
                return { count: 0, error: readError };
            }

            const readAnnouncementIds = readStatus?.map(r => r.announcement_id) || [];
            const unreadCount = announcementIds.length - readAnnouncementIds.length;

            return { count: unreadCount, error: null };
        } catch (error) {
            console.error('❌ 未読お知らせ数取得エラー:', error);
            return { count: 0, error };
        }
    }
}; 