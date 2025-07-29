import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Clock } from 'lucide-react';
import { format, isSameDay, isToday, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    time?: string;
    description?: string;
}

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