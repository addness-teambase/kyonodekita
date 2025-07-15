import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRecord } from '../context/RecordContext';

const MonthlyView: React.FC = () => {
    const {
        recordEvents,
        selectedDate,
        setSelectedDate,
        activeChildId
    } = useRecord();

    const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selectedDate));
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 月の日付を生成
    const monthDays = useMemo(() => {
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start: currentMonth, end });
    }, [currentMonth]);

    // 前月へ
    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    // 次月へ
    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    // 今月に戻る
    const handleThisMonth = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    // 特定の日付の記録を取得
    const getRecordsForDate = (date: Date) => {
        return recordEvents.filter(record =>
            isSameDay(new Date(record.timestamp), date) &&
            record.childId === activeChildId
        );
    };

    // 月間の統計を計算
    const monthlyStats = useMemo(() => {
        const allMonthRecords = monthDays.flatMap(day => getRecordsForDate(day));

        return {
            achievement: allMonthRecords.filter(r => r.category === 'achievement').length,
            happy: allMonthRecords.filter(r => r.category === 'happy').length,
            failure: allMonthRecords.filter(r => r.category === 'failure').length,
            trouble: allMonthRecords.filter(r => r.category === 'trouble').length
        };
    }, [monthDays, recordEvents, activeChildId]);

    // フィルタリングされた記録を取得
    const filteredRecords = useMemo(() => {
        const allMonthRecords = monthDays.flatMap(day => {
            const dayRecords = getRecordsForDate(day);
            return dayRecords.map(record => ({
                ...record,
                date: day
            }));
        });

        if (selectedCategory) {
            return allMonthRecords.filter(record => record.category === selectedCategory);
        }
        return [];
    }, [monthDays, recordEvents, activeChildId, selectedCategory]);

    // カテゴリー別の色設定
    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'achievement':
                return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'できた', icon: '🎯' };
            case 'happy':
                return { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', label: '嬉しい', icon: '😊' };
            case 'failure':
                return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: '気になる', icon: '🤔' };
            case 'trouble':
                return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: '困った', icon: '😰' };
            default:
                return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: 'その他', icon: '📝' };
        }
    };

    // カテゴリーフィルターをクリア
    const clearFilter = () => {
        setSelectedCategory(null);
    };

    return (
        <div className="flex flex-col space-y-4 pb-20">
            {/* 月間ヘッダー */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-purple-500" />
                        <h3 className="text-base font-medium text-gray-800">月間サマリー</h3>
                    </div>
                    <button
                        onClick={handleThisMonth}
                        className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-md hover:bg-purple-200 transition-colors"
                    >
                        今月
                    </button>
                </div>

                {/* 月間ナビゲーション */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                        {format(currentMonth, 'yyyy年MM月', { locale: ja })}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* カテゴリーボタン */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                        onClick={() => setSelectedCategory(selectedCategory === 'achievement' ? null : 'achievement')}
                        className={`h-16 p-2 rounded-lg text-center border-2 transition-colors ${
                            selectedCategory === 'achievement'
                                ? 'bg-emerald-100 border-emerald-300'
                                : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                        }`}
                    >
                        <div className="text-xs text-gray-600 mb-1">できた</div>
                        <div className="text-lg font-bold text-emerald-600">{monthlyStats.achievement}</div>
                    </button>
                    <button
                        onClick={() => setSelectedCategory(selectedCategory === 'happy' ? null : 'happy')}
                        className={`h-16 p-2 rounded-lg text-center border-2 transition-colors ${
                            selectedCategory === 'happy'
                                ? 'bg-sky-100 border-sky-300'
                                : 'bg-sky-50 border-sky-100 hover:bg-sky-100'
                        }`}
                    >
                        <div className="text-xs text-gray-600 mb-1">嬉しい</div>
                        <div className="text-lg font-bold text-sky-600">{monthlyStats.happy}</div>
                    </button>
                    <button
                        onClick={() => setSelectedCategory(selectedCategory === 'failure' ? null : 'failure')}
                        className={`h-16 p-2 rounded-lg text-center border-2 transition-colors ${
                            selectedCategory === 'failure'
                                ? 'bg-amber-100 border-amber-300'
                                : 'bg-amber-50 border-amber-100 hover:bg-amber-100'
                        }`}
                    >
                        <div className="text-xs text-gray-600 mb-1">気になる</div>
                        <div className="text-lg font-bold text-amber-600">{monthlyStats.failure}</div>
                    </button>
                    <button
                        onClick={() => setSelectedCategory(selectedCategory === 'trouble' ? null : 'trouble')}
                        className={`h-16 p-2 rounded-lg text-center border-2 transition-colors ${
                            selectedCategory === 'trouble'
                                ? 'bg-rose-100 border-rose-300'
                                : 'bg-rose-50 border-rose-100 hover:bg-rose-100'
                        }`}
                    >
                        <div className="text-xs text-gray-600 mb-1">困った</div>
                        <div className="text-lg font-bold text-rose-600">{monthlyStats.trouble}</div>
                    </button>
                </div>
            </div>

            {/* 記録一覧 */}
            {selectedCategory && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-gray-500" />
                            <h4 className="text-sm font-medium text-gray-700">
                                {getCategoryStyle(selectedCategory).label}の記録
                            </h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {filteredRecords.length}件
                            </span>
                        </div>
                        <button
                            onClick={clearFilter}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">{getCategoryStyle(selectedCategory).icon}</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-2">
                                {getCategoryStyle(selectedCategory).label}の記録がありません
                            </p>
                            <p className="text-xs text-gray-400">
                                他のカテゴリーを選択するか、記録を追加してください
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRecords.map((record) => {
                                const style = getCategoryStyle(record.category);
                                return (
                                    <div
                                        key={record.id}
                                        className={`p-3 rounded-lg border-l-4 ${style.bg} ${style.border} transition-all hover:shadow-sm`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                                <span className="text-xs">{style.icon}</span>
                                            </div>
                                            <span className={`text-xs font-semibold ${style.text} flex-shrink-0`}>
                                                {style.label}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                                <Calendar size={8} />
                                                {format(record.date, 'MM/dd', { locale: ja })}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                                <Clock size={8} />
                                                {format(new Date(record.timestamp), 'HH:mm')}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed pl-7">{record.note}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* カテゴリーが選択されていない場合の案内 */}
            {!selectedCategory && (
                <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">📅</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">カテゴリーを選択してください</p>
                    <p className="text-xs text-gray-400">
                        上記のボタンを押すと、そのカテゴリーの記録が表示されます
                    </p>
                </div>
            )}
        </div>
    );
};

export default MonthlyView; 