import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Trash2, History } from 'lucide-react';
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

  const displayEvents = isExpanded ? selectedEvents : selectedEvents.slice(0, 5);

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
        case 'medium': return 'bg-blue-400';
        case 'small': return 'bg-sky-400';
        default: return 'bg-gray-400';
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
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-base font-medium text-gray-900 hover:text-gray-600 transition-colors"
        >
          <Clock size={18} />
          <span>{mode === 'stress' ? '不安に思ったこと履歴' : '良かったこと履歴'}</span>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {format(selectedDate, 'M月d日(E)', { locale: ja })}
          </span>
        </div>
      </div>

      {showHistory && (
        <>
          <div className="flex justify-end gap-3 mb-3 text-xs">
            {mode === 'stress' ? (
              <>
                <span className="text-gray-600">強: {stats.high}</span>
                <span className="text-gray-600">普: {stats.medium}</span>
                <span className="text-gray-600">軽: {stats.low}</span>
              </>
            ) : (
              <>
                <span className="text-gray-600">大: {stats.big}</span>
                <span className="text-gray-600">普: {stats.medium}</span>
                <span className="text-gray-600">小: {stats.small}</span>
              </>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <p>この日の{mode === 'stress' ? '不安に思ったこと' : '良かったこと'}はありません。</p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {displayEvents.map((event) => {
                  const eventDate = new Date(event.timestamp);
                  const canDelete = isToday(eventDate);

                  return (
                    <li
                      key={event.id}
                      className="flex flex-col p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 ${getLevelColor(event.level)} rounded-full mr-3`}></div>
                          <span className="text-gray-900">{formatTime(event.timestamp)}</span>
                          <span className="ml-4 text-sm text-gray-600">
                            {mode === 'stress' ? '不安レベル' : '良かったこと'}: {getLevelText(event.level)}
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                            aria-label="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      {event.note && (
                        <p className="mt-2 ml-5 text-sm text-gray-600">{event.note}</p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {selectedEvents.length > 5 && (
                <button
                  className="mt-4 w-full py-2 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
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
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
              記録を削除
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              この{mode === 'stress' ? '不安に思ったこと' : '良かったこと'}を削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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