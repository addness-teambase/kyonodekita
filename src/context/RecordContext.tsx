import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCklSsHsyaIBBBALgKBheLWcqNuaY6FO2A'
});

// カテゴリータイプの定義
export type RecordCategory = 'achievement' | 'happy' | 'failure' | 'trouble';

// 型定義
export interface RecordEvent {
    id: string;
    childId: string;
    timestamp: string;
    category: RecordCategory;
    note: string;
}

export interface CalendarEvent {
    id: string;
    childId: string;
    date: string;
    title: string;
    time?: string;
    description?: string;
}

export interface ChildInfo {
    id: string;
    name: string;
    age: number;
    birthdate?: string;
    gender?: 'male' | 'female';
    avatarImage?: string;
}

export interface GrowthRecord {
    id: string;
    childId: string;
    date: Date;
    title: string;
    description: string;
    category: 'first_time' | 'milestone' | 'achievement' | 'memory';
    createdAt: Date;
    media?: {
        id: string;
        type: 'image' | 'video';
        data: string;
        name: string;
        size: number;
    } | null;
}

interface CachedContent {
    [key: string]: any;
}

interface RecordContextType {
    recordEvents: RecordEvent[];
    todayEvents: RecordEvent[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    activeCategory: RecordCategory;
    setActiveCategory: (category: RecordCategory) => void;
    addRecordEvent: (category: RecordCategory, note: string) => Promise<void>;
    updateRecordEvent: (id: string, category: RecordCategory, note: string) => Promise<void>;
    deleteRecordEvent: (id: string) => Promise<void>;
    isAnimating: boolean;
    setIsAnimating: (isAnimating: boolean) => void;
    cachedContent: CachedContent;
    setCachedContent: (content: CachedContent) => void;
    lastSelectedDate: Date | null;
    today: Date;
    getCategoryName: (category: RecordCategory) => string;
    calendarEvents: CalendarEvent[];
    addCalendarEvent: (date: Date, title: string, time?: string, description?: string) => Promise<void>;
    deleteCalendarEvent: (id: string) => Promise<void>;
    getCalendarEventsForDate: (date: Date) => CalendarEvent[];
    children: ChildInfo[];
    childInfo: ChildInfo | null;
    activeChildId: string | null;
    setActiveChildId: (id: string | null) => void;
    addChild: (name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => Promise<string>;
    updateChildInfo: (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => Promise<void>;
    removeChild: (id: string) => Promise<void>;
    isBirthday: () => boolean;
    migrateFromLocalStorage: () => Promise<void>;
    isDataMigrated: boolean;
    // 成長記録関連
    growthRecords: GrowthRecord[];
    addGrowthRecord: (title: string, description: string, category: 'first_time' | 'milestone' | 'achievement' | 'memory', media?: { type: 'image' | 'video'; data: string; name: string; size: number; }) => Promise<void>;
    updateGrowthRecord: (id: string, title: string, description: string, category: 'first_time' | 'milestone' | 'achievement' | 'memory', media?: { type: 'image' | 'video'; data: string; name: string; size: number; }) => Promise<void>;
    deleteGrowthRecord: (id: string) => Promise<void>;
}

interface RecordProviderProps {
    children: ReactNode;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const useRecord = () => {
    const context = useContext(RecordContext);
    if (!context) {
        throw new Error('useRecord must be used within a RecordProvider');
    }
    return context;
};

export const RecordProvider: React.FC<RecordProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [recordEvents, setRecordEvents] = useState<RecordEvent[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
    const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [activeCategory, setActiveCategory] = useState<RecordCategory>('achievement');
    const [isAnimating, setIsAnimating] = useState(false);
    const [cachedContent, setCachedContent] = useState<CachedContent>({});
    const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
    const [isDataMigrated, setIsDataMigrated] = useState(true); // ローカルストレージ使用なので常にtrue

    // 現在アクティブな子供の情報
    const childInfo = activeChildId ? childrenList.find(child => child.id === activeChildId) || null : null;

    const today = startOfToday();

    // Supabaseからデータを読み込む
    useEffect(() => {
        if (isAuthenticated && user) {
            loadDataFromSupabase();
        }
    }, [isAuthenticated, user]);

    // Supabaseからデータを読み込む関数
    const loadDataFromSupabase = async () => {
        if (!user) return;

        try {
            // 子供データの読み込み
            const { data: children, error: childrenError } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (childrenError) {
                console.error('子供データの読み込みエラー:', childrenError);
            } else if (children) {
                const childrenList = children.map(child => ({
                    id: child.id,
                    name: child.name,
                    age: child.age,
                    birthdate: child.birthdate,
                    gender: child.gender,
                    avatarImage: child.avatar_image
                }));
                setChildrenList(childrenList);

                // アクティブな子供IDが設定されていない場合、最初の子供を選択
                if (childrenList.length > 0 && !activeChildId) {
                    setActiveChildId(childrenList[0].id);
                }
            }

            // 記録データの読み込み
            const { data: records, error: recordsError } = await supabase
                .from('records')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false });

            if (recordsError) {
                console.error('記録データの読み込みエラー:', recordsError);
            } else if (records) {
                const recordsList = records.map(record => ({
                    id: record.id,
                    childId: record.child_id,
                    timestamp: record.timestamp,
                    category: record.category,
                    note: record.note
                }));
                setRecordEvents(recordsList);
            }

            // カレンダーイベントの読み込み
            const { data: calendarEvents, error: calendarError } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (calendarError) {
                console.error('カレンダーデータの読み込みエラー:', calendarError);
            } else if (calendarEvents) {
                const calendarList = calendarEvents.map(event => ({
                    id: event.id,
                    childId: event.child_id,
                    date: event.date,
                    title: event.title,
                    time: stripSeconds(event.time),
                    description: event.description && event.description.trim() !== '' ? event.description.trim() : null
                }));
                setCalendarEvents(calendarList);
            }

            // 成長記録の読み込み
            const { data: growthRecords, error: growthError } = await supabase
                .from('growth_records')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (growthError) {
                console.error('成長記録データの読み込みエラー:', growthError);
            } else if (growthRecords) {
                const growthList = growthRecords.map(record => ({
                    id: record.id,
                    childId: record.child_id,
                    date: new Date(record.date),
                    title: record.title,
                    description: record.description || '',
                    category: record.category as 'first_time' | 'milestone' | 'achievement' | 'memory',
                    createdAt: new Date(record.created_at),
                    media: record.media_data ? {
                        id: record.id,
                        type: record.media_type as 'image' | 'video',
                        data: record.media_data,
                        name: record.media_name || '',
                        size: record.media_size || 0
                    } : null
                }));
                setGrowthRecords(growthList);
            }

        } catch (error) {
            console.error('Supabaseデータの読み込みエラー:', error);
        }
    };

    // データ移行は不要（ローカルストレージ使用）
    const migrateFromLocalStorage = async (): Promise<void> => {
        // 何もしない（既にローカルストレージを使用）
        setIsDataMigrated(true);
    };

    const updateSelectedDate = (date: Date) => {
        setLastSelectedDate(selectedDate);
        setSelectedDate(date);
    };

    const addRecordEvent = async (category: RecordCategory, note: string): Promise<void> => {
        if (!user || !activeChildId) return;

        try {
            const { data, error } = await supabase
                .from('records')
                .insert({
                    child_id: activeChildId,
                    user_id: user.id,
                    category,
                    note,
                    timestamp: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('記録追加エラー:', error);
                return;
            }

            const newRecord: RecordEvent = {
                id: data.id,
                childId: data.child_id,
                timestamp: data.timestamp,
                category: data.category,
                note: data.note
            };

            const updatedRecords = [newRecord, ...recordEvents];
            setRecordEvents(updatedRecords);
        } catch (error) {
            console.error('記録追加エラー:', error);
        }
    };

    const updateRecordEvent = async (id: string, category: RecordCategory, note: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('records')
                .update({
                    category,
                    note,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('記録更新エラー:', error);
                return;
            }

            const updatedRecords = recordEvents.map(record =>
                record.id === id ? { ...record, category, note } : record
            );
            setRecordEvents(updatedRecords);
        } catch (error) {
            console.error('記録更新エラー:', error);
        }
    };

    const deleteRecordEvent = async (id: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('records')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('記録削除エラー:', error);
                return;
            }

            const updatedRecords = recordEvents.filter(record => record.id !== id);
            setRecordEvents(updatedRecords);
        } catch (error) {
            console.error('記録削除エラー:', error);
        }
    };

    const formatTimeForDB = (time?: string | null): string | null => {
        if (!time) return null;
        const trimmed = time.trim();
        if (trimmed === '') return null;
        // 既に秒が含まれている場合はそのまま
        if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
        // HH:MM 形式なら HH:MM:00 に変換
        if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
        return trimmed; // それ以外はそのまま
    };

    const stripSeconds = (time?: string | null): string | null => {
        if (!time) return null;
        return time.substring(0, 5); // HH:MM:SS -> HH:MM
    };

    const addCalendarEvent = async (date: Date, title: string, time?: string, description?: string): Promise<void> => {
        if (!user || !activeChildId) return;

        try {
            const timeValue = formatTimeForDB(time);

            const { data, error } = await supabase
                .from('calendar_events')
                .insert({
                    user_id: user.id,
                    child_id: activeChildId,
                    date: format(date, 'yyyy-MM-dd'),
                    title,
                    time: timeValue,
                    description: description && description.trim() !== '' ? description.trim() : null
                })
                .select()
                .single();

            if (error) {
                console.error('カレンダーイベント追加エラー:', error);
                return;
            }

            const newEvent: CalendarEvent = {
                id: data.id,
                childId: data.child_id,
                date: data.date,
                title: data.title,
                time: stripSeconds(data.time),
                description: data.description
            };

            const updatedEvents = [...calendarEvents, newEvent];
            setCalendarEvents(updatedEvents);
        } catch (error) {
            console.error('カレンダーイベント追加エラー:', error);
        }
    };

    const deleteCalendarEvent = async (id: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('カレンダーイベント削除エラー:', error);
                return;
            }

            const updatedEvents = calendarEvents.filter(event => event.id !== id);
            setCalendarEvents(updatedEvents);
        } catch (error) {
            console.error('カレンダーイベント削除エラー:', error);
        }
    };

    const getCalendarEventsForDate = (date: Date): CalendarEvent[] => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const events = calendarEvents.filter(event =>
            event.date === dateStr &&
            event.childId === activeChildId
        );

        // 時間順でソート（時間がない場合は最後に配置）
        return events.sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
    };

    const getCategoryName = (category: RecordCategory): string => {
        const names = {
            'achievement': 'できたこと',
            'happy': 'うれしかったこと',
            'failure': '気になったこと',
            'trouble': 'こまったこと'
        };
        return names[category];
    };

    // 成長記録の追加
    const addGrowthRecord = async (
        title: string,
        description: string,
        category: 'first_time' | 'milestone' | 'achievement' | 'memory',
        media?: { type: 'image' | 'video'; data: string; name: string; size: number; }
    ): Promise<void> => {
        if (!user || !activeChildId) return;

        try {
            const { data, error } = await supabase
                .from('growth_records')
                .insert({
                    user_id: user.id,
                    child_id: activeChildId,
                    title,
                    description,
                    category,
                    media_type: media?.type || null,
                    media_data: media?.data || null,
                    media_name: media?.name || null,
                    media_size: media?.size || null,
                    date: new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (error) {
                console.error('成長記録追加エラー:', error);
                return;
            }

            const newRecord: GrowthRecord = {
                id: data.id,
                childId: data.child_id,
                date: new Date(data.date),
                title: data.title,
                description: data.description || '',
                category: data.category,
                createdAt: new Date(data.created_at),
                media: data.media_data ? {
                    id: data.id,
                    type: data.media_type,
                    data: data.media_data,
                    name: data.media_name || '',
                    size: data.media_size || 0
                } : null
            };

            setGrowthRecords(prev => [newRecord, ...prev]);
        } catch (error) {
            console.error('成長記録追加エラー:', error);
        }
    };

    // 成長記録の更新
    const updateGrowthRecord = async (
        id: string,
        title: string,
        description: string,
        category: 'first_time' | 'milestone' | 'achievement' | 'memory',
        media?: { type: 'image' | 'video'; data: string; name: string; size: number; }
    ): Promise<void> => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('growth_records')
                .update({
                    title,
                    description,
                    category,
                    media_type: media?.type || null,
                    media_data: media?.data || null,
                    media_name: media?.name || null,
                    media_size: media?.size || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('成長記録更新エラー:', error);
                return;
            }

            const updatedRecord: GrowthRecord = {
                id: data.id,
                childId: data.child_id,
                date: new Date(data.date),
                title: data.title,
                description: data.description || '',
                category: data.category,
                createdAt: new Date(data.created_at),
                media: data.media_data ? {
                    id: data.id,
                    type: data.media_type,
                    data: data.media_data,
                    name: data.media_name || '',
                    size: data.media_size || 0
                } : null
            };

            setGrowthRecords(prev => prev.map(record =>
                record.id === id ? updatedRecord : record
            ));
        } catch (error) {
            console.error('成長記録更新エラー:', error);
        }
    };

    // 成長記録の削除
    const deleteGrowthRecord = async (id: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('growth_records')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                console.error('成長記録削除エラー:', error);
                return;
            }

            setGrowthRecords(prev => prev.filter(record => record.id !== id));
        } catch (error) {
            console.error('成長記録削除エラー:', error);
        }
    };

    const addChild = async (name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string): Promise<string> => {
        if (!user) throw new Error('ユーザーが認証されていません');

        try {
            const { data, error } = await supabase
                .from('children')
                .insert({
                    user_id: user.id,
                    name,
                    age,
                    birthdate,
                    gender,
                    avatar_image: avatarImage
                })
                .select()
                .single();

            if (error) {
                console.error('子供追加エラー:', error);
                throw error;
            }

            const newChild: ChildInfo = {
                id: data.id,
                name: data.name,
                age: data.age,
                birthdate: data.birthdate,
                gender: data.gender,
                avatarImage: data.avatar_image
            };

            const updatedChildren = [...childrenList, newChild];
            setChildrenList(updatedChildren);

            // 最初の子供の場合はアクティブに設定
            if (childrenList.length === 0) {
                setActiveChildId(newChild.id);
            }

            return newChild.id;
        } catch (error) {
            console.error('子供追加エラー:', error);
            throw error;
        }
    };

    const updateChildInfo = async (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('children')
                .update({
                    name,
                    age,
                    birthdate,
                    gender,
                    avatar_image: avatarImage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('子供情報更新エラー:', error);
                return;
            }

            const updatedChildren = childrenList.map(child =>
                child.id === id ? { ...child, name, age, birthdate, gender, avatarImage } : child
            );
            setChildrenList(updatedChildren);
        } catch (error) {
            console.error('子供情報更新エラー:', error);
        }
    };

    const removeChild = async (id: string): Promise<void> => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('children')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('子供削除エラー:', error);
                return;
            }

            const updatedChildren = childrenList.filter(child => child.id !== id);
            setChildrenList(updatedChildren);

            // 削除された子供がアクティブだった場合
            if (activeChildId === id) {
                const newActiveId = updatedChildren.length > 0 ? updatedChildren[0].id : null;
                setActiveChildId(newActiveId);
            }

            // 削除された子供の記録も削除（Supabaseでは外部キー制約で自動削除される）
            const updatedRecords = recordEvents.filter(record => record.childId !== id);
            setRecordEvents(updatedRecords);
        } catch (error) {
            console.error('子供削除エラー:', error);
        }
    };

    const isBirthday = (): boolean => {
        if (!childInfo?.birthdate) return false;

        const today = new Date();
        const birthdate = new Date(childInfo.birthdate);

        return today.getMonth() === birthdate.getMonth() &&
            today.getDate() === birthdate.getDate();
    };

    // 今日の記録を取得
    const todayEvents = recordEvents.filter(event => {
        if (!activeChildId) return false;
        const eventDate = new Date(event.timestamp);
        return event.childId === activeChildId && isSameDay(eventDate, today);
    });

    return (
        <RecordContext.Provider value={{
            recordEvents,
            todayEvents,
            selectedDate,
            setSelectedDate: updateSelectedDate,
            activeCategory,
            setActiveCategory,
            addRecordEvent,
            updateRecordEvent,
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
            setActiveChildId: (id: string | null) => {
                setActiveChildId(id);
                if (user && id) {
                    localStorage.setItem(`activeChildId_${user.id}`, id);
                } else if (user) {
                    localStorage.removeItem(`activeChildId_${user.id}`);
                }
            },
            addChild,
            updateChildInfo,
            removeChild,
            isBirthday,
            migrateFromLocalStorage,
            isDataMigrated,
            // 成長記録関連
            growthRecords,
            addGrowthRecord,
            updateGrowthRecord,
            deleteGrowthRecord
        }}>
            {children}
        </RecordContext.Provider>
    );
};

