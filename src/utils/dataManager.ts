import { supabase } from '../lib/supabase';
import { RecordEvent, ChildInfo, CalendarEvent } from '../types';

// 移行ステータスを管理するキー
const MIGRATION_STATUS_KEY = 'migration_completed';

// 移行完了チェック
export const isMigrationCompleted = (): boolean => {
    return localStorage.getItem(MIGRATION_STATUS_KEY) === 'true';
};

// 移行完了をマーク
export const markMigrationCompleted = (): void => {
    localStorage.setItem(MIGRATION_STATUS_KEY, 'true');
};

// 匿名ユーザーIDの取得または作成
export const getOrCreateAnonymousUser = async (): Promise<string> => {
    try {
        // 既存の匿名ユーザーIDをチェック
        const existingUserId = localStorage.getItem('anonymous_user_id');
        if (existingUserId) {
            // データベースに存在するかチェック
            const { data: user, error } = await supabase
                .from('users')
                .select('id')
                .eq('id', existingUserId)
                .single();

            if (!error && user) {
                return existingUserId;
            }
        }

        // 新しい匿名ユーザーを作成
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ username: 'anonymous_user' + Date.now() }])
            .select('id')
            .single();

        if (error) {
            throw error;
        }

        // ローカルストレージに保存
        localStorage.setItem('anonymous_user_id', newUser.id);
        return newUser.id;
    } catch (error) {
        console.error('Error creating anonymous user:', error);
        throw error;
    }
};

// localStorageからデータを取得
export const getLocalStorageData = () => {
    try {
        const recordEvents = JSON.parse(localStorage.getItem('recordEvents') || '[]');
        const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        const children = JSON.parse(localStorage.getItem('children') || '[]');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        return {
            recordEvents,
            calendarEvents,
            children,
            user
        };
    } catch (error) {
        console.error('Error getting localStorage data:', error);
        return {
            recordEvents: [],
            calendarEvents: [],
            children: [],
            user: null
        };
    }
};

// 子供データの移行
export const migrateChildren = async (userId: string, children: ChildInfo[]): Promise<Record<string, string>> => {
    const childIdMapping: Record<string, string> = {};

    try {
        for (const child of children) {
            const { data: newChild, error } = await supabase
                .from('children')
                .insert([{
                    user_id: userId,
                    name: child.name,
                    age: child.age,
                    birthdate: child.birthdate || null,
                    gender: child.gender || null,
                    avatar_image: child.avatarImage || null
                }])
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            childIdMapping[child.id] = newChild.id;
        }

        return childIdMapping;
    } catch (error) {
        console.error('Error migrating children:', error);
        throw error;
    }
};

