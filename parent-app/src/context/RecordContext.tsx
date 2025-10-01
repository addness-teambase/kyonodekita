import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
    childId?: string; // 園全体予定の場合はundefined
    date: string;
    title: string;
    time?: string;
    description?: string;
    is_facility_wide?: boolean; // 園全体の予定かどうか
    priority?: 'normal' | 'high';
    type?: string;
    facility_user_id?: string; // 管理者が作成した場合
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
    isLoadingChildren: boolean;
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
    const [facilityInfo, setFacilityInfo] = useState<{ id: string; name: string; address?: string; phone?: string; email?: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<RecordCategory>('achievement');
    const [isAnimating, setIsAnimating] = useState(false);
    const [cachedContent, setCachedContent] = useState<CachedContent>({});
    const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
    const [isDataMigrated, setIsDataMigrated] = useState(true); // ローカルストレージ使用なので常にtrue
    const [isLoadingChildren, setIsLoadingChildren] = useState(true); // 子供データの読み込み状態
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false); // 初回データ読み込み完了フラグ

    // 現在アクティブな子供の情報
    const childInfo = activeChildId ? childrenList.find(child => child.id === activeChildId) || null : null;

    const today = startOfToday();

    // Supabaseからデータを読み込む（初回のみ）
    useEffect(() => {
        if (isAuthenticated && user && !hasLoadedInitialData) {
            console.log('🚀 初回データロード開始');
            loadDataFromSupabase();
        } else if (!isAuthenticated || !user) {
            // ユーザーがいない場合はローディングを終了
            setIsLoadingChildren(false);
            setHasLoadedInitialData(false);
        }
    }, [isAuthenticated, user, hasLoadedInitialData]);

    // 子供が変更された時に出席記録を再読み込み
    useEffect(() => {
        if (activeChildId && hasLoadedInitialData && user) {
            console.log('👶 子供が変更されました。出席記録を再読み込みします:', activeChildId);
            refreshAttendanceRecords(activeChildId);
        }
    }, [activeChildId, hasLoadedInitialData, user]);

    // Supabaseからデータを読み込む関数
    const loadDataFromSupabase = async () => {
        if (!user) {
            setIsLoadingChildren(false);
            return;
        }

        setIsLoadingChildren(true);
        try {
            // 親ユーザーに関連する子供データと施設情報を取得（JOINエラー回避）
            const { data: facilityChildrenData, error: facilityChildrenError } = await supabase
                .from('facility_children')
                .select('child_id, facility_id')
                .eq('parent_user_id', user.id)
                .eq('status', 'active');

            if (facilityChildrenError) {
                console.error('❌ 施設子供関係データの読み込みエラー:', facilityChildrenError.message);
            } else if (facilityChildrenData && facilityChildrenData.length > 0) {
                console.log('✅ 施設子供関係データ取得:', facilityChildrenData.length, '件');

                // 個別に子供データを取得
                const childrenList = [];
                for (const relation of facilityChildrenData) {
                    try {
                        const { data: childData, error: childError } = await supabase
                            .from('children')
                            .select('id, name, age, birthdate, gender, avatar_image')
                            .eq('id', relation.child_id)
                            .single();

                        if (childError) {
                            console.warn('子供データ取得スキップ:', relation.child_id);
                        } else if (childData) {
                            childrenList.push({
                                id: childData.id,
                                name: childData.name,
                                age: childData.age,
                                birthdate: childData.birthdate,
                                gender: childData.gender,
                                avatarImage: childData.avatar_image
                            });
                        }
                    } catch (childFetchError) {
                        console.warn('子供データ取得処理エラー:', relation.child_id);
                    }
                }

                setChildrenList(childrenList);
                console.log('✅ 子供リスト設定完了:', childrenList.length, '人');

                // アクティブな子供IDが設定されていない場合、最初の子供を選択
                if (childrenList.length > 0 && !activeChildId) {
                    setActiveChildId(childrenList[0].id);
                    console.log('✅ アクティブ子供ID設定:', childrenList[0].id, childrenList[0].name);
                }
            } else {
                console.log('👶 このユーザーに関連付けられた子供が見つかりません');
                setChildrenList([]);
            }

            // 記録データの読み込み（エラーハンドリング強化）
            try {
                const { data: records, error: recordsError } = await supabase
                    .from('records')
                    .select('id, child_id, category, note, timestamp, created_at')
                    .eq('user_id', user.id)
                    .order('timestamp', { ascending: false });

                if (recordsError) {
                    console.error('❌ 記録データの読み込みエラー:', recordsError.message);
                } else if (records) {
                    const recordsList = records.map(record => ({
                        id: record.id,
                        childId: record.child_id,
                        timestamp: record.timestamp || record.created_at,
                        category: record.category,
                        note: record.note
                    }));
                    setRecordEvents(recordsList);
                    console.log('✅ 記録データ読み込み完了:', recordsList.length, '件');
                } else {
                    console.log('📝 記録データなし（初回ログイン）');
                    setRecordEvents([]);
                }
            } catch (recordFetchError) {
                console.error('記録データ取得処理でエラー:', recordFetchError);
                setRecordEvents([]);
            }

            // カレンダーイベントの読み込み（個人予定）
            const { data: calendarEvents, error: calendarError } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (calendarError) {
                console.error('カレンダーデータの読み込みエラー:', calendarError);
            }

            // 園全体の共有予定を取得
            const facilityIds = [...new Set(facilityChildrenData?.map(item => item.facility_id).filter(Boolean) || [])];
            let facilityEvents: any[] = [];

            if (facilityIds.length > 0) {
                const { data: facilityEventsData, error: facilityEventsError } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .in('facility_id', facilityIds)
                    .eq('is_facility_wide', true)
                    .order('date', { ascending: true });

                if (facilityEventsError) {
                    console.error('園共有予定読み込みエラー:', facilityEventsError);
                } else {
                    facilityEvents = facilityEventsData || [];
                }
            }

            // 個人予定と園共有予定を統合
            const personalEvents = calendarEvents?.map(event => ({
                id: event.id,
                childId: event.child_id,
                date: event.date,
                title: event.title,
                time: stripSeconds(event.time),
                description: event.description && event.description.trim() !== '' ? event.description.trim() : null,
                is_facility_wide: false,
                priority: event.priority,
                type: event.type
            })) || [];

            const facilityEventsList = facilityEvents.map(event => ({
                id: event.id,
                childId: undefined, // 園全体予定なので子供IDはundefined
                date: event.date,
                title: `🏫 ${event.title}`, // 園の予定であることを示すアイコン
                time: stripSeconds(event.time),
                description: event.description && event.description.trim() !== '' ? event.description.trim() : null,
                is_facility_wide: true,
                priority: event.priority,
                type: event.type,
                facility_user_id: event.facility_user_id
            }));

            let allEvents = [...personalEvents, ...facilityEventsList];

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

            // 出席記録・出席予定（施設からの記録）の読み込み
            // activeChildIdがある場合のみ取得
            if (activeChildId || (childrenList.length > 0)) {
                const targetChildId = activeChildId || childrenList[0]?.id;
                if (targetChildId) {
                    const { data: attendanceData, error: attendanceError } = await supabase
                        .from('attendance_schedules')
                        .select('*')
                        .eq('child_id', targetChildId)
                        .order('date', { ascending: false })
                        .limit(60); // 過去の記録と未来の予定を含む

                    if (attendanceError) {
                        console.error('出席記録データの読み込みエラー:', attendanceError);
                    } else if (attendanceData) {
                        console.log('✅ 出席記録・予定を読み込みました:', attendanceData.length, '件');
                        setAttendanceRecords(attendanceData);

                        // 出席記録と予定をカレンダーイベントに変換して統合
                        const attendanceEvents = attendanceData.map(record => {
                            // scheduled（予定）の場合と present（出席済）の場合で表示を変える
                            const isScheduled = record.attendance_status === 'scheduled';
                            const { childCondition, activities } = parseAttendanceNotes(record.notes || '');

                            if (isScheduled) {
                                // 出席予定
                                return {
                                    id: `attendance_schedule_${record.id}`,
                                    childId: record.child_id,
                                    date: record.date,
                                    title: '🏫 登園予定',
                                    time: record.scheduled_arrival_time?.slice(0, 5),
                                    description: `${record.scheduled_arrival_time?.slice(0, 5) || ''} 〜 ${record.scheduled_departure_time?.slice(0, 5) || ''}`,
                                    type: 'attendance_schedule' as const,
                                    priority: 'normal' as const
                                };
                            } else {
                                // 出席記録（カレンダーには予定時刻を表示）
                                const scheduledStart = record.scheduled_arrival_time?.slice(0, 5);
                                const scheduledEnd = record.scheduled_departure_time?.slice(0, 5);
                                const displayTime = scheduledStart || record.actual_arrival_time?.slice(0, 5);
                                const displayDescription = (scheduledStart && scheduledEnd)
                                    ? `${scheduledStart} 〜 ${scheduledEnd} 施設利用予定`
                                    : '施設利用';

                                return {
                                    id: `attendance_${record.id}`,
                                    childId: record.child_id,
                                    date: record.date,
                                    title: '🏫 施設利用',
                                    time: displayTime,
                                    description: displayDescription,
                                    type: 'attendance_record' as const,
                                    attendanceRecord: {
                                        id: record.id,
                                        childId: record.child_id,
                                        date: record.date,
                                        usageStartTime: record.actual_arrival_time?.slice(0, 5),
                                        usageEndTime: record.actual_departure_time?.slice(0, 5),
                                        childCondition: childCondition,
                                        activities: activities,
                                        recordedBy: '施設スタッフ',
                                        recordedAt: record.created_at
                                    }
                                };
                            }
                        });

                        // 既存のカレンダーイベントと出席記録・予定イベントを統合
                        allEvents = [...allEvents, ...attendanceEvents];
                        console.log('✅ 出席記録・予定をカレンダーに統合しました:', attendanceEvents.length, '件');
                    }
                }
            }

            // 最終的にすべてのイベントを設定
            setCalendarEvents(allEvents);

        } catch (error) {
            console.log('Supabaseデータの読み込みエラー（オフラインモード）:', error);
            // オフラインモードでもアプリを正常に動作させる
        } finally {
            setIsLoadingChildren(false);
            setHasLoadedInitialData(true); // 初回データロード完了を記録
            console.log('✅ 初回データロード完了');
        }

        // ローカルストレージからも出席記録を読み込む（デモ用）
        try {
            const localAttendanceRecords = localStorage.getItem('admin-attendance-records');
            if (localAttendanceRecords) {
                const localRecords = JSON.parse(localAttendanceRecords);
                console.log('✅ ローカル出席記録を読み込みました:', localRecords.length, '件');
                setAttendanceRecords(prevRecords => [...prevRecords, ...localRecords]);
            }
        } catch (localError) {
            console.log('ローカル出席記録読み込みエラー:', localError);
        }
    };

    // データ移行は不要（ローカルストレージ使用）
    const migrateFromLocalStorage = async (): Promise<void> => {
        // 何もしない（既にローカルストレージを使用）
        setIsDataMigrated(true);
    };

    // 出席記録・予定を再読み込み（子供が変更された時に呼ばれる）
    const refreshAttendanceRecords = async (childId: string) => {
        if (!childId) return;

        try {
            console.log('🔄 出席記録・予定の再読み込み開始...', { childId });

            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance_schedules')
                .select('*')
                .eq('child_id', childId)
                .order('date', { ascending: false })
                .limit(60);

            if (attendanceError) {
                console.error('出席記録データの再読み込みエラー:', attendanceError);
                return;
            }

            if (attendanceData) {
                console.log('✅ 出席記録・予定を再読み込みしました:', attendanceData.length, '件');
                setAttendanceRecords(attendanceData);

                // 出席記録と予定をカレンダーイベントに変換
                const attendanceEvents = attendanceData.map(record => {
                    const isScheduled = record.attendance_status === 'scheduled';
                    const { childCondition, activities } = parseAttendanceNotes(record.notes || '');

                    if (isScheduled) {
                        // 出席予定
                        return {
                            id: `attendance_schedule_${record.id}`,
                            childId: record.child_id,
                            date: record.date,
                            title: '🏫 登園予定',
                            time: record.scheduled_arrival_time?.slice(0, 5),
                            description: `${record.scheduled_arrival_time?.slice(0, 5) || ''} 〜 ${record.scheduled_departure_time?.slice(0, 5) || ''}`,
                            type: 'attendance_schedule' as const,
                            priority: 'normal' as const
                        };
                    } else {
                        // 出席記録（カレンダーには予定時刻を表示）
                        const scheduledStart = record.scheduled_arrival_time?.slice(0, 5);
                        const scheduledEnd = record.scheduled_departure_time?.slice(0, 5);
                        const displayTime = scheduledStart || record.actual_arrival_time?.slice(0, 5);
                        const displayDescription = (scheduledStart && scheduledEnd)
                            ? `${scheduledStart} 〜 ${scheduledEnd} 施設利用予定`
                            : '施設利用';

                        return {
                            id: `attendance_${record.id}`,
                            childId: record.child_id,
                            date: record.date,
                            title: '🏫 施設利用',
                            time: displayTime,
                            description: displayDescription,
                            type: 'attendance_record' as const,
                            attendanceRecord: {
                                id: record.id,
                                childId: record.child_id,
                                date: record.date,
                                usageStartTime: record.actual_arrival_time?.slice(0, 5),
                                usageEndTime: record.actual_departure_time?.slice(0, 5),
                                childCondition: childCondition,
                                activities: activities,
                                recordedBy: '施設スタッフ',
                                recordedAt: record.created_at
                            }
                        };
                    }
                });

                // 既存のカレンダーイベントから出席記録・予定を除外し、新しいものを追加
                setCalendarEvents(prevEvents => {
                    const nonAttendanceEvents = prevEvents.filter(event =>
                        event.type !== 'attendance_record' && event.type !== 'attendance_schedule'
                    );
                    return [...nonAttendanceEvents, ...attendanceEvents];
                });

                console.log('✅ 出席記録・予定をカレンダーに統合しました:', attendanceEvents.length, '件');
            }
        } catch (error) {
            console.error('出席記録の再読み込みエラー:', error);
        }
    };

    const updateSelectedDate = (date: Date) => {
        setLastSelectedDate(selectedDate);
        setSelectedDate(date);
    };

    // 記録データのみを再読み込み（初回データロードの影響を受けない）
    const refreshRecords = async () => {
        if (!user) {
            console.warn('⚠️ ユーザーが未設定のため記録更新をスキップ');
            return;
        }

        try {
            console.log('🔄 記録データの再読み込み開始...（既存記録を上書きします）');

            const { data: records, error: recordsError } = await supabase
                .from('records')
                .select('id, child_id, category, note, timestamp, created_at')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false });

            if (recordsError) {
                console.error('❌ 記録データの再読み込みエラー:', recordsError.message);
                console.error('エラー詳細:', recordsError);
                return;
            }

            const recordsList = records?.map(record => ({
                id: record.id,
                childId: record.child_id,
                timestamp: record.timestamp || record.created_at,
                category: record.category,
                note: record.note
            })) || [];

            console.log('🔄 古い記録数:', recordEvents.length);
            console.log('🔄 新しい記録数:', recordsList.length);

            setRecordEvents(recordsList);
            console.log('✅ 記録データ再読み込み完了 - 最新のデータに更新されました');

            if (recordsList.length > 0) {
                console.log('📋 最新記録サンプル:', recordsList.slice(0, 2));
            }
        } catch (error) {
            console.error('❌ 記録データ再読み込み処理でエラー:', error);
        }
    };

    const addRecordEvent = async (category: RecordCategory, note: string): Promise<void> => {
        if (!user || !activeChildId) return;

        console.log('📝 記録作成開始:', {
            userId: user.id,
            activeChildId,
            category,
            note,
            currentRecordsCount: recordEvents.length
        });

        try {
            // 子供に関連付けられた施設IDを取得
            const { data: facilityData, error: facilityError } = await supabase
                .from('facility_children')
                .select('facility_id')
                .eq('child_id', activeChildId)
                .eq('parent_user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();

            if (facilityError) {
                console.error('❌ 施設ID取得エラー:', facilityError);
            }

            const facilityId = facilityData?.facility_id || null;
            console.log('✅ 施設ID:', facilityId);

            const { data, error } = await supabase
                .from('records')
                .insert({
                    child_id: activeChildId,
                    user_id: user.id,
                    facility_id: facilityId, // 施設IDを設定
                    category,
                    note,
                    timestamp: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('❌ 記録追加エラー:', error);
                return;
            }

            console.log('✅ Supabaseに記録保存成功:', {
                id: data.id,
                category: data.category,
                note: data.note,
                facility_id: data.facility_id
            });

            // Supabaseから最新の記録データを再読み込み
            console.log('🔄 最新データを取得して画面を更新します...');
            await refreshRecords();

            console.log('🎉 記録追加完了 - 画面に表示されているはずです！');
        } catch (error) {
            console.error('❌ 記録追加処理でエラー:', error);
        }
    };

    const updateRecordEvent = async (id: string, category: RecordCategory, note: string): Promise<void> => {
        if (!user) return;

        try {
            console.log('✏️ 記録更新開始:', { id, category, note });

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

            console.log('✅ 記録更新成功');

            // Supabaseから最新の記録データを再読み込み
            await refreshRecords();

            console.log('✅ 記録一覧を更新しました');
        } catch (error) {
            console.error('記録更新エラー:', error);
        }
    };

    const deleteRecordEvent = async (id: string): Promise<void> => {
        if (!user) return;

        try {
            console.log('🗑️ 記録削除開始:', { id });

            const { error } = await supabase
                .from('records')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('記録削除エラー:', error);
                return;
            }

            console.log('✅ 記録削除成功');

            // Supabaseから最新の記録データを再読み込み
            await refreshRecords();

            console.log('✅ 記録一覧を更新しました');
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

    // 出席記録のnotesフィールドを解析して内容を分割する
    const parseAttendanceNotes = (notes: string | null): { childCondition: string; activities: string } => {
        if (!notes) return { childCondition: '', activities: '' };

        const parts = notes.split('\n\n');
        let childCondition = '';
        let activities = '';

        for (const part of parts) {
            if (part.startsWith('【本人の様子】')) {
                childCondition = part.replace('【本人の様子】\n', '').trim();
            } else if (part.startsWith('【活動内容】')) {
                activities = part.replace('【活動内容】\n', '').trim();
            }
        }

        return { childCondition, activities };
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

        // 通常のカレンダーイベント
        const events = calendarEvents.filter(event =>
            event.date === dateStr &&
            event.childId === activeChildId
        );

        // 施設からの出席記録を追加（子供の名前でマッチング）
        const currentChild = activeChildId ? childrenList.find(c => c.id === activeChildId) : null;
        const attendanceEventsForDate = attendanceRecords
            .filter(record => {
                // 日付でフィルター
                if (record.date !== dateStr) return false;

                // 子供の名前でマッチング（ローカルモード対応）
                if (currentChild) {
                    // 記録に子供名が含まれているか確認（適当なロジック）
                    const recordHasChildName = record.notes && record.notes.includes(currentChild.name);
                    const isForCurrentChild = recordHasChildName || !record.child_id; // child_idがない場合は表示
                    return isForCurrentChild;
                }

                return true; // 子供が選択されていない場合は全て表示
            })
            .map(record => ({
                id: `attendance-${record.id}`,
                date: record.date,
                title: '施設での記録',
                time: record.actual_arrival_time ? stripSeconds(record.actual_arrival_time) : null,
                description: null,
                childId: record.child_id,
                type: 'attendance_record' as const,
                attendanceRecord: {
                    id: record.id,
                    childId: record.child_id,
                    date: record.date,
                    usageStartTime: record.actual_arrival_time,
                    usageEndTime: record.actual_departure_time,
                    childCondition: parseAttendanceNotes(record.notes).childCondition,
                    activities: parseAttendanceNotes(record.notes).activities,
                    recordedBy: record.created_by || '施設スタッフ',
                    recordedAt: record.created_at
                }
            }));

        // 全てのイベントを結合
        const allEvents = [...events, ...attendanceEventsForDate];

        // 時間順でソート（時間がない場合は最後に配置）
        return allEvents.sort((a, b) => {
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
            'failure': '気になること',
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
            // 子供に関連付けられた施設IDを取得
            const { data: facilityData, error: facilityError } = await supabase
                .from('facility_children')
                .select('facility_id')
                .eq('child_id', activeChildId)
                .eq('parent_user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();

            if (facilityError) {
                console.error('❌ 施設ID取得エラー:', facilityError);
            }

            const facilityId = facilityData?.facility_id || null;
            console.log('✅ 成長記録の施設ID:', facilityId);

            const { data, error } = await supabase
                .from('growth_records')
                .insert({
                    user_id: user.id,
                    child_id: activeChildId,
                    facility_id: facilityId, // 施設IDを設定
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

            console.log('✅ 成長記録追加完了:', { facility_id: facilityId });

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
        if (!user) {
            throw new Error('ログインが必要です。');
        }

        try {
            console.log('👶 子供登録開始:', {
                name,
                age,
                birthdate,
                gender,
                hasAvatar: !!avatarImage
            });

            // Supabaseに子供データを登録
            const { data: newChild, error } = await supabase
                .from('children')
                .insert({
                    user_id: user.id,
                    name: name,
                    age: age,
                    birthdate: birthdate,
                    gender: gender,
                    avatar_image: avatarImage
                })
                .select('id, name, age, birthdate, gender, avatar_image, created_at, updated_at')
                .single();

            if (error) {
                console.error('Supabase子供登録エラー:', error);
                throw new Error('子供の登録に失敗しました。もう一度お試しください。');
            }

            if (newChild) {
                // ローカル状態を更新
                const childInfo: ChildInfo = {
                    id: newChild.id,
                    name: newChild.name,
                    age: newChild.age,
                    birthdate: newChild.birthdate || '',
                    gender: newChild.gender as 'male' | 'female' | undefined,
                    avatarImage: newChild.avatar_image || undefined,
                    createdAt: new Date(newChild.created_at),
                    updatedAt: new Date(newChild.updated_at)
                };

                setChildren(prev => [...prev, childInfo]);

                console.log('👶 子供登録成功:', {
                    id: newChild.id,
                    name: newChild.name,
                    hasAvatar: !!newChild.avatar_image
                });

                return newChild.id;
            }

            throw new Error('登録データの作成に失敗しました。');
        } catch (error) {
            console.error('子供登録エラー:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('子供の登録に失敗しました。');
        }
    };

    const updateChildInfo = async (id: string, name: string, age: number, birthdate?: string, gender?: 'male' | 'female', avatarImage?: string): Promise<void> => {
        if (!user) return;

        try {
            console.log('子供情報更新開始:', { id, name, age, birthdate, gender, hasAvatar: !!avatarImage });

            // 保護者は子供の基本情報を編集可能
            const updateData: any = {
                name: name.trim(),
                age: age,
                birthdate: birthdate || null,
                gender: gender || 'female',
                avatar_image: avatarImage || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('children')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', user.id); // 自分の子供のみ編集可能

            if (error) {
                console.error('子供情報更新エラー:', error);
                throw error;
            }

            console.log('データベース更新成功');

            // ローカル状態も更新
            const updatedChildren = childrenList.map(child =>
                child.id === id ? {
                    ...child,
                    name: name.trim(),
                    age: age,
                    birthdate: birthdate || '',
                    gender: gender || 'female',
                    avatarImage: avatarImage || ''
                } : child
            );
            setChildrenList(updatedChildren);
            saveToStorage(STORAGE_KEYS.children, updatedChildren);

            console.log('子供情報更新完了');
        } catch (error) {
            console.error('子供情報更新エラー:', error);
            throw error;
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

    // デバッグ用：今日の記録数をログ出力
    useEffect(() => {
        console.log('📊 現在の状態:', {
            totalRecords: recordEvents.length,
            todayRecords: todayEvents.length,
            activeChildId,
            hasLoadedInitialData,
            isLoadingChildren
        });
    }, [recordEvents.length, todayEvents.length, activeChildId, hasLoadedInitialData, isLoadingChildren]);

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
            deleteGrowthRecord,
            isLoadingChildren
        }}>
            {children}
        </RecordContext.Provider>
    );
};

// 個人の成長記録に基づいたメッセージ生成
export const getPersonalizedRecordMessage = (events: RecordEvent[], childInfo?: any): string => {
    if (events.length === 0) return '';

    const childName = childInfo?.name || 'お子さま';

    // カテゴリー別の分析
    const categoryCounts = events.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
    }, {} as Record<RecordCategory, number>);

    // 主要なカテゴリーを特定
    const mainCategory = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] as RecordCategory;

    // カテゴリーに応じたメッセージ
    const categoryMessages = {
        achievement: [
            `${childName}のがんばりがすごいね！`,
            `${childName}ができることがふえたね✨`,
            `${childName}のチャレンジがすばらしい！`
        ],
        happy: [
            `${childName}のうれしそうなかおがみえるよ😊`,
            `${childName}がたのしそうでよかったね♪`,
            `${childName}のえがおがすてき！`
        ],
        failure: [
            `${childName}もがんばったね！つぎもチャレンジしよう`,
            `${childName}のきもち、よくわかるよ。だいじょうぶ！`,
            `${childName}はいつもがんばってるね💪`
        ],
        trouble: [
            `${childName}のこまったきもち、きいてるよ`,
            `${childName}といっしょにかんがえよう`,
            `${childName}はひとりじゃないよ、だいじょうぶ`
        ]
    };

    const messageList = categoryMessages[mainCategory] || categoryMessages.achievement;
    const message = messageList[Math.floor(Math.random() * messageList.length)];

    // 記録数に応じた追加メッセージ
    let additionalMessage = '';
    if (events.length >= 3) {
        additionalMessage = ' きょうもたくさんきろくしてくれてありがとう！';
    } else if (events.length === 1) {
        additionalMessage = ' きろくしてくれてありがとう！';
    }

    return message + additionalMessage;
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

// 個人の成長記録に基づいた日記サマリー生成
export const generatePersonalizedDiarySummary = (events: RecordEvent[], childInfo?: any): string => {
    if (events.length === 0) {
        return `${childInfo?.name || 'お子さま'}の今日の記録

まだ記録がありません。今日の「できたこと」や「うれしかったこと」があったら、ぜひ記録してみてくださいね！`;
    }

    const childName = childInfo?.name || 'お子さま';

    // カテゴリー別に記録を分類
    const eventsByCategory = events.reduce((acc, event) => {
        if (!acc[event.category]) acc[event.category] = [];
        acc[event.category].push(event);
        return acc;
    }, {} as Record<RecordCategory, RecordEvent[]>);

    let summary = `${childName}の今日の記録\n\n`;

    // 良かった記録から先に表示
    if (eventsByCategory.achievement) {
        summary += `✨ ${childName}ができたこと\n`;
        eventsByCategory.achievement.forEach(event => {
            summary += `• ${event.note}\n`;
        });
        summary += '\n';
    }

    if (eventsByCategory.happy) {
        summary += `😊 ${childName}がうれしかったこと\n`;
        eventsByCategory.happy.forEach(event => {
            summary += `• ${event.note}\n`;
        });
        summary += '\n';
    }

    // 困ったことも成長の記録として表示
    if (eventsByCategory.failure) {
        summary += `💪 ${childName}がチャレンジしたこと\n`;
        eventsByCategory.failure.forEach(event => {
            summary += `• ${event.note}\n`;
        });
        summary += '\n';
    }

    if (eventsByCategory.trouble) {
        summary += `💭 ${childName}がかんがえたこと\n`;
        eventsByCategory.trouble.forEach(event => {
            summary += `• ${event.note}\n`;
        });
        summary += '\n';
    }

    // 成長メッセージを追加
    const totalEvents = events.length;
    if (totalEvents >= 3) {
        summary += `🌟 今日は${totalEvents}個のことを記録しました。たくさんの成長がありましたね！`;
    } else {
        summary += `🌟 ${childName}の成長の記録、ありがとうございました！`;
    }

    return summary;
}; 