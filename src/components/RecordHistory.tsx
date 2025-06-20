import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Trash2, History, X, Award, Smile, AlertTriangle } from 'lucide-react';
import { useRecord, RecordCategory } from '../context/RecordContext';
import { formatTime } from '../utils/storageUtils';
import { format, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Dialog } from '@headlessui/react';

const RecordHistory: React.FC = () => {
    const {
        recordEvents,
        selectedDate,
        deleteRecordEvent,
        getCategoryName
    } = useRecord();

    const [isExpanded, setIsExpanded] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: string | null }>({
        isOpen: false,
        eventId: null
    });

    const selectedEvents = recordEvents
        .filter(event => isSameDay(new Date(event.timestamp), selectedDate))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const displayEvents = isExpanded ? selectedEvents : selectedEvents.slice(0, 3);

    const stats = {
        achievement: selectedEvents.filter(e => e.category === 'achievement').length,
        happy: selectedEvents.filter(e => e.category === 'happy').length,
        failure: selectedEvents.filter(e => e.category === 'failure').length,
        trouble: selectedEvents.filter(e => e.category === 'trouble').length
    };

    const getCategoryIcon = (category: RecordCategory) => {
        switch (category) {
            case 'achievement':
                return <Award size={14} />;
            case 'happy':
                return <Smile size={14} />;
            case 'failure':
                return <X size={14} />;
            case 'trouble':
                return <AlertTriangle size={14} />;
            default:
                return null;
        }
    };

    const getCategoryColor = (category: RecordCategory) => {
        switch (category) {
            case 'achievement':
                return {
                    bg: 'bg-emerald-400',
                    text: 'text-emerald-600',
                    light: 'bg-emerald-50'
                };
            case 'happy':
                return {
                    bg: 'bg-sky-400',
                    text: 'text-sky-600',
                    light: 'bg-sky-50'
                };
            case 'failure':
                return {
                    bg: 'bg-amber-400',
                    text: 'text-amber-600',
                    light: 'bg-amber-50'
                };
            case 'trouble':
                return {
                    bg: 'bg-rose-400',
                    text: 'text-rose-600',
                    light: 'bg-rose-50'
                };
            default:
                return {
                    bg: 'bg-gray-400',
                    text: 'text-gray-600',
                    light: 'bg-gray-50'
                };
        }
    };

    const handleDelete = (id: string) => {
        // 今日の記録のみ削除可能
        if (isToday(selectedDate)) {
            setDeleteConfirmation({ isOpen: true, eventId: id });
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmation.eventId && isToday(selectedDate)) {
            deleteRecordEvent(deleteConfirmation.eventId);
        }
        setDeleteConfirmation({ isOpen: false, eventId: null });
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-md mt-3 animate-slideUp">
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                    <History size={14} className="text-orange-500" />
                    <span>記録履歴</span>
                    {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                    <span className="text-xs font-medium text-orange-600">
                        {format(selectedDate, 'M/d(E)', { locale: ja })}
                    </span>
                </div>
            </div>

            {showHistory && (
                <>
                    <div className="grid grid-cols-4 gap-1 mb-3">
                        <div className="bg-emerald-50 p-1.5 rounded-lg text-center">
                            <span className="text-2xs text-gray-600">できた</span>
                            <p className="text-base font-semibold text-emerald-600">{stats.achievement}</p>
                        </div>
                        <div className="bg-sky-50 p-1.5 rounded-lg text-center">
                            <span className="text-2xs text-gray-600">嬉しい</span>
                            <p className="text-base font-semibold text-sky-600">{stats.happy}</p>
                        </div>
                        <div className="bg-amber-50 p-1.5 rounded-lg text-center">
                            <span className="text-2xs text-gray-600">できない</span>
                            <p className="text-base font-semibold text-amber-600">{stats.failure}</p>
                        </div>
                        <div className="bg-rose-50 p-1.5 rounded-lg text-center">
                            <span className="text-2xs text-gray-600">困った</span>
                            <p className="text-base font-semibold text-rose-600">{stats.trouble}</p>
                        </div>
                    </div>

                    {selectedEvents.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                            <div className="text-gray-400 mb-1">
                                <Clock size={24} className="mx-auto" />
                            </div>
                            <p className="text-xs text-gray-600">この日の記録はありません。</p>
                            <p className="text-2xs text-gray-500 mt-0.5">記録ボタンから新しく記録してみましょう。</p>
                        </div>
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {displayEvents.map((event) => {
                                    const eventDate = new Date(event.timestamp);
                                    const canDelete = isToday(eventDate);
                                    const colors = getCategoryColor(event.category);
                                    const icon = getCategoryIcon(event.category);

                                    return (
                                        <li
                                            key={event.id}
                                            className="flex flex-col p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-slideInRight border-l-3 border-transparent hover:border-orange-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 ${colors.bg} rounded-full mr-2`}></div>
                                                    <span className="text-xs font-medium text-gray-900">{formatTime(event.timestamp)}</span>
                                                    <span className={`ml-2 text-2xs font-medium ${colors.text} flex items-center gap-1`}>
                                                        {icon}
                                                        {getCategoryName(event.category)}
                                                    </span>
                                                </div>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(event.id)}
                                                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                        aria-label="削除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {event.note && (
                                                <p className="mt-1 ml-4 text-xs text-gray-600 break-words">{event.note}</p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            {selectedEvents.length > 3 && (
                                <button
                                    className="mt-3 w-full py-1.5 flex items-center justify-center text-orange-600 hover:text-orange-800 transition-colors bg-orange-50 hover:bg-orange-100 rounded-lg text-xs"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp size={14} className="mr-1" />
                                            閉じる
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} className="mr-1" />
                                            もっと見る ({selectedEvents.length - 3}件)
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </>
            )}

            <Dialog
                open={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6">
                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                            記録を削除します
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-6">
                            この記録を本当に削除してもよろしいですか？この操作は元に戻せません。
                        </p>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium"
                                onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                            >
                                キャンセル
                            </button>
                            <button
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium"
                                onClick={confirmDelete}
                            >
                                削除する
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default RecordHistory; 