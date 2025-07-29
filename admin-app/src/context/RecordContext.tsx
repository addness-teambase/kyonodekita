import React, { createContext, useContext, useState, useEffect } from 'react';
import { RecordEvent, CalendarEvent, ChildInfo, RecordCategory } from '../types';

interface RecordContextType {
    // 園児管理
    children: ChildInfo[];
    activeChildId: string | null;
    setActiveChildId: (childId: string | null) => void;
    addChild: (child: Omit<ChildInfo, 'id'>) => void;
    updateChild: (childId: string, updates: Partial<ChildInfo>) => void;
    deleteChild: (childId: string) => void;
    getChildById: (childId: string) => ChildInfo | undefined;

    // 記録管理
    recordEvents: RecordEvent[];
    addRecordEvent: (childId: string, category: RecordCategory, note: string) => void;
    updateRecordEvent: (recordId: string, updates: Partial<RecordEvent>) => void;
    deleteRecordEvent: (recordId: string) => void;
    getRecordsByChild: (childId: string) => RecordEvent[];
    getTodayRecordsByChild: (childId: string) => RecordEvent[];

    // カレンダー管理
    calendarEvents: CalendarEvent[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    addCalendarEvent: (date: Date, title: string, time?: string, description?: string) => void;
    updateCalendarEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
    deleteCalendarEvent: (eventId: string) => void;
    getCalendarEventsForDate: (date: Date) => CalendarEvent[];

    // ユーティリティ
    getCategoryName: (category: RecordCategory) => string;
    formatTime: (timestamp: string) => string;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

// ローカルストレージキー
const STORAGE_KEYS = {
    children: 'admin-app-children',
    records: 'admin-app-records',
    calendarEvents: 'admin-app-calendar-events',
    activeChildId: 'admin-app-active-child-id'
};

// ユーティリティ関数
const getFromStorage = <T>(key: string, defaultValue: T, userId?: string): T => {
  try {
    const storageKey = userId ? `${key}-${userId}` : key;
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

    const saveToStorage = <T>(key: string, value: T, userId?: string): void => {
  try {
    const storageKey = userId ? `${key}-${userId}` : key;
        localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
            console.error(`Error saving to localStorage (${key}):`, error);
  }
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

        export const RecordProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);
        const [recordEvents, setRecordEvents] = useState<RecordEvent[]>([]);
        const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
        const [activeChildId, setActiveChildId] = useState<string | null>(null);
        const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 初期化
  useEffect(() => {
    const loadedChildren = getFromStorage(STORAGE_KEYS.children, []);
            const loadedRecords = getFromStorage(STORAGE_KEYS.records, []);
            const loadedCalendarEvents = getFromStorage(STORAGE_KEYS.calendarEvents, []);
            const loadedActiveChildId = getFromStorage(STORAGE_KEYS.activeChildId, null);

            setChildrenList(loadedChildren);
            setRecordEvents(loadedRecords);
            setCalendarEvents(loadedCalendarEvents);
            setActiveChildId(loadedActiveChildId);
  }, []);

            // 園児管理
            const addChild = (child: Omit<ChildInfo, 'id'>) => {
    const newChild: ChildInfo = {
                ...child,
                id: generateId()
    };
            const updatedChildren = [...childrenList, newChild];
            setChildrenList(updatedChildren);
            saveToStorage(STORAGE_KEYS.children, updatedChildren);
  };

            const updateChild = (childId: string, updates: Partial<ChildInfo>) => {
    const updatedChildren = childrenList.map(child =>
                child.id === childId ? {...child, ...updates } : child
                );
                setChildrenList(updatedChildren);
                saveToStorage(STORAGE_KEYS.children, updatedChildren);
  };

  const deleteChild = (childId: string) => {
    const updatedChildren = childrenList.filter(child => child.id !== childId);
                setChildrenList(updatedChildren);
                saveToStorage(STORAGE_KEYS.children, updatedChildren);

    // 関連する記録も削除
    const updatedRecords = recordEvents.filter(record => record.childId !== childId);
                setRecordEvents(updatedRecords);
                saveToStorage(STORAGE_KEYS.records, updatedRecords);

                // アクティブな園児だった場合はクリア
                if (activeChildId === childId) {
                    setActiveChildId(null);
                saveToStorage(STORAGE_KEYS.activeChildId, null);
    }
  };

  const getChildById = (childId: string): ChildInfo | undefined => {
    return childrenList.find(child => child.id === childId);
  };

  // 記録管理
  const addRecordEvent = (childId: string, category: RecordCategory, note: string) => {
    const newRecord: RecordEvent = {
                    id: generateId(),
                childId,
                category,
                note,
                timestamp: new Date().toISOString()
    };
                const updatedRecords = [...recordEvents, newRecord];
                setRecordEvents(updatedRecords);
                saveToStorage(STORAGE_KEYS.records, updatedRecords);

                // 園児の今日の記録数を更新
                const child = getChildById(childId);
                if (child) {
      const todayRecords = getTodayRecordsByChild(childId).length + 1;
                updateChild(childId, {
                    todayRecords,
                    lastActivity: new Date().toISOString()
      });
    }
  };

                const updateRecordEvent = (recordId: string, updates: Partial<RecordEvent>) => {
    const updatedRecords = recordEvents.map(record =>
                    record.id === recordId ? {...record, ...updates } : record
                    );
                    setRecordEvents(updatedRecords);
                    saveToStorage(STORAGE_KEYS.records, updatedRecords);
  };

  const deleteRecordEvent = (recordId: string) => {
    const updatedRecords = recordEvents.filter(record => record.id !== recordId);
                    setRecordEvents(updatedRecords);
                    saveToStorage(STORAGE_KEYS.records, updatedRecords);
  };

  const getRecordsByChild = (childId: string): RecordEvent[] => {
    return recordEvents.filter(record => record.childId === childId);
  };

  const getTodayRecordsByChild = (childId: string): RecordEvent[] => {
    const today = new Date().toDateString();
    return recordEvents.filter(record =>
                    record.childId === childId &&
                    new Date(record.timestamp).toDateString() === today
                    );
  };

  // カレンダー管理
  const addCalendarEvent = (date: Date, title: string, time?: string, description?: string) => {
    const newEvent: CalendarEvent = {
                        id: generateId(),
                    date: date.toISOString().split('T')[0],
                    title,
                    time,
                    description
    };
                    const updatedEvents = [...calendarEvents, newEvent];
                    setCalendarEvents(updatedEvents);
                    saveToStorage(STORAGE_KEYS.calendarEvents, updatedEvents);
  };

                    const updateCalendarEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    const updatedEvents = calendarEvents.map(event =>
                        event.id === eventId ? {...event, ...updates } : event
                        );
                        setCalendarEvents(updatedEvents);
                        saveToStorage(STORAGE_KEYS.calendarEvents, updatedEvents);
  };

  const deleteCalendarEvent = (eventId: string) => {
    const updatedEvents = calendarEvents.filter(event => event.id !== eventId);
                        setCalendarEvents(updatedEvents);
                        saveToStorage(STORAGE_KEYS.calendarEvents, updatedEvents);
  };

  const getCalendarEventsForDate = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateString);
  };

