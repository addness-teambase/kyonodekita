import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    addChild: (name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => string;
    updateChildInfo: (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => void;
    removeChild: (id: string) => void;
    // 今日が誕生日かどうか
    isBirthday: () => boolean;
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

    // 現在アクティブな子供の情報
    const childInfo = activeChildId ? childrenList.find(child => child.id === activeChildId) || null : null;

    const today = startOfToday();

    // 初期化: ローカルストレージからデータを読み込む
    useEffect(() => {
        loadFromLocalStorage();
    }, []);

    // ローカルストレージからデータを読み込む
    const loadFromLocalStorage = () => {
        try {
            const storedChildren = localStorage.getItem('children');
            const storedRecordEvents = localStorage.getItem('recordEvents');
            const storedCalendarEvents = localStorage.getItem('calendarEvents');
            const storedActiveChildId = localStorage.getItem('activeChildId');
            const storedCachedContent = localStorage.getItem('cachedContent');

            if (storedChildren) {
                const parsedChildren = JSON.parse(storedChildren);
                setChildrenList(parsedChildren);
            }

            if (storedRecordEvents) {
                const parsedRecordEvents = JSON.parse(storedRecordEvents);
                setRecordEvents(parsedRecordEvents);
            }

            if (storedCalendarEvents) {
                const parsedCalendarEvents = JSON.parse(storedCalendarEvents);
                setCalendarEvents(parsedCalendarEvents);
            }

            if (storedActiveChildId) {
                setActiveChildId(storedActiveChildId);
            }

            if (storedCachedContent) {
                setCachedContent(JSON.parse(storedCachedContent));
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    };

    // データをローカルストレージに保存
    const saveToLocalStorage = () => {
        try {
            localStorage.setItem('children', JSON.stringify(childrenList));
            localStorage.setItem('recordEvents', JSON.stringify(recordEvents));
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            localStorage.setItem('activeChildId', activeChildId || '');
            localStorage.setItem('cachedContent', JSON.stringify(cachedContent));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    };

    // データが変更されたときに自動保存
    useEffect(() => {
        saveToLocalStorage();
    }, [childrenList, recordEvents, calendarEvents, activeChildId, cachedContent]);

    // 選択された日付を更新
    const updateSelectedDate = (date: Date) => {
        setLastSelectedDate(selectedDate);
        setSelectedDate(date);
    };

    // 記録イベントを追加
    const addRecordEvent = (category: RecordCategory, note: string) => {
        if (!childInfo) return;

        const newEvent: RecordEvent = {
            id: crypto.randomUUID(),
            childId: childInfo.id,
            timestamp: new Date().toISOString(),
            category,
            note
        };

        setRecordEvents(prev => [...prev, newEvent]);
        setIsAnimating(true);
    };

    // 記録イベントを削除
    const deleteRecordEvent = (id: string) => {
        setRecordEvents(prev => prev.filter(event => event.id !== id));
    };

    // 予定を追加
    const addCalendarEvent = (date: Date, title: string, time?: string, description?: string) => {
        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            date: format(date, 'yyyy-MM-dd'),
            title,
            time,
            description
        };

        setCalendarEvents(prev => [...prev, newEvent]);
    };

    // 予定を削除
    const deleteCalendarEvent = (id: string) => {
        setCalendarEvents(prev => prev.filter(event => event.id !== id));
    };

    // 特定の日付の予定を取得
    const getCalendarEventsForDate = (date: Date): CalendarEvent[] => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return calendarEvents.filter(event => event.date === dateStr);
    };

    // カテゴリー名を取得
    const getCategoryName = (category: RecordCategory): string => {
        const categoryNames = {
            achievement: 'できた！',
            happy: 'うれしい',
            failure: '失敗',
            trouble: 'こまった'
        };
        return categoryNames[category];
    };

    // 子供を追加
    const addChild = (name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string): string => {
        const newChild: ChildInfo = {
            id: crypto.randomUUID(),
            name,
            age,
            birthdate,
            gender,
            avatarImage
        };

        setChildrenList(prev => [...prev, newChild]);

        // 最初の子供の場合、アクティブに設定
        if (childrenList.length === 0) {
            setActiveChildId(newChild.id);
        }

        return newChild.id;
    };

    // 子供の情報を更新
    const updateChildInfo = (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string) => {
        setChildrenList(prev =>
            prev.map(child =>
                child.id === id
                    ? { ...child, name, age, birthdate, gender, avatarImage }
                    : child
            )
        );
    };

    // 子供を削除
    const removeChild = (id: string) => {
        setChildrenList(prev => prev.filter(child => child.id !== id));
        setRecordEvents(prev => prev.filter(event => event.childId !== id));

        // アクティブな子供が削除された場合、他の子供を選択
        if (activeChildId === id) {
            const remainingChildren = childrenList.filter(child => child.id !== id);
            setActiveChildId(remainingChildren.length > 0 ? remainingChildren[0].id : null);
        }
    };

    // 今日が誕生日かどうか
    const isBirthday = (): boolean => {
        if (!childInfo || !childInfo.birthdate) return false;

        const today = new Date();
        const birthdate = new Date(childInfo.birthdate);

        return today.getMonth() === birthdate.getMonth() &&
            today.getDate() === birthdate.getDate();
    };

    // 今日のイベントを取得
    const todayEvents = recordEvents.filter(event =>
        childInfo &&
        event.childId === childInfo.id &&
        isSameDay(new Date(event.timestamp), today)
    );

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
            isBirthday
        }}>
            {children}
        </RecordContext.Provider>
    );
};

export const getMotivationalMessage = async (events: RecordEvent[]): Promise<string> => {
    try {
        // 基本的なフィードバック
        const achievementCount = events.filter(e => e.category === 'achievement').length;
        const happyCount = events.filter(e => e.category === 'happy').length;
        const failureCount = events.filter(e => e.category === 'failure').length;
        const troubleCount = events.filter(e => e.category === 'trouble').length;

        if (achievementCount > 0) {
            return `今日は${achievementCount}個も「できた！」ことがありましたね！すごいです！`;
        }
        if (happyCount > 0) {
            return `今日は${happyCount}個も嬉しいことがありましたね！素敵な一日ですね！`;
        }
        if (failureCount > 0 || troubleCount > 0) {
            return `今日は少し大変でしたね。でも、記録することで次はもっと良くなりますよ！`;
        }

        return '今日も一日お疲れ様でした！';
    } catch (error) {
        console.error('Error generating motivational message:', error);
        return '今日も一日お疲れ様でした！';
    }
};

const getCategoryNameStatic = (category: RecordCategory): string => {
    const categoryNames = {
        achievement: 'できた！',
        happy: 'うれしい',
        failure: '失敗',
        trouble: 'こまった'
    };
    return categoryNames[category];
};

export const generateDiarySummary = async (events: RecordEvent[]): Promise<string> => {
    try {
        if (events.length === 0) {
            return '今日は特に記録がありませんでした。';
        }

        // 基本的な日記生成
        return defaultSummary(events);
    } catch (error) {
        console.error('Error generating diary summary:', error);
        return defaultSummary(events);
    }
};

const defaultSummary = (events: RecordEvent[]): string => {
    if (events.length === 0) {
        return '今日は特に記録がありませんでした。';
    }

    const formatEvent = (event: RecordEvent) => {
        const categoryName = getCategoryNameStatic(event.category);
        const time = new Date(event.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${time} ${categoryName}: ${event.note}`;
    };

    return events.map(formatEvent).join('\n');
}; 