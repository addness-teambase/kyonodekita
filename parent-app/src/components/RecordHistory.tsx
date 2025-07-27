import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Trash2, History, X, Award, Smile, AlertTriangle, HelpCircle, Edit3 } from 'lucide-react';
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
        updateRecordEvent,
        getCategoryName
    } = useRecord();

    const [isExpanded, setIsExpanded] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: string | null }>({
        isOpen: false,
        eventId: null
    });



    const [inlineEdit, setInlineEdit] = useState<{ eventId: string | null; category: RecordCategory; note: string }>({
        eventId: null,
        category: 'achievement',
        note: ''
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
                return <HelpCircle size={14} />;
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
        console.log('handleDelete called:', id);
        console.log('selectedDate:', selectedDate);
        console.log('isToday(selectedDate):', isToday(selectedDate));
        
        // 今日の記録のみ削除可能
        if (isToday(selectedDate)) {
            console.log('削除確認ダイアログを開きます');
            setDeleteConfirmation({ isOpen: true, eventId: id });
        } else {
            console.log('今日以外の記録は削除できません');
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmation.eventId && isToday(selectedDate)) {
            deleteRecordEvent(deleteConfirmation.eventId);
        }
        setDeleteConfirmation({ isOpen: false, eventId: null });
    };



    const startInlineEdit = (event: any) => {
        if (isToday(selectedDate)) {
            setInlineEdit({ eventId: event.id, category: event.category, note: event.note });
        }
    };

    const cancelInlineEdit = () => {
        setInlineEdit({ eventId: null, category: 'achievement', note: '' });
    };

    const saveInlineEdit = () => {
        if (inlineEdit.eventId && isToday(selectedDate)) {
            updateRecordEvent(inlineEdit.eventId, inlineEdit.category, inlineEdit.note);
        }
        setInlineEdit({ eventId: null, category: 'achievement', note: '' });
    };

    const handleCategoryChange = (category: RecordCategory) => {
        setInlineEdit(prev => ({ ...prev, category }));
    };

    const handleNoteChange = (note: string) => {
        setInlineEdit(prev => ({ ...prev, note }));
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

                    {selectedEvents.length > 0 && (
                        <div className="mb-3">
                            {isToday(selectedDate) ? (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-2xs text-blue-600 text-center">
                                        💡 記録をタップして編集・削除できます
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-2xs text-gray-600 text-center">
                                        📅 過去の記録は削除・編集できません
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

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
                                    const canDelete = isToday(selectedDate) && isToday(eventDate);
                                    const colors = getCategoryColor(event.category);
                                    const icon = getCategoryIcon(event.category);

                                    const isEditing = inlineEdit.eventId === event.id;
                                    
                                    // デバッグ用のログ出力
                                    console.log('Record:', event.id, 'canDelete:', canDelete, 'selectedDate:', selectedDate, 'eventDate:', eventDate);

                                    return (
                                        <li
                                            key={event.id}
                                            className={`flex flex-col p-2.5 rounded-xl transition-colors animate-slideInRight border-l-3 ${isEditing
                                                    ? 'bg-orange-50 border-orange-300'
                                                    : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-orange-300'
                                                }`}
                                        >
                                            {isEditing ? (
                                                // インライン編集モード
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 ${colors.bg} rounded-full`}></div>
                                                        <span className="text-xs font-medium text-gray-900">{formatTime(event.timestamp)}</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-1">
                                                        {(['achievement', 'happy', 'failure', 'trouble'] as RecordCategory[]).map((category) => {
                                                            const catColors = getCategoryColor(category);
                                                            const catIcon = getCategoryIcon(category);
                                                            return (
                                                                <button
                                                                    key={category}
                                                                    onClick={() => handleCategoryChange(category)}
                                                                    className={`p-1.5 rounded-lg border text-2xs font-medium transition-all ${inlineEdit.category === category
                                                                            ? `${catColors.bg} ${catColors.text} border-current`
                                                                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        {catIcon}
                                                                        {getCategoryName(category)}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <textarea
                                                        value={inlineEdit.note}
                                                        onChange={(e) => handleNoteChange(e.target.value)}
                                                        placeholder="詳細を記録してください..."
                                                        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs"
                                                        rows={2}
                                                    />

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={saveInlineEdit}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            保存
                                                        </button>
                                                        <button
                                                            onClick={cancelInlineEdit}
                                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                                        >
                                                            キャンセル
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(event.id)}
                                                            className="ml-auto text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                            aria-label="削除"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // 通常表示モード
                                                <div>
                                                    <div
                                                        className={`flex items-center justify-between ${canDelete ? 'cursor-pointer' : ''}`}
                                                        onClick={() => canDelete && startInlineEdit(event)}
                                                    >
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 ${colors.bg} rounded-full mr-2`}></div>
                                                            <span className="text-xs font-medium text-gray-900">{formatTime(event.timestamp)}</span>
                                                            <span className={`ml-2 text-2xs font-medium ${colors.text} flex items-center gap-1`}>
                                                                {icon}
                                                                {getCategoryName(event.category)}
                                                            </span>
                                                                                                        {canDelete && (
                                                <span className="ml-2 text-2xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <Edit3 size={10} />
                                                    編集可能
                                                </span>
                                            )}
                                                        </div>
                                                        {canDelete && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        console.log('削除ボタンクリック:', event.id);
                                                                        handleDelete(event.id);
                                                                    }}
                                                                    className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50 border border-red-200 hover:border-red-300"
                                                                    aria-label="削除"
                                                                    title="この記録を削除"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {event.note && (
                                                        <p
                                                            className={`mt-1 ml-4 text-xs text-gray-600 break-words ${canDelete ? 'cursor-pointer' : ''}`}
                                                            onClick={() => canDelete && startInlineEdit(event)}
                                                        >
                                                            {event.note}
                                                        </p>
                                                    )}
                                                </div>
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
                            今日の記録を削除
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-6">
                            この記録を削除してもよろしいですか？<br />
                            <span className="text-xs text-gray-500">※今日の記録のみ削除可能です</span>
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