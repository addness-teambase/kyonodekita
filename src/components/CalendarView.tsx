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
        getCalendarEventsForDate,
        deleteRecordEvent,
        activeChildId
    } = useRecord();

    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [isRecordDeleteConfirmOpen, setIsRecordDeleteConfirmOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

    // トグル用の状態
    const [isEventsOpen, setIsEventsOpen] = useState(true);
    const [isRecordsOpen, setIsRecordsOpen] = useState(true);

    // カテゴリー別一覧表示用の状態
    const [activeCategory, setActiveCategory] = useState<'achievement' | 'happy' | 'failure' | 'trouble' | null>(null);

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

        console.log('予定追加:', {
            title: newEventTitle,
            time: newEventTime,
            description: newEventDescription,
            date: selectedDate
        });

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

    // 記録削除確認モーダルを開く
    const openRecordDeleteConfirmModal = (recordId: string) => {
        setRecordToDelete(recordId);
        setIsRecordDeleteConfirmOpen(true);
    };

    // 記録削除を実行
    const handleDeleteRecord = () => {
        if (recordToDelete) {
            deleteRecordEvent(recordToDelete);
            setIsRecordDeleteConfirmOpen(false);
            setRecordToDelete(null);
        }
    };

    // 特定の日付の記録を取得
    const getRecordsForDate = (date: Date) => {
        return recordEvents.filter(record =>
            isSameDay(new Date(record.timestamp), date) &&
            record.childId === activeChildId
        );
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
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                    {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                </h3>

                {/* カテゴリー別の記録件数（ボタン化） */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                        onClick={() => setActiveCategory('achievement')}
                        className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                        <span className="text-2xs text-gray-600">できた</span>
                        <p className="text-base font-semibold text-emerald-600">{categoryCounts.achievement}</p>
                    </button>
                    <button
                        onClick={() => setActiveCategory('happy')}
                        className="bg-sky-50 p-2 rounded-lg text-center border border-sky-100 hover:bg-sky-100 transition-colors"
                    >
                        <span className="text-2xs text-gray-600">嬉しい</span>
                        <p className="text-base font-semibold text-sky-600">{categoryCounts.happy}</p>
                    </button>
                    <button
                        onClick={() => setActiveCategory('failure')}
                        className="bg-amber-50 p-2 rounded-lg text-center border border-amber-100 hover:bg-amber-100 transition-colors"
                    >
                        <span className="text-2xs text-gray-600">気になった</span>
                        <p className="text-base font-semibold text-amber-600">{categoryCounts.failure}</p>
                    </button>
                    <button
                        onClick={() => setActiveCategory('trouble')}
                        className="bg-rose-50 p-2 rounded-lg text-center border border-rose-100 hover:bg-rose-100 transition-colors"
                    >
                        <span className="text-2xs text-gray-600">困った</span>
                        <p className="text-base font-semibold text-rose-600">{categoryCounts.trouble}</p>
                    </button>
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
                                    className="flex items-center justify-center w-full gap-2 py-3 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all duration-200 border border-orange-200 hover:shadow-sm"
                                >
                                    <PlusCircle size={18} />
                                    <span className="font-medium">予定を追加</span>
                                </button>
                            </div>

                            {dayEvents.length === 0 ? (
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    予定はありません
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {dayEvents.map(event => {
                                        console.log('表示する予定:', event);
                                        return (
                                            <li key={event.id} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400 transition-all duration-200 hover:shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h5 className="text-sm font-medium text-gray-800 mb-1">{event.title}</h5>
                                                        {event.time && event.time.trim() !== '' && (
                                                            <p className="text-xs text-orange-600 flex items-center mb-1">
                                                                <Clock size={12} className="mr-1" />
                                                                {event.time}
                                                            </p>
                                                        )}
                                                        {event.description && event.description.trim() !== '' && (
                                                            <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => openDeleteConfirmModal(event.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 ml-2 flex-shrink-0"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
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
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    記録はありません
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {dayRecords.map(record => {
                                        let bgColor = 'bg-gray-50';
                                        let borderColor = 'border-gray-300';
                                        let textColor = 'text-gray-600';
                                        let categoryLabel = '';

                                        switch (record.category) {
                                            case 'achievement':
                                                bgColor = 'bg-emerald-50';
                                                borderColor = 'border-emerald-400';
                                                textColor = 'text-emerald-600';
                                                categoryLabel = 'できたこと';
                                                break;
                                            case 'happy':
                                                bgColor = 'bg-sky-50';
                                                borderColor = 'border-sky-400';
                                                textColor = 'text-sky-600';
                                                categoryLabel = 'うれしかったこと';
                                                break;
                                            case 'failure':
                                                bgColor = 'bg-amber-50';
                                                borderColor = 'border-amber-400';
                                                textColor = 'text-amber-600';
                                                categoryLabel = '気になったこと';
                                                break;
                                            case 'trouble':
                                                bgColor = 'bg-rose-50';
                                                borderColor = 'border-rose-400';
                                                textColor = 'text-rose-600';
                                                categoryLabel = 'こまったこと';
                                                break;
                                        }

                                        const canDelete = isToday(selectedDate) && isToday(new Date(record.timestamp));

                                        return (
                                            <li key={record.id} className={`p-3 ${bgColor} rounded-lg border-l-4 ${borderColor} transition-all duration-200 hover:shadow-sm`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium ${textColor} bg-white px-2 py-1 rounded-full shadow-sm`}>
                                                            {categoryLabel}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(record.timestamp), 'HH:mm')}
                                                        </span>
                                                        {canDelete && (
                                                            <span className="text-2xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                                                削除可能
                                                            </span>
                                                        )}
                                                    </div>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => openRecordDeleteConfirmModal(record.id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                            title="この記録を削除"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{record.note}</p>
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

    // カテゴリー別の記録一覧を表示
    const renderCategoryRecords = () => {
        if (!activeCategory) return null;

        const dayRecords = getRecordsForDate(selectedDate);
        const categoryRecords = dayRecords.filter(record => record.category === activeCategory);
        const categoryNames = {
            achievement: 'できたこと',
            happy: 'うれしかったこと',
            failure: '気になったこと',
            trouble: 'こまったこと'
        };

        const categoryColors = {
            achievement: {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-700'
            },
            happy: {
                bg: 'bg-sky-50',
                border: 'border-sky-200',
                text: 'text-sky-700'
            },
            failure: {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700'
            },
            trouble: {
                bg: 'bg-rose-50',
                border: 'border-rose-200',
                text: 'text-rose-700'
            }
        };

        const colors = categoryColors[activeCategory];

        return (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                        {categoryNames[activeCategory]} ({categoryRecords.length}件)
                    </h3>
                    {/* ×ボタンを削除 */}
                </div>

                {categoryRecords.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">📝</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            このカテゴリーの記録がありません
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categoryRecords.map(record => {
                            const canDelete = isToday(selectedDate) && isToday(new Date(record.timestamp));

                            return (
                                <div
                                    key={record.id}
                                    className={`p-4 rounded-xl ${colors.bg} border-l-4 ${colors.border}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${colors.text}`}>
                                                {categoryNames[activeCategory]}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock size={12} />
                                                {format(new Date(record.timestamp), 'HH:mm')}
                                            </div>
                                            {canDelete && (
                                                <span className="text-2xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                                    削除可能
                                                </span>
                                            )}
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={() => openRecordDeleteConfirmModal(record.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title="削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-10">{record.note}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-slideUp flex flex-col">
            {/* カレンダー本体 */}
            <div className="bg-white rounded-lg p-4 shadow-sm flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronDown size={18} className="rotate-90" />
                    </button>
                    <h3 className="text-base font-medium text-gray-800">
                        {format(selectedDate, 'yyyy年MM月', { locale: ja })}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
                                className={`aspect-square flex flex-col items-center justify-start p-1 relative rounded-md border text-xs transition-all duration-200
                                    ${isSelectedDay ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}
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

            {/* カテゴリー別一覧表示 */}
            {renderCategoryRecords()}

            {/* 選択した日の詳細 */}
            <div className="mt-4 pb-4">
                {renderDayDetails()}
            </div>

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
                                    placeholder="時間を選択（任意）"
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

            {/* 記録削除確認モーダル */}
            <Dialog open={isRecordDeleteConfirmOpen} onClose={() => setIsRecordDeleteConfirmOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-xs rounded-lg bg-white p-6 shadow-xl">
                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                            今日の記録を削除
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-4">
                            この記録を削除してもよろしいですか？<br />
                            <span className="text-xs text-gray-500">※今日の記録のみ削除可能です</span>
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                onClick={() => setIsRecordDeleteConfirmOpen(false)}
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
                                onClick={handleDeleteRecord}
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