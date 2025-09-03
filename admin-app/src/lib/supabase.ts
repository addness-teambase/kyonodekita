import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabaseの環境変数 (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) が設定されていません。');
}

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
            children: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    age: number
                    birthdate: string | null
                    gender: 'male' | 'female' | null
                    avatar_image: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    age: number
                    birthdate?: string | null
                    gender?: 'male' | 'female' | null
                    avatar_image?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    age?: number
                    birthdate?: string | null
                    gender?: 'male' | 'female' | null
                    avatar_image?: string | null
                    updated_at?: string
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
            attendance_patterns: {
                Row: {
                    id: string
                    child_id: string
                    day_of_week: number
                    usual_arrival_time: string | null
                    usual_departure_time: string | null
                    is_active: boolean
                    effective_from: string | null
                    effective_until: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    day_of_week: number
                    usual_arrival_time?: string | null
                    usual_departure_time?: string | null
                    is_active?: boolean
                    effective_from?: string | null
                    effective_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    day_of_week?: number
                    usual_arrival_time?: string | null
                    usual_departure_time?: string | null
                    is_active?: boolean
                    effective_from?: string | null
                    effective_until?: string | null
                    updated_at?: string
                }
            }
            calendar_events: {
                Row: {
                    id: string
                    user_id: string
                    child_id: string
                    date: string
                    title: string
                    time: string | null
                    description: string | null
                    event_type: 'facility' | 'child_specific' | 'parent_meeting' | 'holiday' | 'emergency'
                    is_attendance_affecting: boolean
                    affected_children: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    child_id: string
                    date: string
                    title: string
                    time?: string | null
                    description?: string | null
                    event_type?: 'facility' | 'child_specific' | 'parent_meeting' | 'holiday' | 'emergency'
                    is_attendance_affecting?: boolean
                    affected_children?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    child_id?: string
                    date?: string
                    title?: string
                    time?: string | null
                    description?: string | null
                    event_type?: 'facility' | 'child_specific' | 'parent_meeting' | 'holiday' | 'emergency'
                    is_attendance_affecting?: boolean
                    affected_children?: string[]
                    updated_at?: string
                }
            }
            parent_notifications: {
                Row: {
                    id: string
                    child_id: string
                    parent_user_id: string
                    notification_type: 'arrival' | 'departure' | 'absence' | 'emergency' | 'general' | 'schedule_change'
                    title: string
                    message: string
                    is_read: boolean
                    read_at: string | null
                    sent_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    parent_user_id: string
                    notification_type: 'arrival' | 'departure' | 'absence' | 'emergency' | 'general' | 'schedule_change'
                    title: string
                    message: string
                    is_read?: boolean
                    read_at?: string | null
                    sent_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    parent_user_id?: string
                    notification_type?: 'arrival' | 'departure' | 'absence' | 'emergency' | 'general' | 'schedule_change'
                    title?: string
                    message?: string
                    is_read?: boolean
                    read_at?: string | null
                    sent_at?: string
                }
            }
            daily_attendance_summary: {
                Row: {
                    id: string
                    date: string
                    total_scheduled: number
                    total_present: number
                    total_absent: number
                    total_late: number
                    total_early_departure: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    date: string
                    total_scheduled?: number
                    total_present?: number
                    total_absent?: number
                    total_late?: number
                    total_early_departure?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    total_scheduled?: number
                    total_present?: number
                    total_absent?: number
                    total_late?: number
                    total_early_departure?: number
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
            direct_chat_conversations: {
                Row: {
                    id: string
                    child_id: string
                    parent_user_id: string
                    admin_user_id: string | null
                    status: 'active' | 'archived' | 'closed'
                    last_message_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    parent_user_id: string
                    admin_user_id?: string | null
                    status?: 'active' | 'archived' | 'closed'
                    last_message_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    parent_user_id?: string
                    admin_user_id?: string | null
                    status?: 'active' | 'archived' | 'closed'
                    last_message_at?: string
                    updated_at?: string
                }
            }
            direct_chat_messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_user_id: string
                    sender_type: 'parent' | 'admin'
                    content: string
                    is_read: boolean
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_user_id: string
                    sender_type: 'parent' | 'admin'
                    content: string
                    is_read?: boolean
                    read_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_user_id?: string
                    sender_type?: 'parent' | 'admin'
                    content?: string
                    is_read?: boolean
                    read_at?: string | null
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

// 出席予定管理API
export const attendanceApi = {
    // 特定日の出席予定を取得
    async getAttendanceSchedules(date: string) {
        const { data, error } = await supabase
            .from('attendance_schedules')
            .select(`
                *,
                child:children(*)
            `)
            .eq('date', date)
            .order('scheduled_arrival_time', { ascending: true });

        return { data, error };
    },

    // 園児の出席予定パターンを取得
    async getAttendancePatterns(childId: string) {
        const { data, error } = await supabase
            .from('attendance_patterns')
            .select('*')
            .eq('child_id', childId)
            .eq('is_active', true)
            .order('day_of_week', { ascending: true });

        return { data, error };
    },

    // 出席状況を更新
    async updateAttendanceStatus(scheduleId: string, status: string, actualTime?: string) {
        const updateData: any = {
            attendance_status: status,
            updated_at: new Date().toISOString()
        };

        if (actualTime) {
            if (status === 'present') {
                updateData.actual_arrival_time = actualTime;
            } else if (status === 'early_departure') {
                updateData.actual_departure_time = actualTime;
            }
        }

        const { data, error } = await supabase
            .from('attendance_schedules')
            .update(updateData)
            .eq('id', scheduleId)
            .select()
            .single();

        return { data, error };
    },

    // 出席予定を作成
    async createAttendanceSchedule(schedule: {
        child_id: string;
        date: string;
        scheduled_arrival_time?: string;
        scheduled_departure_time?: string;
        notes?: string;
    }) {
        const { data, error } = await supabase
            .from('attendance_schedules')
            .insert(schedule)
            .select()
            .single();

        return { data, error };
    },

    // 日次出席サマリーを取得
    async getDailyAttendanceSummary(date: string) {
        const { data, error } = await supabase
            .from('daily_attendance_summary')
            .select('*')
            .eq('date', date)
            .single();

        return { data, error };
    },

    // 週次出席サマリーを取得
    async getWeeklyAttendanceSummary(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('daily_attendance_summary')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        return { data, error };
    },

    // 園児別の出席履歴を取得
    async getChildAttendanceHistory(childId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('attendance_schedules')
            .select('*')
            .eq('child_id', childId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        return { data, error };
    }
};

// 通知API
export const notificationApi = {
    // 保護者への通知を送信
    async sendParentNotification(notification: {
        child_id: string;
        parent_user_id: string;
        notification_type: 'arrival' | 'departure' | 'absence' | 'emergency' | 'general' | 'schedule_change';
        title: string;
        message: string;
    }) {
        const { data, error } = await supabase
            .from('parent_notifications')
            .insert(notification)
            .select()
            .single();

        return { data, error };
    },

    // 通知履歴を取得
    async getNotificationHistory(childId?: string, parentUserId?: string) {
        let query = supabase
            .from('parent_notifications')
            .select(`
                *,
                child:children(*),
                parent:users!parent_user_id(*)
            `)
            .order('sent_at', { ascending: false });

        if (childId) {
            query = query.eq('child_id', childId);
        }
        if (parentUserId) {
            query = query.eq('parent_user_id', parentUserId);
        }

        const { data, error } = await query;
        return { data, error };
    },

    // 未読通知数を取得
    async getUnreadNotificationCount(parentUserId: string) {
        const { count, error } = await supabase
            .from('parent_notifications')
            .select('*', { count: 'exact' })
            .eq('parent_user_id', parentUserId)
            .eq('is_read', false);

        return { count, error };
    }
}; 