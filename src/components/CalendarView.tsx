import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, Calendar as CalendarIcon, Trash2, Clock } from 'lucide-react';
import { format, isSameDay, isToday, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRecord } from '../context/RecordContext';
import { Dialog } from '@headlessui/react';



const CalendarView: React.FC = () => {
    const {
        recordEvents,
        selectedDate,
        setSelectedDate,
        addCalendarEvent,
        deleteCalendarEvent,
        getCalendarEventsForDate
    } = useRecord();

    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    // トグル用の状態
    const [isEventsOpen, setIsEventsOpen] = useState(true);
    const [isRecordsOpen, setIsRecordsOpen] = useState(true);

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

        addCalendarEvent(selectedDate, newEventTitle, newEventTime, newEventDescription);
        setIsAddEventModalOpen(false);
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventDescription('');
    };

    // 予定削除確認モーダルを開く
    const openDeleteConfirmModal = (eventId: string) => {
        setEventToDelete(eventId);
        setIsDeleteConfirmOpen(true);
    };

    // 予定削除を実行
    const handleDeleteEvent = () => {
        if (eventToDelete) {
            deleteCalendarEvent(eventToDelete);
            setIsDeleteConfirmOpen(false);
            setEventToDelete(null);
        }
    };

    // 特定の日付の記録を取得
    const getRecordsForDate = (date: Date) => {
        return recordEvents.filter(record => isSameDay(new Date(record.timestamp), date));
    };

    // 選択された日付の詳細表示
    const renderDayDetails = () => {
        const dayEvents = getCalendarEventsForDate(selectedDate);
        const dayRecords = getRecordsForDate(selectedDate);

        const categoryCounts = {
            achievement: dayRecords.filter(r => r.category === 'achievement').length,
            happy: dayRecords.filter(r => r.category === 'happy').length,
            failure: dayRecords.filter(r => r.category === 'failure').length,
            trouble: dayRecords.filter(r => r.category === 'trouble').length
        };

        return (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                    {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                </h3>

                {/* カテゴリー別の記録件数 */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-emerald-50 p-2 rounded-lg text-center">
                        <span className="text-2xs text-gray-600">できた</span>
                        <p className="text-base font-semibold text-emerald-600">{categoryCounts.achievement}</p>
                    </div>
                    <div className="bg-sky-50 p-2 rounded-lg text-center">
                        <span className="text-2xs text-gray-600">嬉しい</span>
                        <p className="text-base font-semibold text-sky-600">{categoryCounts.happy}</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg text-center">
                        <span className="text-2xs text-gray-600">気になった</span>
                        <p className="text-base font-semibold text-amber-600">{categoryCounts.failure}</p>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-lg text-center">
                        <span className="text-2xs text-gray-600">困った</span>
                        <p className="text-base font-semibold text-rose-600">{categoryCounts.trouble}</p>
                    </div>
                </div>

                {/* 予定セクション（トグル可能） */}
                <div className="mb-4">
                    <div
                        className="flex items-center justify-between py-2 cursor-pointer border-b border-gray-200"
                        onClick={() => setIsEventsOpen(!isEventsOpen)}
                    >
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            {isEventsOpen ? <ChevronDown size={18} className="mr-1" /> : <ChevronUp size={18} className="mr-1" />}
                            予定
                        </h4>
                    </div>

                    {isEventsOpen && (
                        <div className="mt-2">
                            {/* 大きく目立つ予定追加ボタン */}
                            <div className="mb-3">
                                <button
                                    onClick={openAddEventModal}
                                    className="flex items-center justify-center w-full gap-2 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                                >
                                    <PlusCircle size={18} />
                                    <span className="font-medium">予定を追加</span>
                                </button>
                            </div>

                            {dayEvents.length === 0 ? (
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
                                    予定はありません
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {dayEvents.map(event => (
                                        <li key={event.id} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800">{event.title}</h5>
                                                    {event.time && (
                                                        <p className="text-xs text-orange-600 flex items-center mt-1">
                                                            <Clock size={12} className="mr-1" />
                                                            {event.time}
                                                        </p>
                                                    )}
                                                    {event.description && (
                                                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => openDeleteConfirmModal(event.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* 記録一覧（トグル可能） */}
                <div>
                    <div
                        className="flex items-center justify-between py-2 cursor-pointer border-b border-gray-200"
                        onClick={() => setIsRecordsOpen(!isRecordsOpen)}
                    >
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            {isRecordsOpen ? <ChevronDown size={18} className="mr-1" /> : <ChevronUp size={18} className="mr-1" />}
                            記録一覧
                        </h4>
                    </div>

                    {isRecordsOpen && (
                        <div className="mt-2">
                            {dayRecords.length === 0 ? (
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
                                    記録はありません
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {dayRecords.map(record => {
                                        let bgColor = 'bg-gray-50';
                                        let borderColor = 'border-gray-300';
                                        let textColor = 'text-gray-600';

                                        switch (record.category) {
                                            case 'achievement':
                                                bgColor = 'bg-emerald-50';
                                                borderColor = 'border-emerald-400';
                                                textColor = 'text-emerald-600';
                                                break;
                                            case 'happy':
                                                bgColor = 'bg-sky-50';
                                                borderColor = 'border-sky-400';
                                                textColor = 'text-sky-600';
                                                break;
                                            case 'failure':
                                                bgColor = 'bg-amber-50';
                                                borderColor = 'border-amber-400';
                                                textColor = 'text-amber-600';
                                                break;
                                            case 'trouble':
                                                bgColor = 'bg-rose-50';
                                                borderColor = 'border-rose-400';
                                                textColor = 'text-rose-600';
                                                break;
                                        }

                                        return (
                                            <li key={record.id} className={`p-3 ${bgColor} rounded-lg border-l-4 ${borderColor}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-xs font-medium ${textColor}`}>
                                                        {format(new Date(record.timestamp), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{record.note}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-slideUp">
            {/* カレンダー本体 */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronDown size={18} className="rotate-90" />
                    </button>
                    <h3 className="text-base font-medium text-gray-800">
                        {format(selectedDate, 'yyyy年MM月', { locale: ja })}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronUp size={18} className="rotate-90" />
                    </button>
                </div>

                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                        <div
                            key={day}
                            className={`text-xs font-medium py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* カレンダー日付部分 */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                        if (!day) return <div key={i} className="aspect-square" />;

                        const isSelectedDay = isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        const dayRecords = getRecordsForDate(day);
                        const dayEvents = getCalendarEventsForDate(day);
                        const hasRecords = dayRecords.length > 0;
                        const hasEvents = dayEvents.length > 0;

                        // カテゴリー別のレコード有無
                        const hasAchievement = dayRecords.some(r => r.category === 'achievement');
                        const hasHappy = dayRecords.some(r => r.category === 'happy');
                        const hasFailure = dayRecords.some(r => r.category === 'failure');
                        const hasTrouble = dayRecords.some(r => r.category === 'trouble');

                        return (
                            <button
                                key={i}
                                onClick={() => handleDateSelect(day)}
                                className={`aspect-square flex flex-col items-center justify-start p-1 relative rounded-md border text-xs
                                    ${isSelectedDay ? 'border-orange-400 bg-orange-50' : 'border-transparent hover:bg-gray-50'}
                                    ${isCurrentDay ? 'font-bold' : ''}
                                `}
                            >
                                <span className={`${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>
                                    {format(day, 'd')}
                                </span>

                                {/* 記録のインジケーター */}
                                {hasRecords && (
                                    <div className="flex gap-0.5 mt-1 justify-center">
                                        {hasAchievement && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
                                        {hasHappy && <div className="w-1 h-1 bg-sky-400 rounded-full" />}
                                        {hasFailure && <div className="w-1 h-1 bg-amber-400 rounded-full" />}
                                        {hasTrouble && <div className="w-1 h-1 bg-rose-400 rounded-full" />}
                                    </div>
                                )}

                                {/* 予定のインジケーター */}
                                {hasEvents && (
                                    <div className="absolute top-0 right-0">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 選択した日の詳細 */}
            {renderDayDetails()}

            {/* 予定追加モーダル */}
            <Dialog open={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <CalendarIcon size={18} className="mr-2 text-orange-500" />
                            予定の追加
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-4">
                            {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="event-title" className="block text-xs font-medium text-gray-700 mb-1">
                                    タイトル <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="event-title"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="予定のタイトル"
                                />
                            </div>

                            <div>
                                <label htmlFor="event-time" className="block text-xs font-medium text-gray-700 mb-1">
                                    時間
                                </label>
                                <input
                                    type="time"
                                    id="event-time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="event-description" className="block text-xs font-medium text-gray-700 mb-1">
                                    詳細（任意）
                                </label>
                                <textarea
                                    id="event-description"
                                    value={newEventDescription}
                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="予定の詳細"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                onClick={() => setIsAddEventModalOpen(false)}
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md disabled:opacity-50"
                                onClick={handleAddEvent}
                                disabled={!newEventTitle.trim()}
                            >
                                追加
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* 予定削除確認モーダル */}
            <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-xs rounded-lg bg-white p-6 shadow-xl">
                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                            予定の削除
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-4">
                            この予定を削除してもよろしいですか？
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
                                onClick={handleDeleteEvent}
                            >
                                削除
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default CalendarView; 