import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';
import { 
    performDataMigration, 
    getOrCreateAnonymousUser, 
    fetchDataFromSupabase,
    isOnline,
    saveOfflineData,
    getOfflineData,
    syncOfflineData,
    isMigrationCompleted
} from '../utils/dataManager';
import { 
    applyPendingSchemaChanges,
    getCurrentSchemaVersion
} from '../utils/schemaManager';

const genAI = new GoogleGenerativeAI('AIzaSyCklSsHsyaIBBBALgKBheLWcqNuaY6FO2A');

// カテゴリータイプの定義
export type RecordCategory = 'achievement' | 'happy' | 'failure' | 'trouble';

// 記録イベントの型を統一
export interface RecordEvent {
    id: string;
    childId: string; // 子供ID
    timestamp: string;
    category: RecordCategory;
    note: string;
}

// 予定の型定義
export interface CalendarEvent {
    id: string;
    date: string; // ISO文字列
    title: string;
    time?: string; // 時間（HH:MM形式）
    description?: string;
}

// 子供の情報の型定義
export interface ChildInfo {
    id: string;
    name: string;
    age: number;
    birthdate?: string; // ISO形式の誕生日 (YYYY-MM-DD)
    gender?: 'male' | 'female'; // 性別
    avatarImage?: string; // アバター画像（Base64エンコード）
}

interface CachedContent {
    [key: string]: {
        diary?: string;
        message?: string;
        lastUpdate?: number;
    };
}