// その他のユーティリティ関数はそのまま維持
export const getMotivationalMessage = async (events: RecordEvent[]): Promise<string> => {
    try {
        const eventSummary = events.map(event =>
            `${getCategoryNameStatic(event.category)}: ${event.note}`
        ).join('\n');

        const prompt = `
以下の子供の記録を見て、温かく励ますメッセージを日本語で書いてください。
記録: ${eventSummary}

要件:
- 100文字以内
- 子供が読んでも分かりやすい言葉
- ポジティブで励ます内容
- 成長を認める内容
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: {
                    thinkingBudget: 0, // Disables thinking
                },
            }
        });

        return response.text || defaultMessage(events);
    } catch (error) {
        console.error('AI メッセージ生成エラー:', error);
        return defaultMessage(events);
    }
};

const defaultMessage = (events: RecordEvent[]): string => {
    const messages = [
        "今日もよくがんばったね！",
        "すてきな一日だったね！",
        "きょうのきろくありがとう！",
        "明日もがんばろうね！"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

const getCategoryNameStatic = (category: RecordCategory): string => {
    const names = {
        'achievement': 'できたこと',
        'happy': 'うれしかったこと',
        'failure': 'うまくいかなかったこと',
        'trouble': 'こまったこと'
    };
    return names[category];
};

export const generateDiarySummary = async (events: RecordEvent[]): Promise<string> => {
    if (events.length === 0) {
        return 'まだ記録がありません。';
    }

    try {
        // 実装を簡略化
        return defaultSummary(events);
    } catch (error) {
        return defaultSummary(events);
    }
};

const defaultSummary = (events: RecordEvent[]): string => {
    const formatEvent = (event: RecordEvent) =>
        `${getCategoryNameStatic(event.category)}: ${event.note}`;

    return events.map(formatEvent).join('\n');
}; 