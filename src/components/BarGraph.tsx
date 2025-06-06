import React, { useMemo, useState } from 'react';
import { BarChart, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useStress } from '../context/StressContext';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import StressAnalysis from './StressAnalysis';

interface BarGraphProps {
    mode: 'stress' | 'good';
}

const BarGraph: React.FC<BarGraphProps> = ({ mode }) => {
    const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'calendar'>('daily');
    const {
        stressEvents,
        goodThingEvents,
        selectedDate,
        todayEvents,
        todayGoodThings,
        setSelectedDate,
        today,
        lastSelectedDate
    } = useStress();
    const [showLevelInfo, setShowLevelInfo] = useState(false);
    const [showTotal, setShowTotal] = useState(false); // 個別表示をデフォルトに変更

    // 日別のデータを取得
    const dailyStats = useMemo(() => {
        const events = mode === 'stress' ? todayEvents : todayGoodThings;
        if (mode === 'stress') {
            const high = events.filter(e => e.level === 'high').length;
            const medium = events.filter(e => e.level === 'medium').length;
            const low = events.filter(e => e.level === 'low').length;
            const total = high + medium + low;

            return {
                high,
                medium,
                low,
                total,
                highPercent: total > 0 ? Math.round((high / total) * 100) : 0,
                mediumPercent: total > 0 ? Math.round((medium / total) * 100) : 0,
                lowPercent: total > 0 ? Math.round((low / total) * 100) : 0
            };
        } else {
            const big = events.filter(e => e.level === 'big').length;
            const medium = events.filter(e => e.level === 'medium').length;
            const small = events.filter(e => e.level === 'small').length;
            const total = big + medium + small;

            return {
                big,
                medium,
                small,
                total,
                bigPercent: total > 0 ? Math.round((big / total) * 100) : 0,
                mediumPercent: total > 0 ? Math.round((medium / total) * 100) : 0,
                smallPercent: total > 0 ? Math.round((small / total) * 100) : 0
            };
        }
    }, [todayEvents, todayGoodThings, mode]);

    // 週間データ（仮のデータ - 実装時は実際のデータを使用）
    const weeklyData = useMemo(() => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days.map(day => {
            if (mode === 'stress') {
                const high = Math.floor(Math.random() * 3);
                const medium = Math.floor(Math.random() * 4);
                const low = Math.floor(Math.random() * 5);
                const total = high + medium + low;

                return {
                    day,
                    high,
                    medium,
                    low,
                    total
                };
            } else {
                const big = Math.floor(Math.random() * 3);
                const medium = Math.floor(Math.random() * 4);
                const small = Math.floor(Math.random() * 5);
                const total = big + medium + small;

                return {
                    day,
                    big,
                    medium,
                    small,
                    total
                };
            }
        });
    }, [mode]);

    // グラフの最大値を計算
    const maxCount = useMemo(() => {
        if (selectedView === 'daily') {
            if (showTotal) {
                return Math.max(dailyStats.total, 1);
            } else {
                return Math.max(...Object.values({ ...dailyStats, total: 0, highPercent: 0, mediumPercent: 0, lowPercent: 0, bigPercent: 0, smallPercent: 0, mediumPercent: 0, smallPercent: 0 }), 1);
            }
        } else if (selectedView === 'weekly') {
            if (showTotal) {
                return Math.max(...weeklyData.map(d => d.total), 1);
            } else {
                if (mode === 'stress') {
                    return Math.max(
                        ...weeklyData.map(d => Math.max(d.high, d.medium, d.low)),
                        1
                    );
                } else {
                    return Math.max(
                        ...weeklyData.map(d => Math.max(d.big, d.medium, d.small)),
                        1
                    );
                }
            }
        }
        return 1;
    }, [dailyStats, weeklyData, selectedView, mode, showTotal]);

    // カレンダービュー用のデータ
    const calendarDays = useMemo(() => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const monthDays = eachDayOfInterval({ start, end });
        const firstDayOfMonth = getDay(start);
        const prevMonthDays = Array(firstDayOfMonth).fill(null);

        return [...prevMonthDays, ...monthDays].map(date => {
            if (!date) return { date: null, events: [] };

            const dayEvents = mode === 'stress'
                ? stressEvents.filter(event => isSameDay(new Date(event.timestamp), date))
                : goodThingEvents.filter(event => isSameDay(new Date(event.timestamp), date));

            return {
                date,
                events: dayEvents,
                hasHigh: dayEvents.some(e => e.level === (mode === 'stress' ? 'high' : 'big')),
                hasMedium: dayEvents.some(e => e.level === 'medium'),
                hasLow: dayEvents.some(e => e.level === (mode === 'stress' ? 'low' : 'small')),
                total: dayEvents.length
            };
        });
    }, [stressEvents, goodThingEvents, selectedDate, mode]);

    const handlePrevMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(addMonths(selectedDate, 1));
    };

    // 日次の棒グラフレンダリング
    const renderDailyBarGraph = () => {
        return (
            <div className="h-48 relative bg-gray-50 rounded-lg p-2">
                {showLevelInfo && (
                    <div className="absolute right-0 top-0 transform -translate-y-full bg-white p-2 rounded-lg shadow-lg z-10 text-2xs text-gray-600 w-56 mb-1">
                        {mode === 'stress' ? (
                            <>
                                <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-red-400 rounded-sm mr-1"></span> <b>強い:</b> 非常に強い不安や心配</p>
                                <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-yellow-400 rounded-sm mr-1"></span> <b>普通:</b> 中程度の不安や心配</p>
                                <p><span className="inline-block w-2 h-2 bg-green-400 rounded-sm mr-1"></span> <b>軽い:</b> 軽い不安や心配</p>
                            </>
                        ) : (
                            <>
                                <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-emerald-400 rounded-sm mr-1"></span> <b>大きな:</b> 非常に良かったこと</p>
                                <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-blue-400 rounded-sm mr-1"></span> <b>普通の:</b> 普通に良かったこと</p>
                                <p><span className="inline-block w-2 h-2 bg-sky-400 rounded-sm mr-1"></span> <b>小さな:</b> ちょっと良かったこと</p>
                            </>
                        )}
                    </div>
                )}

                <div className="absolute left-2 h-[calc(100%-20px)] top-2 w-0.5 bg-gray-200"></div>
                <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-gray-200"></div>

                <div className="absolute inset-y-2 left-4 w-4 flex flex-col justify-between text-2xs text-gray-500">
                    <span>{maxCount}</span>
                    <span>{Math.floor(maxCount / 2)}</span>
                    <span>0</span>
                </div>

                <div className="absolute inset-2 left-10 flex items-end justify-center gap-6">
                    {showTotal && (
                        <div className="flex flex-col items-center">
                            <div className="relative w-10 h-[calc(100%-16px)] flex flex-col justify-end">
                                <div
                                    className="w-full bg-purple-400 rounded-t-md transition-all duration-500 ease-out"
                                    style={{ height: dailyStats.total > 0 ? `${Math.max((dailyStats.total / maxCount) * 100, 5)}%` : '0%' }}
                                >
                                    {dailyStats.total > 0 && (
                                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-600">
                                            {dailyStats.total}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="mt-1 text-2xs font-medium text-gray-500">合計</span>
                        </div>
                    )}

                    {mode === 'stress' ? (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-red-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.high > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.high / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.high / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.high > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.high}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.highPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">強い</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-yellow-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.medium > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.medium / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.medium / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.medium > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.medium}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.mediumPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">普通</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-green-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.low > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.low / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.low / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.low > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.low}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.lowPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">軽い</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-emerald-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.big > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.big / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.big / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.big > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.big}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.bigPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">大きな</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-blue-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.medium > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.medium / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.medium / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.medium > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.medium}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.mediumPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">普通の</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-sky-400 rounded-t-md transition-all duration-500 ease-out"
                                        style={{
                                            height: dailyStats.small > 0
                                                ? showTotal
                                                    ? `${Math.max((dailyStats.small / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                                    : `${Math.max((dailyStats.small / maxCount) * 100, 5)}%`
                                                : '0%'
                                        }}
                                    >
                                        {dailyStats.small > 0 && !showTotal && (
                                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {dailyStats.small}
                                                </span>
                                                <span className="text-2xs font-medium text-gray-500">
                                                    {dailyStats.smallPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-1 text-2xs font-medium text-gray-500">小さな</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // 週間の棒グラフレンダリング
    const renderWeeklyBarGraph = () => {
        return (
            <div className="h-52 relative bg-gray-50 rounded-lg p-2">
                <div className="absolute left-2 h-[calc(100%-20px)] top-2 w-0.5 bg-gray-200"></div>
                <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-gray-200"></div>

                <div className="absolute inset-y-2 left-4 w-4 flex flex-col justify-between text-2xs text-gray-500">
                    <span>{maxCount}</span>
                    <span>{Math.floor(maxCount / 2)}</span>
                    <span>0</span>
                </div>

                <div className="absolute inset-2 left-10 right-2 flex items-end justify-between">
                    {weeklyData.map((data, index) => (
                        <div key={index} className="flex flex-col items-center">
                            {showTotal ? (
                                <div className="relative w-8 h-[calc(100%-16px)] flex flex-col justify-end">
                                    <div
                                        className="w-full bg-purple-400 rounded-t-md"
                                        style={{ height: data.total > 0 ? `${Math.max((data.total / maxCount) * 100, 5)}%` : '0%' }}
                                    >
                                        {data.total > 0 && (
                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xs font-semibold text-gray-600">
                                                {data.total}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                mode === 'stress' ? (
                                    <div className="relative w-6 h-[calc(100%-16px)] flex flex-col justify-end">
                                        {data.high > 0 && (
                                            <div
                                                className="w-full bg-red-400 rounded-t-md"
                                                style={{ height: `${Math.max((data.high / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {data.medium > 0 && (
                                            <div
                                                className="w-full bg-yellow-400"
                                                style={{ height: `${Math.max((data.medium / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {data.low > 0 && (
                                            <div
                                                className="w-full bg-green-400 rounded-b-md"
                                                style={{ height: `${Math.max((data.low / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {(data.high > 0 || data.medium > 0 || data.low > 0) && (
                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xs font-semibold text-gray-600">
                                                {data.high + data.medium + data.low}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative w-6 h-[calc(100%-16px)] flex flex-col justify-end">
                                        {data.big > 0 && (
                                            <div
                                                className="w-full bg-emerald-400 rounded-t-md"
                                                style={{ height: `${Math.max((data.big / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {data.medium > 0 && (
                                            <div
                                                className="w-full bg-blue-400"
                                                style={{ height: `${Math.max((data.medium / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {data.small > 0 && (
                                            <div
                                                className="w-full bg-sky-400 rounded-b-md"
                                                style={{ height: `${Math.max((data.small / maxCount) * 100, 5)}%` }}
                                            />
                                        )}
                                        {(data.big > 0 || data.medium > 0 || data.small > 0) && (
                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xs font-semibold text-gray-600">
                                                {data.big + data.medium + data.small}
                                            </span>
                                        )}
                                    </div>
                                )
                            )}
                            <span className="mt-1 text-2xs font-medium text-gray-500">{data.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // カレンダーレンダリング
    const renderCalendar = () => {
        return (
            <div>
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                        aria-label="前月"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-xs font-medium text-gray-900">
                        {format(selectedDate, 'yyyy年M月', { locale: ja })}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                        aria-label="翌月"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg p-0.5">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <div
                            key={day}
                            className={`text-center text-2xs font-medium p-0.5 ${index === 0 ? 'text-red-400' : index === 6 ? 'text-orange-400' : 'text-gray-600'}`}
                        >
                            {day}
                        </div>
                    ))}
                    {calendarDays.map((day, i) => {
                        // 選択状態の判定
                        const isSelected = day.date && isSameDay(day.date, selectedDate);
                        const isToday = day.date && isSameDay(day.date, today);
                        const wasSelectedBefore = day.date && lastSelectedDate && isSameDay(day.date, lastSelectedDate);

                        // クラス名の決定
                        let className = 'aspect-square p-0.5 transition-all ';
                        if (!day.date) {
                            className += 'bg-gray-50';
                        } else if (isSelected) {
                            className += 'bg-orange-100 rounded-md shadow-sm'; // 選択された日付
                        } else if (isToday) {
                            className += 'bg-orange-50 rounded-md border border-orange-200'; // 今日の日付
                        } else if (wasSelectedBefore) {
                            className += 'bg-orange-50 rounded-md border border-orange-100'; // 以前に選択された日付
                        } else {
                            className += 'bg-white hover:bg-gray-50 rounded-md';
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => day.date && setSelectedDate(day.date)}
                                disabled={!day.date}
                                className={className}
                            >
                                {day.date && (
                                    <div className="h-full flex flex-col items-center">
                                        <span className={`text-2xs font-medium ${isToday
                                                ? 'text-orange-600 font-bold' // 今日の日付のテキスト色
                                                : wasSelectedBefore
                                                    ? 'text-orange-600' // 以前に選択された日付
                                                    : getDay(day.date) === 0
                                                        ? 'text-red-500'
                                                        : getDay(day.date) === 6
                                                            ? 'text-orange-500'
                                                            : 'text-gray-700'
                                            }`}>
                                            {format(day.date, 'd')}
                                        </span>
                                        {day.events.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-full">
                                                {day.total > 0 && <div className="text-2xs font-semibold text-purple-500">{day.total}</div>}
                                                {mode === 'stress' ? (
                                                    <>
                                                        {day.hasHigh && <div className="w-1 h-1 bg-red-400 rounded-full" />}
                                                        {day.hasMedium && <div className="w-1 h-1 bg-yellow-400 rounded-full" />}
                                                        {day.hasLow && <div className="w-1 h-1 bg-green-400 rounded-full" />}
                                                    </>
                                                ) : (
                                                    <>
                                                        {day.hasHigh && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
                                                        {day.hasMedium && <div className="w-1 h-1 bg-blue-400 rounded-full" />}
                                                        {day.hasLow && <div className="w-1 h-1 bg-sky-400 rounded-full" />}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <BarChart size={14} className="text-orange-500" />
                    <span className="whitespace-nowrap">
                        {mode === 'stress' ? '不安に思ったこと分析' : '良かったこと分析'}
                    </span>
                </h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setSelectedView('daily')}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedView === 'daily'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-orange-500 hover:bg-orange-50'
                            }`}
                    >
                        今日
                    </button>
                    <button
                        onClick={() => setSelectedView('weekly')}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedView === 'weekly'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-orange-500 hover:bg-orange-50'
                            }`}
                    >
                        週間
                    </button>
                    <button
                        onClick={() => setSelectedView('calendar')}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedView === 'calendar'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-orange-500 hover:bg-orange-50'
                            }`}
                    >
                        カレンダー
                    </button>
                </div>
            </div>

            {selectedView === 'daily' && (
                <>
                    <StressAnalysis mode={mode} />

                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-medium text-gray-700">今日の記録数</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowLevelInfo(!showLevelInfo)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="レベルの説明"
                                >
                                    <Info size={14} />
                                </button>
                            </div>
                        </div>

                        {renderDailyBarGraph()}
                    </div>
                </>
            )}

            {selectedView === 'weekly' && (
                <>
                    <div className="mt-1">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-medium text-gray-700">週間記録</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowLevelInfo(!showLevelInfo)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="レベルの説明"
                                >
                                    <Info size={14} />
                                </button>
                            </div>
                        </div>

                        {renderWeeklyBarGraph()}

                        <div className="mt-2 flex justify-center gap-4 text-2xs text-gray-500">
                            {showTotal ? (
                                <div className="flex items-center"><span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-1"></span>合計</div>
                            ) : (
                                mode === 'stress' ? (
                                    <>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1"></span>強い</div>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>普通</div>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>軽い</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>大きな</div>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1"></span>普通の</div>
                                        <div className="flex items-center"><span className="inline-block w-2 h-2 bg-sky-400 rounded-full mr-1"></span>小さな</div>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </>
            )}

            {selectedView === 'calendar' && renderCalendar()}
        </div>
    );
};

export default BarGraph; 