interface RecordContextType {
    recordEvents: RecordEvent[];
    todayEvents: RecordEvent[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    activeCategory: RecordCategory;
    setActiveCategory: (category: RecordCategory) => void;
    addRecordEvent: (category: RecordCategory, note: string) => void;
    deleteRecordEvent: (id: string) => void;
    isAnimating: boolean;
    setIsAnimating: (value: boolean) => void;
    cachedContent: CachedContent;
    setCachedContent: React.Dispatch<React.SetStateAction<CachedContent>>;
    lastSelectedDate: Date | null;
    today: Date;
    // カテゴリー名を取得する関数
    getCategoryName: (category: RecordCategory) => string;
    // 予定関連の機能
    calendarEvents: CalendarEvent[];
    addCalendarEvent: (date: Date, title: string, time?: string, description?: string) => void;
    deleteCalendarEvent: (id: string) => void;
    getCalendarEventsForDate: (date: Date) => CalendarEvent[];
    // 子供の情報
    children: ChildInfo[];
    childInfo: ChildInfo | null;
    activeChildId: string | null;
    setActiveChildId: (id: string | null) => void;
    addChild: (name: string, age: number, birthdate?: string, gender?: 'male' | 'female') => string;
    updateChildInfo: (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female') => void;
    removeChild: (id: string) => void;
    // 今日が誕生日かどうか
    isBirthday: () => boolean;
    // 同期状態
    isOnlineSync: boolean;
    lastSyncTime: Date | null;
    syncData: () => Promise<void>;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const useRecord = () => {
    const context = useContext(RecordContext);
    if (!context) {
        throw new Error('useRecord must be used within a RecordProvider');
    }
    return context;
};

interface RecordProviderProps {
    children: ReactNode;
}

export const RecordProvider: React.FC<RecordProviderProps> = ({ children }) => {
    const [recordEvents, setRecordEvents] = useState<RecordEvent[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [activeCategory, setActiveCategory] = useState<RecordCategory>('achievement');
    const [isAnimating, setIsAnimating] = useState(false);
    const [cachedContent, setCachedContent] = useState<CachedContent>({});
    const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isOnlineSync, setIsOnlineSync] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // 現在アクティブな子供の情報
    const childInfo = activeChildId ? childrenList.find(child => child.id === activeChildId) || null : null;

    const today = startOfToday();

    // 初期化とデータ移行
    useEffect(() => {
                const initializeData = async () => {
            try {
                // データ移行を実行
                await performDataMigration();
                
                // スキーマ変更を適用
                await applyPendingSchemaChanges();
                
                // 匿名ユーザーIDを取得
                const userId = await getOrCreateAnonymousUser();
                setCurrentUserId(userId);

                // オンライン状態を確認
                const online = isOnline();
                setIsOnlineSync(online);

                if (online) {
                    // オンライン時はSupabaseからデータを取得
                    const data = await fetchDataFromSupabase(userId);

                    // データの形式を変換
                    const convertedChildren = data.children.map(child => ({
                        id: child.id,
                        name: child.name,
                        age: child.age,
                        birthdate: child.birthdate || undefined,
                        gender: child.gender || undefined,
                        avatarImage: child.avatar_image || undefined
                    }));

                    const convertedRecordEvents = data.recordEvents.map(event => ({
                        id: event.id,
                        childId: event.child_id,
                        timestamp: event.timestamp,
                        category: event.category,
                        note: event.note
                    }));

                    const convertedCalendarEvents = data.calendarEvents.map(event => ({
                        id: event.id,
                        date: event.date,
                        title: event.title,
                        time: event.time || undefined,
                        description: event.description || undefined
                    }));

                    setChildrenList(convertedChildren);
                    setRecordEvents(convertedRecordEvents);
                    setCalendarEvents(convertedCalendarEvents);

                    // 最初の子供をアクティブに設定
                    if (convertedChildren.length > 0 && !activeChildId) {
                        setActiveChildId(convertedChildren[0].id);
                    }

                    setLastSyncTime(new Date());
                } else {
                    // オフライン時はlocalStorageからデータを読み込む
                    loadFromLocalStorage();
                }

                // オフラインデータの同期
                await syncOfflineData(userId);
            } catch (error) {
                console.error('Error initializing data:', error);
                // エラー時はlocalStorageからデータを読み込む
                loadFromLocalStorage();
            }
        };

        initializeData();
    }, []);

    // localStorageからデータを読み込む関数
    const loadFromLocalStorage = () => {
        const savedRecordEvents = localStorage.getItem('recordEvents');
        if (savedRecordEvents) {
            try {
                setRecordEvents(JSON.parse(savedRecordEvents));
            } catch (e) {
                console.error('Failed to load record events:', e);
            }
        }

        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            try {
                setCalendarEvents(JSON.parse(savedEvents));
            } catch (e) {
                console.error('Failed to load calendar events:', e);
            }
        }

        const savedChildren = localStorage.getItem('children');
        if (savedChildren) {
            try {
                const parsedChildren = JSON.parse(savedChildren);
                setChildrenList(parsedChildren);

                if (parsedChildren.length > 0 && !activeChildId) {
                    setActiveChildId(parsedChildren[0].id);
                }
            } catch (e) {
                console.error('Failed to load children info:', e);
            }
        }

        const savedActiveChildId = localStorage.getItem('activeChildId');
        if (savedActiveChildId) {
            setActiveChildId(savedActiveChildId);
        }
    };

    // データをSupabaseに保存する関数
    const saveToSupabase = async (type: 'recordEvent' | 'calendarEvent' | 'child', data: any) => {
        if (!currentUserId || !isOnline()) {
            // オフライン時はlocalStorageに保存
            saveOfflineData(type, data);
            return;
        }

        try {
            switch (type) {
                case 'recordEvent':
                    await supabase.from('record_events').insert([{
                        user_id: currentUserId,
                        child_id: data.childId,
                        timestamp: data.timestamp,
                        category: data.category,
                        note: data.note
                    }]);
                    break;
                case 'calendarEvent':
                    await supabase.from('calendar_events').insert([{
                        user_id: currentUserId,
                        date: data.date,
                        title: data.title,
                        time: data.time || null,
                        description: data.description || null
                    }]);
                    break;
                case 'child':
                    await supabase.from('children').insert([{
                        user_id: currentUserId,
                        name: data.name,
                        age: data.age,
                        birthdate: data.birthdate || null,
                        gender: data.gender || null,
                        avatar_image: data.avatarImage || null
                    }]);
                    break;
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            // エラー時はオフラインデータとして保存
            saveOfflineData(type, data);
        }
    };

    // データをSupabaseから削除する関数
    const deleteFromSupabase = async (type: 'recordEvent' | 'calendarEvent' | 'child', id: string) => {
        if (!currentUserId || !isOnline()) {
            return;
        }

        try {
            switch (type) {
                case 'recordEvent':
                    await supabase.from('record_events').delete().eq('id', id);
                    break;
                case 'calendarEvent':
                    await supabase.from('calendar_events').delete().eq('id', id);
                    break;
                case 'child':
                    await supabase.from('children').delete().eq('id', id);
                    break;
            }
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }
    };

    // 記録が変更されたら保存する
    useEffect(() => {
        localStorage.setItem('recordEvents', JSON.stringify(recordEvents));
    }, [recordEvents]);

    // 予定が変更されたら保存する
    useEffect(() => {
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    }, [calendarEvents]);

    // 子供の情報が変更されたら保存する
    useEffect(() => {
        localStorage.setItem('children', JSON.stringify(childrenList));
    }, [childrenList]);

    // アクティブな子供IDが変更されたら保存
    useEffect(() => {
        if (activeChildId) {
            localStorage.setItem('activeChildId', activeChildId);
        }
    }, [activeChildId]);

    // オンライン状態の監視
    useEffect(() => {
        const handleOnline = async () => {
            setIsOnlineSync(true);
            if (currentUserId) {
                await syncOfflineData(currentUserId);
                await syncData();
            }
        };

        const handleOffline = () => {
            setIsOnlineSync(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [currentUserId]);

    const todayEvents = recordEvents.filter(event =>
        activeChildId === event.childId && isSameDay(new Date(event.timestamp), today)
    );

    const updateSelectedDate = (date: Date) => {
        setSelectedDate(date);
        if (!isSameDay(date, today)) {
            setLastSelectedDate(date);
        } else {
            setLastSelectedDate(null);
        }
    };

    const addRecordEvent = async (category: RecordCategory, note: string) => {
        // アクティブな子供がいない場合は記録できない
        if (!activeChildId) return;

        const newEvent: RecordEvent = {
            id: crypto.randomUUID(),
            childId: activeChildId,
            timestamp: new Date().toISOString(),
            category,
            note
        };

        setRecordEvents(prev => [...prev, newEvent]);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);

        // Supabaseに保存
        await saveToSupabase('recordEvent', newEvent);
    };

    const deleteRecordEvent = async (id: string) => {
        setRecordEvents(prev => prev.filter(event => event.id !== id));
        await deleteFromSupabase('recordEvent', id);
    };

    // 予定追加
    const addCalendarEvent = async (date: Date, title: string, time?: string, description?: string) => {
        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            date: date.toISOString(),
            title,
            time,
            description
        };

        setCalendarEvents(prev => [...prev, newEvent]);
        await saveToSupabase('calendarEvent', newEvent);
    };

    // 予定削除
    const deleteCalendarEvent = async (id: string) => {
        setCalendarEvents(prev => prev.filter(event => event.id !== id));
        await deleteFromSupabase('calendarEvent', id);
    };

    // 特定の日付の予定を取得
    const getCalendarEventsForDate = (date: Date): CalendarEvent[] => {
        return calendarEvents.filter(event =>
            isSameDay(new Date(event.date), date)
        );
    };

    // カテゴリー名を取得する関数
    const getCategoryName = (category: RecordCategory): string => {
        switch (category) {
            case 'achievement':
                return 'できたこと';
            case 'happy':
                return '嬉しかったこと';
            case 'failure':
                return 'できなかったこと';
            case 'trouble':
                return '困ったこと';
            default:
                return '';
        }
    };

    // 子供を追加
    const addChild = async (name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => {
        const newChild: ChildInfo = {
            id: crypto.randomUUID(),
            name,
            age,
            birthdate,
            gender,
            avatarImage
        };

        const updatedChildren = [...childrenList, newChild];
        setChildrenList(updatedChildren);

        // 最初の子供なら自動的にアクティブにする
        if (updatedChildren.length === 1) {
            setActiveChildId(newChild.id);
        }

        await saveToSupabase('child', newChild);
        return newChild.id;
    };

    // 子供の情報を更新
    const updateChildInfo = async (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => {
        const updatedChild = { id, name, age, birthdate, gender, avatarImage };

        setChildrenList(prev => prev.map(child =>
            child.id === id ? updatedChild : child
        ));

        // Supabaseで更新
        if (currentUserId && isOnline()) {
            try {
                await supabase.from('children').update({
                    name,
                    age,
                    birthdate: birthdate || null,
                    gender: gender || null,
                    avatar_image: avatarImage || null
                }).eq('id', id);
            } catch (error) {
                console.error('Error updating child in Supabase:', error);
            }
        }
    };

    // 子供を削除
    const removeChild = async (id: string) => {
        setChildrenList(prev => prev.filter(child => child.id !== id));

        // 削除した子供がアクティブだった場合、別の子供をアクティブにする
        if (activeChildId === id) {
            const remainingChildren = childrenList.filter(child => child.id !== id);
            if (remainingChildren.length > 0) {
                setActiveChildId(remainingChildren[0].id);
            } else {
                setActiveChildId(null);
            }
        }

        await deleteFromSupabase('child', id);
    };

    // 今日が誕生日かどうかをチェック
    const isBirthday = (): boolean => {
        if (!childInfo?.birthdate) return false;

        const today = new Date();
        const birthdate = new Date(childInfo.birthdate);

        return today.getMonth() === birthdate.getMonth() &&
            today.getDate() === birthdate.getDate();
    };

    // データ同期
    const syncData = async () => {
        if (!currentUserId || !isOnline()) return;

        try {
            const data = await fetchDataFromSupabase(currentUserId);

            // データの形式を変換
            const convertedChildren = data.children.map(child => ({
                id: child.id,
                name: child.name,
                age: child.age,
                birthdate: child.birthdate || undefined,
                gender: child.gender || undefined,
                avatarImage: child.avatar_image || undefined
            }));

            const convertedRecordEvents = data.recordEvents.map(event => ({
                id: event.id,
                childId: event.child_id,
                timestamp: event.timestamp,
                category: event.category,
                note: event.note
            }));

            const convertedCalendarEvents = data.calendarEvents.map(event => ({
                id: event.id,
                date: event.date,
                title: event.title,
                time: event.time || undefined,
                description: event.description || undefined
            }));

            setChildrenList(convertedChildren);
            setRecordEvents(convertedRecordEvents);
            setCalendarEvents(convertedCalendarEvents);
            setLastSyncTime(new Date());
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    };

    return (
        <RecordContext.Provider value={{
            recordEvents,
            todayEvents,
            selectedDate,
            setSelectedDate: updateSelectedDate,
            activeCategory,
            setActiveCategory,
            addRecordEvent,
            deleteRecordEvent,
            isAnimating,
            setIsAnimating,
            cachedContent,
            setCachedContent,
            lastSelectedDate,
            today,
            getCategoryName,
            calendarEvents,
            addCalendarEvent,
            deleteCalendarEvent,
            getCalendarEventsForDate,
            children: childrenList,
            childInfo,
            activeChildId,
            setActiveChildId,
            addChild,
            updateChildInfo,
            removeChild,
            isBirthday,
            isOnlineSync,
            lastSyncTime,
            syncData
        }}>
            {children}
        </RecordContext.Provider>
    );
};

// メッセージ生成関数
export const getMotivationalMessage = async (events: RecordEvent[]): Promise<string> => {
    if (events.length === 0) return '';

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `
以下の記録から、50文字程度の励ましのメッセージを作成してください。共感的で前向きな内容にしてください。

記録:
${events.map(e => {
            const categoryName = getCategoryNameStatic(e.category);
            return `- ${categoryName}: ${e.note}`;
        }).join('\n')}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || '一歩一歩、着実に前に進んでいきましょう。あなたならできます！';
    } catch (error) {
        console.error('Error generating message:', error);
        return '一歩一歩、着実に前に進んでいきましょう。あなたならできます！';
    }
};

// カテゴリー名を取得する関数（静的バージョン）
const getCategoryNameStatic = (category: RecordCategory): string => {
    switch (category) {
        case 'achievement':
            return 'できたこと';
        case 'happy':
            return '嬉しかったこと';
        case 'failure':
            return 'できなかったこと';
        case 'trouble':
            return '困ったこと';
        default:
            return '';
    }
};

export const generateDiarySummary = async (events: RecordEvent[]): Promise<string> => {
    if (events.length === 0) {
        return 'きょうのできた\n\n今日はまだ記録がありません。';
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `
以下の記録から、一日のサマリーを作成してください。

${events.map(e => {
            const categoryName = getCategoryNameStatic(e.category);
            return `- ${categoryName}: ${e.note}`;
        }).join('\n')}

要件:
1. タイトルは「今日のできた」で固定
2. 150-200字程度で簡潔に
3. 時系列で出来事を要約
4. 各カテゴリーバランスよく含める
5. 最後に短い前向きな一言を添える
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || defaultSummary(events);
    } catch (error) {
        console.error('Error generating diary summary:', error);
        return defaultSummary(events);
    }
};

const defaultSummary = (events: RecordEvent[]): string => {
    const allEvents = [...events]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let summary = 'きょうのできた\n\n';

    if (allEvents.length === 0) {
        return summary + 'まだ記録がありません。';
    }

    const formatEvent = (event: RecordEvent) => {
        const time = format(new Date(event.timestamp), 'HH:mm');
        const categoryName = getCategoryNameStatic(event.category);
        return `${time} - ${categoryName}: ${event.note}`;
    };

    summary += allEvents.map(formatEvent).join('\n');
    summary += '\n\n今日も一日お疲れ様でした。明日も頑張りましょう。';

    return summary;
}; 