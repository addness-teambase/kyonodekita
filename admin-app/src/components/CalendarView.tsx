import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Clock, Users, BookOpen, MessageSquare } from 'lucide-react';
import { format, isSameDay, isToday, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    time?: string;
    description?: string;
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

// デモデータ
const DEMO_CHILDREN: ChildInfo[] = [
    {
        id: 'child1',
        name: '山田花子',
        age: 5,
        parentName: '山田一郎',
        avatar: 'YH',
        isScheduledToday: true,
        attendanceStatus: 'present',
        arrivalTime: '09:00',
        departureTime: '15:00',
        todayActivities: ['お絵描き', '外遊び', 'お昼寝']
    },
    {
        id: 'child2',
        name: '佐藤太郎',
        age: 4,
        parentName: '佐藤美香',
        avatar: 'ST',
        isScheduledToday: true,
        attendanceStatus: 'present',
        arrivalTime: '08:30',
        departureTime: '16:00',
        todayActivities: ['積み木遊び', '読み聞かせ', '体操']
    },
    {
        id: 'child3',
        name: '鈴木みお',
        age: 3,
        parentName: '鈴木健二',
        avatar: 'SM',
        isScheduledToday: true,
        attendanceStatus: 'not_arrived',
        arrivalTime: '10:00',
        departureTime: '14:00'
    },
    {
        id: 'child4',
        name: '田中けんた',
        age: 6,
        parentName: '田中智子',
        avatar: 'TK',
        isScheduledToday: false,
        attendanceStatus: 'absent'
    }
];

const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = [
    {
        id: 'record1',
        childId: 'child1',
        date: TODAY,
        usageStartTime: '09:00',
        usageEndTime: '15:00',
        childCondition: '元気いっぱいで朝から笑顔でした。お友達と仲良く遊んでいました。',
        activities: 'お絵描きでお母さんの絵を描いて、外遊びではブランコを楽しんでいました。お昼寝もしっかりできました。',
        recordedBy: '田中先生'
    },
    {
        id: 'record2',
        childId: 'child2',
        date: TODAY,
        usageStartTime: '08:30',
        usageEndTime: '16:00',
        childCondition: '今日も元気で、積極的に活動に参加していました。',
        activities: '積み木で高い塔を作って得意げでした。読み聞かせの時間は集中して聞いていました。',
        recordedBy: '山田先生'
    }
];

const CalendarView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [events, setEvents] = useState<CalendarEvent[]>([
        {
            id: '1',
            date: '2024-01-15',
            title: '避難訓練',
            time: '10:00',
            description: '地震を想定した避難訓練を実施します'
        },
        {
            id: '2',
            date: '2024-01-20',
            title: 'お誕生日会',
            time: '14:00',
            description: '1月生まれのお友達をお祝いします'
        },
        {
            id: '3',
            date: '2024-01-25',
            title: '遠足',
            time: '09:30',
            description: '近くの公園へみんなで遠足に行きます'
        }
    ]);

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

    // 予定追加モーダルを開く
    const openAddEventModal = () => {
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventDescription('');
        setIsAddEventModalOpen(true);
    };

    // 予定を追加する
    const handleAddEvent = () => {
        if (!newEventTitle.trim()) return;

        const newEvent: CalendarEvent = {
            id: `event_${Date.now()}`,
            date: format(selectedDate, 'yyyy-MM-dd'),
            title: newEventTitle,
            time: newEventTime,
            description: newEventDescription
        };

        setEvents([...events, newEvent]);
        setIsAddEventModalOpen(false);
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventDescription('');
    };

    // 予定削除
    const handleDeleteEvent = (eventId: string) => {
        setEvents(events.filter(event => event.id !== eventId));
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
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">
                                {format(selectedDate, 'yyyy年M月', { locale: ja })}
                            </h2>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <button
                            onClick={openAddEventModal}
                            className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            予定追加
                        </button>
                    </div>
                </div>

                {/* カレンダーグリッド */}
                <div className="p-6">
                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                            <div
                                key={day}
                                className={`h-10 flex items-center justify-center text-sm font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* 日付グリッド */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (!day) {
                                return <div key={index} className="h-20"></div>;
                            }

                            const dayEvents = getEventsForDate(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const today = isToday(day);

                            return (
                                <button
                                    key={format(day, 'yyyy-MM-dd')}
                                    onClick={() => handleDateSelect(day)}
                                    className={`h-20 p-2 border border-gray-100 rounded-xl transition-all duration-200 hover:bg-gray-50 ${isSelected
                                        ? 'bg-gradient-to-r from-pink-50 to-orange-50 border-pink-200'
                                        : ''
                                        }`}
                                >
                                    <div className="flex flex-col h-full">
                                        <div
                                            className={`text-sm font-medium mb-1 ${today
                                                ? 'text-white bg-pink-500 w-6 h-6 rounded-full flex items-center justify-center'
                                                : 'text-gray-900'
                                                }`}
                                        >
                                            {format(day, 'd')}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="bg-pink-100 text-pink-700 text-xs px-1 py-0.5 rounded truncate"
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-gray-500">
                                                    +{dayEvents.length - 2}件
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 選択日の予定詳細 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">
                        {format(selectedDate, 'M月d日(E)', { locale: ja })}の予定
                    </h3>
                </div>
                <div className="p-6">
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <CalendarIcon className="w-4 h-4 text-pink-500" />
                                                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                                {event.time && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {event.time}
                                                    </div>
                                                )}
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-gray-600">{event.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all duration-200"
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

            {/* 今日の園児一覧 */}
            {isToday(selectedDate) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-gray-900">今日来る園児</h3>
                                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                                    {DEMO_CHILDREN.filter(child => child.isScheduledToday).length}名
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {DEMO_CHILDREN.filter(child => child.isScheduledToday).map((child) => {
                                const attendanceRecord = DEMO_ATTENDANCE_RECORDS.find(record => record.childId === child.id);
                                const statusColors = {
                                    present: 'bg-green-100 text-green-700 border-green-200',
                                    not_arrived: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    absent: 'bg-red-100 text-red-700 border-red-200'
                                };
                                const statusLabels = {
                                    present: '出席中',
                                    not_arrived: '未到着',
                                    absent: '欠席'
                                };

                                return (
                                    <div key={child.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                        {/* 園児情報ヘッダー */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                                                    <span className="text-white font-bold text-sm">{child.avatar}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{child.name}</h4>
                                                    <p className="text-xs text-gray-500">{child.age}歳 • {child.parentName}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[child.attendanceStatus]}`}>
                                                {statusLabels[child.attendanceStatus]}
                                            </span>
                                        </div>

                                        {/* 出席時間 */}
                                        {child.attendanceStatus === 'present' && (
                                            <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>到着: {child.arrivalTime}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>予定: {child.departureTime}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 今日の活動 */}
                                        {child.todayActivities && child.todayActivities.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-600 mb-1">今日の活動</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {child.todayActivities.map((activity, index) => (
                                                        <span key={index} className="bg-white text-blue-600 text-xs px-2 py-1 rounded-md border border-blue-200">
                                                            {activity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 活動記録があれば表示 */}
                                        {attendanceRecord && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-blue-600">活動記録あり</span>
                                                    <span className="text-xs text-gray-500">{attendanceRecord.recordedBy}</span>
                                                </div>
                                                <p className="text-xs text-gray-700 line-clamp-2">
                                                    {attendanceRecord.childCondition}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 rounded-2xl font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                                >
                                    追加
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