// 記録データの移行
export const migrateRecordEvents = async (
    userId: string,
    recordEvents: RecordEvent[],
    childIdMapping: Record<string, string>
): Promise<void> => {
    try {
        const eventsToInsert = recordEvents.map(event => ({
            user_id: userId,
            child_id: childIdMapping[event.childId],
            timestamp: event.timestamp,
            category: event.category,
            note: event.note
        })).filter(event => event.child_id); // 有効な子供IDのみ

        if (eventsToInsert.length > 0) {
            const { error } = await supabase
                .from('record_events')
                .insert(eventsToInsert);

            if (error) {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error migrating record events:', error);
        throw error;
    }
};

// カレンダーイベントの移行
export const migrateCalendarEvents = async (userId: string, calendarEvents: CalendarEvent[]): Promise<void> => {
    try {
        const eventsToInsert = calendarEvents.map(event => ({
            user_id: userId,
            date: event.date,
            title: event.title,
            time: event.time || null,
            description: event.description || null
        }));

        if (eventsToInsert.length > 0) {
            const { error } = await supabase
                .from('calendar_events')
                .insert(eventsToInsert);

            if (error) {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error migrating calendar events:', error);
        throw error;
    }
};

// 成長記録の移行（localStorage内にある場合）
export const migrateGrowthRecords = async (
    userId: string,
    childIdMapping: Record<string, string>
): Promise<void> => {
    try {
        const growthRecordsStr = localStorage.getItem('growthRecords');
        if (!growthRecordsStr) return;

        const growthRecords = JSON.parse(growthRecordsStr);

        const recordsToInsert = growthRecords.map((record: any) => ({
            user_id: userId,
            child_id: childIdMapping[record.childId] || Object.values(childIdMapping)[0], // 最初の子供にフォールバック
            title: record.title,
            description: record.description,
            category: record.category,
            media_type: record.media?.type || null,
            media_data: record.media?.data || null,
            media_name: record.media?.name || null,
            media_size: record.media?.size || null
        }));

        if (recordsToInsert.length > 0) {
            const { error } = await supabase
                .from('growth_records')
                .insert(recordsToInsert);

            if (error) {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error migrating growth records:', error);
        throw error;
    }
};

// 完全な移行処理
export const performDataMigration = async (): Promise<void> => {
    try {
        // 移行が既に完了している場合はスキップ
        if (isMigrationCompleted()) {
            return;
        }

        console.log('Starting data migration...');

        // 匿名ユーザーを取得または作成
        const userId = await getOrCreateAnonymousUser();

        // localStorageからデータを取得
        const { recordEvents, calendarEvents, children, user } = getLocalStorageData();

        // ユーザー情報の移行
        if (user) {
            await supabase
                .from('users')
                .update({
                    username: user.username,
                    avatar_image: user.avatarImage || null
                })
                .eq('id', userId);
        }

        // 子供データの移行
        const childIdMapping = await migrateChildren(userId, children);

        // 記録データの移行
        await migrateRecordEvents(userId, recordEvents, childIdMapping);

        // カレンダーイベントの移行
        await migrateCalendarEvents(userId, calendarEvents);

        // 成長記録の移行
        await migrateGrowthRecords(userId, childIdMapping);

        // 移行完了をマーク
        markMigrationCompleted();

        console.log('Data migration completed successfully!');
    } catch (error) {
        console.error('Data migration failed:', error);
        throw error;
    }
};

// Supabaseからデータを取得
export const fetchDataFromSupabase = async (userId: string) => {
    try {
        // 子供データの取得
        const { data: children, error: childrenError } = await supabase
            .from('children')
            .select('*')
            .eq('user_id', userId);

        if (childrenError) throw childrenError;

        // 記録データの取得
        const { data: recordEvents, error: recordEventsError } = await supabase
            .from('record_events')
            .select('*')
            .eq('user_id', userId);

        if (recordEventsError) throw recordEventsError;

        // カレンダーイベントの取得
        const { data: calendarEvents, error: calendarEventsError } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId);

        if (calendarEventsError) throw calendarEventsError;

        // 成長記録の取得
        const { data: growthRecords, error: growthRecordsError } = await supabase
            .from('growth_records')
            .select('*')
            .eq('user_id', userId);

        if (growthRecordsError) throw growthRecordsError;

        return {
            children: children || [],
            recordEvents: recordEvents || [],
            calendarEvents: calendarEvents || [],
            growthRecords: growthRecords || []
        };
    } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        throw error;
    }
};

// オンライン状態の確認
export const isOnline = (): boolean => {
    return navigator.onLine;
};

// オフライン時のデータ保存
export const saveOfflineData = (key: string, data: any): void => {
    try {
        localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving offline data:', error);
    }
};

// オフライン時のデータ取得
export const getOfflineData = (key: string): any => {
    try {
        const data = localStorage.getItem(`offline_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting offline data:', error);
        return null;
    }
};

// オフラインデータの同期
export const syncOfflineData = async (userId: string): Promise<void> => {
    if (!isOnline()) {
        return;
    }

    try {
        // オフライン中に保存されたデータを同期
        const offlineKeys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));

        for (const key of offlineKeys) {
            const data = getOfflineData(key.replace('offline_', ''));
            if (data) {
                // データタイプに応じて適切なテーブルに同期
                // 実装は必要に応じて追加
            }
        }

        // 同期完了後、オフラインデータを削除
        offlineKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Error syncing offline data:', error);
    }
}; 