  // ユーティリティ
  const getCategoryName = (category: RecordCategory): string => {
    const names = {
                            achievement: 'できたこと',
                        happy: 'うれしかったこと',
                        failure: 'きになること',
                        trouble: 'こまったこと'
    };
                        return names[category] || category;
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
                        return date.toLocaleTimeString('ja-JP', {
                            hour: 'numeric',
                        minute: 'numeric',
                        hour12: false
    });
  };

                        const value: RecordContextType = {
                            // 園児管理
                            children: childrenList,
                        activeChildId,
    setActiveChildId: (childId: string | null) => {
                            setActiveChildId(childId);
                        saveToStorage(STORAGE_KEYS.activeChildId, childId);
    },
                        addChild,
                        updateChild,
                        deleteChild,
                        getChildById,

                        // 記録管理
                        recordEvents,
                        addRecordEvent,
                        updateRecordEvent,
                        deleteRecordEvent,
                        getRecordsByChild,
                        getTodayRecordsByChild,

                        // カレンダー管理
                        calendarEvents,
                        selectedDate,
                        setSelectedDate,
                        addCalendarEvent,
                        updateCalendarEvent,
                        deleteCalendarEvent,
                        getCalendarEventsForDate,

                        // ユーティリティ
                        getCategoryName,
                        formatTime
  };

                        return (
                        <RecordContext.Provider value={value}>
                            {children}
                        </RecordContext.Provider>
                        );
};

export const useRecord = (): RecordContextType => {
  const context = useContext(RecordContext);
                        if (context === undefined) {
    throw new Error('useRecord must be used within a RecordProvider');
  }
                        return context;
};

                        export type {RecordCategory}; 