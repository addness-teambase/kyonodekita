import { supabase } from './supabase';
import { RecordEvent, CalendarEvent, ChildInfo } from '../context/RecordContext';

export interface OfflineAction {
    id: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: 'children' | 'records' | 'calendar_events';
    data: any;
    timestamp: string;
    userId: string;
}

const OFFLINE_QUEUE_KEY = 'offline_queue';
const OFFLINE_DATA_KEY = 'offline_data';

// オフライン状態の管理
export const isOnline = (): boolean => {
    return navigator.onLine;
};

// オフライン時のアクションをキューに追加
export const queueOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>): void => {
    const offlineAction: OfflineAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
    };

    const queue = getOfflineQueue();
    queue.push(offlineAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

// オフラインキューの取得
export const getOfflineQueue = (): OfflineAction[] => {
    try {
        const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('オフラインキューの取得エラー:', error);
        return [];
    }
};

// オフラインキューのクリア
export const clearOfflineQueue = (): void => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

// オフラインデータの保存
export const saveOfflineData = (key: string, data: any): void => {
    try {
        const offlineData = getOfflineData();
        offlineData[key] = {
            data,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
        console.error('オフラインデータの保存エラー:', error);
    }
};

// オフラインデータの取得
export const getOfflineData = (): Record<string, any> => {
    try {
        const data = localStorage.getItem(OFFLINE_DATA_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('オフラインデータの取得エラー:', error);
        return {};
    }
};

// 特定のオフラインデータの取得
export const getOfflineDataByKey = (key: string): any => {
    const offlineData = getOfflineData();
    return offlineData[key]?.data || null;
};

// オフラインキューの同期
export const syncOfflineQueue = async (): Promise<void> => {
    if (!isOnline()) {
        console.log('オフライン状態のため同期をスキップします');
        return;
    }

    const queue = getOfflineQueue();
    if (queue.length === 0) {
        return;
    }

    console.log(`${queue.length}件のオフラインアクションを同期中...`);

    const syncPromises = queue.map(async (action) => {
        try {
            await executeOfflineAction(action);
            return { success: true, action };
        } catch (error) {
            console.error('オフラインアクションの実行エラー:', error);
            return { success: false, action, error };
        }
    });

    const results = await Promise.allSettled(syncPromises);

    // 成功したアクションをキューから削除
    const successfulActions = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => (result as any).value.action);

    const remainingQueue = queue.filter(action =>
        !successfulActions.some(successful => successful.id === action.id)
    );

    if (remainingQueue.length < queue.length) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
        console.log(`${queue.length - remainingQueue.length}件のアクションを同期しました`);
    }

    if (remainingQueue.length === 0) {
        clearOfflineQueue();
    }
};

// オフラインアクションの実行
const executeOfflineAction = async (action: OfflineAction): Promise<void> => {
    const { type, table, data, userId } = action;

    let query;
    switch (type) {
        case 'INSERT':
            query = supabase.from(table).insert({ ...data, user_id: userId });
            break;
        case 'UPDATE':
            query = supabase.from(table).update(data).eq('id', data.id).eq('user_id', userId);
            break;
        case 'DELETE':
            query = supabase.from(table).delete().eq('id', data.id).eq('user_id', userId);
            break;
        default:
            throw new Error(`未知のアクションタイプ: ${type}`);
    }

    const { error } = await query;
    if (error) {
        throw error;
    }
};

// 子供データのオフライン操作
export const addChildOffline = async (
    childData: Omit<ChildInfo, 'id'>,
    userId: string
): Promise<string> => {
    const childId = crypto.randomUUID();
    const fullChildData = { ...childData, id: childId };

    if (isOnline()) {
        try {
            const { error } = await supabase
                .from('children')
                .insert({
                    id: childId,
                    user_id: userId,
                    name: childData.name,
                    age: childData.age,
                    birthdate: childData.birthdate,
                    gender: childData.gender,
                    avatar_image: childData.avatarImage
                });

            if (error) throw error;
        } catch (error) {
            console.error('子供データの追加エラー:', error);
            queueOfflineAction({
                type: 'INSERT',
                table: 'children',
                data: {
                    id: childId,
                    name: childData.name,
                    age: childData.age,
                    birthdate: childData.birthdate,
                    gender: childData.gender,
                    avatar_image: childData.avatarImage
                },
                userId
            });
        }
    } else {
        queueOfflineAction({
            type: 'INSERT',
            table: 'children',
            data: {
                id: childId,
                name: childData.name,
                age: childData.age,
                birthdate: childData.birthdate,
                gender: childData.gender,
                avatar_image: childData.avatarImage
            },
            userId
        });
    }

    return childId;
};

// 記録データのオフライン操作
export const addRecordOffline = async (
    recordData: Omit<RecordEvent, 'id'>,
    userId: string
): Promise<string> => {
    const recordId = crypto.randomUUID();
    const fullRecordData = { ...recordData, id: recordId };

    if (isOnline()) {
        try {
            const { error } = await supabase
                .from('records')
                .insert({
                    id: recordId,
                    child_id: recordData.childId,
                    user_id: userId,
                    category: recordData.category,
                    note: recordData.note,
                    timestamp: recordData.timestamp
                });

            if (error) throw error;
        } catch (error) {
            console.error('記録データの追加エラー:', error);
            queueOfflineAction({
                type: 'INSERT',
                table: 'records',
                data: {
                    id: recordId,
                    child_id: recordData.childId,
                    category: recordData.category,
                    note: recordData.note,
                    timestamp: recordData.timestamp
                },
                userId
            });
        }
    } else {
        queueOfflineAction({
            type: 'INSERT',
            table: 'records',
            data: {
                id: recordId,
                child_id: recordData.childId,
                category: recordData.category,
                note: recordData.note,
                timestamp: recordData.timestamp
            },
            userId
        });
    }

    return recordId;
};

// ネットワーク状態の監視
export const setupNetworkMonitoring = (onOnline: () => void, onOffline: () => void): (() => void) => {
    const handleOnline = () => {
        console.log('オンラインになりました');
        syncOfflineQueue();
        onOnline();
    };

    const handleOffline = () => {
        console.log('オフラインになりました');
        onOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初回同期
    if (isOnline()) {
        syncOfflineQueue();
    }

    // クリーンアップ関数
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
};

// オフライン状態の通知
export const showOfflineNotification = (message: string): void => {
    // 簡単な通知実装（実際のアプリではtoast通知など使用）
    console.log(`オフライン通知: ${message}`);

    // ブラウザ通知がサポートされている場合
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('きょうのできた', {
            body: message,
            icon: '/pwa-64x64.png'
        });
    }
};

// 通知許可の要求
export const requestNotificationPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}; 