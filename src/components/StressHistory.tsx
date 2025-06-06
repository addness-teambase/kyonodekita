import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Trash2, History, X } from 'lucide-react';
import { useStress } from '../context/StressContext';
import { formatTime } from '../utils/storageUtils';
import { format, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Dialog } from '@headlessui/react';

interface StressHistoryProps {
  mode: 'stress' | 'good';
}

const StressHistory: React.FC<StressHistoryProps> = ({ mode }) => {
  const {
    stressEvents,
    goodThingEvents,
    selectedDate,
    deleteStressEvent,
    deleteGoodThingEvent
  } = useStress();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: string | null }>({
    isOpen: false,
    eventId: null
  });

  const selectedEvents = (mode === 'stress' ? stressEvents : goodThingEvents)
    .filter(event => isSameDay(new Date(event.timestamp), selectedDate))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayEvents = isExpanded ? selectedEvents : selectedEvents.slice(0, 3);

  const stats = mode === 'stress'
    ? {
      high: selectedEvents.filter(e => e.level === 'high').length,
      medium: selectedEvents.filter(e => e.level === 'medium').length,
      low: selectedEvents.filter(e => e.level === 'low').length
    }
    : {
      big: selectedEvents.filter(e => e.level === 'big').length,
      medium: selectedEvents.filter(e => e.level === 'medium').length,
      small: selectedEvents.filter(e => e.level === 'small').length
    };

  const getLevelText = (level: string) => {
    if (mode === 'stress') {
      switch (level) {
        case 'high': return '強い';
        case 'medium': return '普通';
        case 'low': return '軽い';
        default: return '';
      }
    } else {
      switch (level) {
        case 'big': return '大きな';
        case 'medium': return '普通の';
        case 'small': return '小さな';
        default: return '';
      }
    }
  };

  const getLevelColor = (level: string) => {
    if (mode === 'stress') {
      switch (level) {
        case 'high': return 'bg-red-400';
        case 'medium': return 'bg-yellow-400';
        case 'low': return 'bg-green-400';
        default: return 'bg-gray-400';
      }
    } else {
      switch (level) {
        case 'big': return 'bg-emerald-400';
        case 'medium': return 'bg-orange-400';
        case 'small': return 'bg-sky-400';
        default: return 'bg-gray-400';
      }
    }
  };

  const getLevelTextColor = (level: string) => {
    if (mode === 'stress') {
      switch (level) {
        case 'high': return 'text-red-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-green-600';
        default: return 'text-gray-600';
      }
    } else {
      switch (level) {
        case 'big': return 'text-emerald-600';
        case 'medium': return 'text-orange-600';
        case 'small': return 'text-sky-600';
        default: return 'text-gray-600';
      }
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
      if (mode === 'stress') {
        deleteStressEvent(deleteConfirmation.eventId);
      } else {
        deleteGoodThingEvent(deleteConfirmation.eventId);
      }
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
          <span>{mode === 'stress' ? '不安に思ったこと履歴' : '良かったこと履歴'}</span>
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
          <div className="grid grid-cols-3 gap-1 mb-3">
            {mode === 'stress' ? (
              <>
                <div className="bg-red-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">強い</span>
                  <p className="text-base font-semibold text-red-600">{stats.high}</p>
                </div>
                <div className="bg-yellow-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">普通</span>
                  <p className="text-base font-semibold text-yellow-600">{stats.medium}</p>
                </div>
                <div className="bg-green-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">軽い</span>
                  <p className="text-base font-semibold text-green-600">{stats.low}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">大きな</span>
                  <p className="text-base font-semibold text-emerald-600">{stats.big}</p>
                </div>
                <div className="bg-orange-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">普通の</span>
                  <p className="text-base font-semibold text-orange-600">{stats.medium}</p>
                </div>
                <div className="bg-sky-50 p-1.5 rounded-lg text-center">
                  <span className="text-2xs text-gray-600">小さな</span>
                  <p className="text-base font-semibold text-sky-600">{stats.small}</p>
                </div>
              </>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <div className="text-gray-400 mb-1">
                <Clock size={24} className="mx-auto" />
              </div>
              <p className="text-xs text-gray-600">この日の{mode === 'stress' ? '不安に思ったこと' : '良かったこと'}はありません。</p>
              <p className="text-2xs text-gray-500 mt-0.5">記録ボタンから新しく記録してみましょう。</p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {displayEvents.map((event) => {
                  const eventDate = new Date(event.timestamp);
                  const canDelete = isToday(eventDate);
                  const levelColor = getLevelColor(event.level);
                  const levelTextColor = getLevelTextColor(event.level);

                  return (
                    <li
                      key={event.id}
                      className="flex flex-col p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-slideInRight border-l-3 border-transparent hover:border-orange-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 ${levelColor} rounded-full mr-2`}></div>
                          <span className="text-xs font-medium text-gray-900">{formatTime(event.timestamp)}</span>
                          <span className={`ml-2 text-2xs font-medium ${levelTextColor}`}>
                            {getLevelText(event.level)}
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
                      全{selectedEvents.length}件を表示
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
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                記録を削除
              </Dialog.Title>
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              この{mode === 'stress' ? '不安に思ったこと' : '良かったこと'}を削除してもよろしいですか？
              この操作は元に戻せません。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-colors shadow-sm"
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

export default StressHistory;