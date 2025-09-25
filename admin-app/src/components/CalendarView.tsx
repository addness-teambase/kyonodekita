import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Clock, Users, BookOpen, MessageSquare } from 'lucide-react';
import { format, isSameDay, isToday, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    time?: string;
    description?: string;
    is_facility_wide?: boolean;
    priority?: 'normal' | 'high';
    type?: string;
}

interface ChildInfo {
    id: string;
    name: string;
    age: number;
    parentName: string;
    avatar: string;
    isScheduledToday: boolean;
    attendanceStatus: 'present' | 'absent' | 'not_arrived';
    todayActivities?: string[];
    arrivalTime?: string;
    departureTime?: string;
}

interface AttendanceRecord {
    id: string;
    childId: string;
    date: string;
    usageStartTime?: string;
    usageEndTime?: string;
    childCondition: string;
    activities: string;
    recordedBy: string;
}

// 今日の日付
const TODAY = format(new Date(), 'yyyy-MM-dd');

const CalendarView: React.FC = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventType, setNewEventType] = useState<'facility_event' | 'facility_notice' | 'facility_schedule'>('facility_event');
    const [newEventPriority, setNewEventPriority] = useState<'normal' | 'high'>('normal');
    const [isFacilityWide, setIsFacilityWide] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // カレンダー日付の生成（月表示用）
    const calendarDays = React.useMemo(() => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });

        // 月の最初の日の曜日を取得（0: 日曜日, 1: 月曜日, ...）
        const firstDayOfMonth = getDay(start);

        // 前月の空白を埋める
        const prevMonthDays = Array(firstDayOfMonth).fill(null);

        return [...prevMonthDays, ...days];
    }, [selectedDate]);

    // 前月へ
    const handlePrevMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1));
    };

    // 次月へ
    const handleNextMonth = () => {
        setSelectedDate(addMonths(selectedDate, 1));
    };

    // 日付を選択したときの処理
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    // Supabaseから予定を読み込む（統合データベース対応）
    const loadEvents = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // 管理者が管理する施設を取得
            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .select('id, name')
                .eq('admin_user_id', user.id)
                .maybeSingle();

            if (facilityError || !facilityData) {
                console.error('施設情報取得エラー:', facilityError);
                console.log('管理者ID:', user.id);
                return;
            }

            console.log('施設データ取得成功:', facilityData);

            // その施設のカレンダー予定を取得
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('facility_id', facilityData.id)
                .order('date', { ascending: true });

            if (error) {
                console.error('予定取得エラー:', error);
                return;
            }

            const calendarEvents = data?.map(event => ({
                id: event.id,
                date: event.date,
                title: event.title,
                time: event.time || undefined,
                description: event.description || undefined,
                is_facility_wide: event.is_facility_wide,
                priority: event.priority,
                type: event.type
            })) || [];

            setEvents(calendarEvents);
        } catch (error) {
            console.error('予定読み込みエラー:', error);
        } finally {
            setLoading(false);
        }
    };

    // 初期化時に予定を読み込む
    useEffect(() => {
        loadEvents();
    }, [user]);

    // 予定追加モーダルを開く
    const openAddEventModal = () => {
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventDescription('');
        setNewEventType('facility_event');
        setNewEventPriority('normal');
        setIsFacilityWide(true);
        setIsAddEventModalOpen(true);
    };

    // 予定を追加する
    const handleAddEvent = async () => {
        if (!newEventTitle.trim() || !user) return;

        setLoading(true);
        try {
            // 現在のユーザーの施設情報を取得
            const { data: facilityUser, error: facilityError } = await supabase
                .from('facility_users')
                .select('facility_id')
                .eq('user_id', user.id)
                .single();

            if (facilityError || !facilityUser) {
                console.error('施設情報取得エラー:', facilityError);
                alert('施設情報の取得に失敗しました。');
                return;
            }

            // Supabaseに予定を保存
            const { data, error } = await supabase
                .from('calendar_events')
                .insert({
                    facility_id: facilityUser.facility_id,
                    facility_user_id: user.id,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    title: newEventTitle,
                    time: newEventTime || null,
                    description: newEventDescription || null,
                    type: newEventType,
                    is_facility_wide: isFacilityWide,
                    priority: newEventPriority,
                    user_id: null, // 管理者が作成した場合はnull
                    child_id: null // 管理者が作成した場合はnull
                })
                .select()
                .single();

            if (error) {
                console.error('予定保存エラー:', error);
                alert('予定の保存に失敗しました。');
                return;
            }

            // ローカルの予定リストを更新
            const newEvent: CalendarEvent = {
                id: data.id,
                date: data.date,
                title: data.title,
                time: data.time || undefined,
                description: data.description || undefined,
                is_facility_wide: data.is_facility_wide,
                priority: data.priority,
                type: data.type
            };

            setEvents([...events, newEvent]);
            setIsAddEventModalOpen(false);
            setNewEventTitle('');
            setNewEventTime('');
            setNewEventDescription('');

            alert('園の予定を追加しました！全保護者のカレンダーに表示されます。');
        } catch (error) {
            console.error('予定追加エラー:', error);
            alert('予定の追加中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 予定削除
    const handleDeleteEvent = async (eventId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);

            if (error) {
                console.error('予定削除エラー:', error);
                alert('予定の削除に失敗しました。');
                return;
            }

            setEvents(events.filter(event => event.id !== eventId));
        } catch (error) {
            console.error('予定削除エラー:', error);
            alert('予定の削除中にエラーが発生しました。');
        }
    };

    // 特定の日付の予定を取得
    const getEventsForDate = (date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        return events.filter(event => event.date === dateString);
    };

    // 選択された日付の予定
    const selectedDateEvents = getEventsForDate(selectedDate);

    return (
        <div className="space-y-6">
            {/* カレンダーヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <CalendarIcon className="w-6 h-6 text-pink-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">カレンダー</h2>
                                <p className="text-sm text-gray-500 mt-1">園の予定を管理しましょう</p>
                            </div>
                        </div>
                        <button
                            onClick={openAddEventModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">予定追加</span>
                        </button>
                    </div>
                </div>

                {/* カレンダーグリッド */}
                <div className="p-6">
                    {/* 月ナビゲーション */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900">
                            {format(selectedDate, 'yyyy年M月', { locale: ja })}
                        </h3>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                            <div
                                key={day}
                                className={`text-center py-2 text-sm font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* カレンダーグリッド */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return <div key={index} className="aspect-square"></div>;
                            }

                            const dateEvents = getEventsForDate(date);
                            const isSelected = isSameDay(date, selectedDate);
                            const isCurrentDay = isToday(date);

                            return (
                                <button
                                    key={date.toString()}
                                    onClick={() => handleDateSelect(date)}
                                    className={`aspect-square p-2 rounded-xl text-sm transition-all duration-200 relative ${isSelected
                                        ? 'bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg transform scale-95'
                                        : isCurrentDay
                                            ? 'bg-pink-100 text-pink-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="block">{format(date, 'd')}</span>
                                    {dateEvents.length > 0 && (
                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                            <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 選択日の詳細 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">
                        {format(selectedDate, 'M月d日(E)', { locale: ja })} の予定
                    </h3>
                </div>
                <div className="p-6">
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-3">
                            {selectedDateEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-4 border border-pink-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                                {event.is_facility_wide && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                        園全体
                                                    </span>
                                                )}
                                                {event.priority === 'high' && (
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                        重要
                                                    </span>
                                                )}
                                            </div>
                                            {event.time && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {event.time}
                                                </p>
                                            )}
                                            {event.description && (
                                                <p className="text-sm text-gray-700">{event.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">この日の予定はありません</p>
                            <button
                                onClick={openAddEventModal}
                                className="mt-4 text-pink-600 hover:text-pink-700 text-sm font-medium"
                            >
                                予定を追加する
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 予定追加モーダル */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">予定追加</h3>
                                <button
                                    onClick={() => setIsAddEventModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                {format(selectedDate, 'M月d日(E)', { locale: ja })}
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    予定タイトル
                                </label>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                                    placeholder="例: 避難訓練"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    時間（任意）
                                </label>
                                <input
                                    type="time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    説明（任意）
                                </label>
                                <textarea
                                    value={newEventDescription}
                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                                    rows={3}
                                    placeholder="例: 地震を想定した避難訓練を実施します"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        予定タイプ
                                    </label>
                                    <select
                                        value={newEventType}
                                        onChange={(e) => setNewEventType(e.target.value as any)}
                                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                                    >
                                        <option value="facility_event">行事・イベント</option>
                                        <option value="facility_notice">お知らせ</option>
                                        <option value="facility_schedule">スケジュール</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        重要度
                                    </label>
                                    <select
                                        value={newEventPriority}
                                        onChange={(e) => setNewEventPriority(e.target.value as any)}
                                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                                    >
                                        <option value="normal">通常</option>
                                        <option value="high">重要</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="facilityWide"
                                        checked={isFacilityWide}
                                        onChange={(e) => setIsFacilityWide(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="facilityWide" className="text-sm font-medium text-blue-900">
                                        園全体の予定として追加
                                    </label>
                                </div>
                                <p className="text-xs text-blue-700 mt-2 ml-7">
                                    チェックすると、全保護者のカレンダーに自動的に表示されます
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsAddEventModalOpen(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all duration-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleAddEvent}
                                    disabled={loading || !newEventTitle.trim()}
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 rounded-2xl font-medium hover:from-pink-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {loading ? '追加中...' : '追加'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;