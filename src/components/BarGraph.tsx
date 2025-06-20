import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, InfoIcon } from 'lucide-react';
import { useRecord, RecordCategory } from '../context/RecordContext';
import { eachDayOfInterval, format, getDay, endOfMonth, startOfMonth, isSameDay, isToday, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

const BarGraph: React.FC = () => {
    const { recordEvents, selectedDate, setSelectedDate, getCategoryName } = useRecord();
    const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'calendar'>('daily');
    const [showOptions, setShowOptions] = useState(false);
    const [showTotal, setShowTotal] = useState(false);
    const [showLevelInfo, setShowLevelInfo] = useState(false);

    const dailyStats = useMemo(() => {
        const todayEvents = recordEvents.filter(event =>
            isSameDay(new Date(event.timestamp), selectedDate)
        );

        const total = todayEvents.length;
        const achievement = todayEvents.filter(e => e.category === 'achievement').length;
        const happy = todayEvents.filter(e => e.category === 'happy').length;
        const failure = todayEvents.filter(e => e.category === 'failure').length;
        const trouble = todayEvents.filter(e => e.category === 'trouble').length;

        const achievementPercent = total ? Math.round((achievement / total) * 100) : 0;
        const happyPercent = total ? Math.round((happy / total) * 100) : 0;
        const failurePercent = total ? Math.round((failure / total) * 100) : 0;
        const troublePercent = total ? Math.round((trouble / total) * 100) : 0;

        return {
            total,
            achievement,
            happy,
            failure,
            trouble,
            achievementPercent,
            happyPercent,
            failurePercent,
            troublePercent
        };
    }, [recordEvents, selectedDate]);

    const weeklyData = useMemo(() => {
        const days = ['月', '火', '水', '木', '金', '土', '日'];

        return days.map(day => {
            const records = recordEvents.filter(event => {
                const eventDate = new Date(event.timestamp);
                const dayIndex = (getDay(eventDate) + 6) % 7;
                return days[dayIndex] === day;
            });

            return {
                day,
                total: records.length,
                achievement: records.filter(e => e.category === 'achievement').length,
                happy: records.filter(e => e.category === 'happy').length,
                failure: records.filter(e => e.category === 'failure').length,
                trouble: records.filter(e => e.category === 'trouble').length
            };
        });
    }, [recordEvents]);

    const maxCount = useMemo(() => {
        if (selectedView === 'daily') {
            if (showTotal) {
                return Math.max(dailyStats.total, 1);
            } else {
                return Math.max(...Object.values({
                    ...dailyStats,
                    total: 0,
                    achievementPercent: 0,
                    happyPercent: 0,
                    failurePercent: 0,
                    troublePercent: 0
                }), 1);
            }
        } else if (selectedView === 'weekly') {
            if (showTotal) {
                return Math.max(...weeklyData.map(d => d.total), 1);
            } else {
                return Math.max(
                    ...weeklyData.map(d => Math.max(
                        d.achievement,
                        d.happy,
                        d.failure,
                        d.trouble
                    )),
                    1
                );
            }
        }
        return 1;
    }, [dailyStats, weeklyData, selectedView, showTotal]);

    const calendarDays = useMemo(() => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const monthDays = eachDayOfInterval({ start, end });
        const firstDayOfMonth = getDay(start);
        const prevMonthDays = Array(firstDayOfMonth).fill(null);

        return [...prevMonthDays, ...monthDays].map(date => {
            if (!date) return { date: null, events: [] };

            const dayEvents = recordEvents.filter(event =>
                isSameDay(new Date(event.timestamp), date)
            );

            return {
                date,
                events: dayEvents,
                hasAchievement: dayEvents.some(e => e.category === 'achievement'),
                hasHappy: dayEvents.some(e => e.category === 'happy'),
                hasFailure: dayEvents.some(e => e.category === 'failure'),
                hasTrouble: dayEvents.some(e => e.category === 'trouble'),
                total: dayEvents.length
            };
        });
    }, [recordEvents, selectedDate]);

    const handlePrevMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(addMonths(selectedDate, 1));
    };

    const renderDailyBarGraph = () => {
        return (
            <div className="h-48 relative bg-gray-50 rounded-lg p-2">
                {showLevelInfo && (
                    <div className="absolute right-0 top-0 transform -translate-y-full bg-white p-2 rounded-lg shadow-lg z-10 text-2xs text-gray-600 w-56 mb-1">
                        <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-emerald-400 rounded-sm mr-1"></span> <b>できたこと:</b> 新しい達成や成功体験</p>
                        <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-sky-400 rounded-sm mr-1"></span> <b>嬉しかったこと:</b> ポジティブな出来事</p>
                        <p className="mb-0.5"><span className="inline-block w-2 h-2 bg-amber-400 rounded-sm mr-1"></span> <b>できなかったこと:</b> 挑戦したが達成できなかった事</p>
                        <p><span className="inline-block w-2 h-2 bg-rose-400 rounded-sm mr-1"></span> <b>困ったこと:</b> 問題行動や対応に困った事例</p>
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

                    <div className="flex flex-col items-center">
                        <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                            <div
                                className="w-full bg-emerald-400 rounded-t-md transition-all duration-500 ease-out"
                                style={{
                                    height: dailyStats.achievement > 0
                                        ? showTotal
                                            ? `${Math.max((dailyStats.achievement / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                            : `${Math.max((dailyStats.achievement / maxCount) * 100, 5)}%`
                                        : '0%'
                                }}
                            >
                                {dailyStats.achievement > 0 && !showTotal && (
                                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {dailyStats.achievement}
                                        </span>
                                        <span className="text-2xs font-medium text-gray-500">
                                            {dailyStats.achievementPercent}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1 text-2xs font-medium text-gray-500">できた</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                            <div
                                className="w-full bg-sky-400 rounded-t-md transition-all duration-500 ease-out"
                                style={{
                                    height: dailyStats.happy > 0
                                        ? showTotal
                                            ? `${Math.max((dailyStats.happy / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                            : `${Math.max((dailyStats.happy / maxCount) * 100, 5)}%`
                                        : '0%'
                                }}
                            >
                                {dailyStats.happy > 0 && !showTotal && (
                                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {dailyStats.happy}
                                        </span>
                                        <span className="text-2xs font-medium text-gray-500">
                                            {dailyStats.happyPercent}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1 text-2xs font-medium text-gray-500">嬉しい</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                            <div
                                className="w-full bg-amber-400 rounded-t-md transition-all duration-500 ease-out"
                                style={{
                                    height: dailyStats.failure > 0
                                        ? showTotal
                                            ? `${Math.max((dailyStats.failure / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                            : `${Math.max((dailyStats.failure / maxCount) * 100, 5)}%`
                                        : '0%'
                                }}
                            >
                                {dailyStats.failure > 0 && !showTotal && (
                                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {dailyStats.failure}
                                        </span>
                                        <span className="text-2xs font-medium text-gray-500">
                                            {dailyStats.failurePercent}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1 text-2xs font-medium text-gray-500">できない</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative w-12 h-[calc(100%-16px)] flex flex-col justify-end">
                            <div
                                className="w-full bg-rose-400 rounded-t-md transition-all duration-500 ease-out"
                                style={{
                                    height: dailyStats.trouble > 0
                                        ? showTotal
                                            ? `${Math.max((dailyStats.trouble / dailyStats.total) * (dailyStats.total / maxCount) * 100, 5)}%`
                                            : `${Math.max((dailyStats.trouble / maxCount) * 100, 5)}%`
                                        : '0%'
                                }}
                            >
                                {dailyStats.trouble > 0 && !showTotal && (
                                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {dailyStats.trouble}
                                        </span>
                                        <span className="text-2xs font-medium text-gray-500">
                                            {dailyStats.troublePercent}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1 text-2xs font-medium text-gray-500">困った</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderWeeklyBarGraph = () => {
        return (
            <div className="h-48 relative bg-gray-50 rounded-lg p-2">
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
                            <div className="flex gap-0.5 h-[calc(100%-16px)]">
                                {showTotal ? (
                                    <div className="relative w-6 h-full flex flex-col justify-end">
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
                                    <>
                                        <div className="relative w-1.5 h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-emerald-400 rounded-t-md"
                                                style={{ height: data.achievement > 0 ? `${Math.max((data.achievement / maxCount) * 100, 5)}%` : '0%' }}
                                            >
                                                {data.achievement > 0 && (
                                                    <span className="absolute -top-6 -left-1 text-2xs font-semibold text-gray-600 whitespace-nowrap">
                                                        {data.achievement}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative w-1.5 h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-sky-400 rounded-t-md"
                                                style={{ height: data.happy > 0 ? `${Math.max((data.happy / maxCount) * 100, 5)}%` : '0%' }}
                                            />
                                        </div>
                                        <div className="relative w-1.5 h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-amber-400 rounded-t-md"
                                                style={{ height: data.failure > 0 ? `${Math.max((data.failure / maxCount) * 100, 5)}%` : '0%' }}
                                            />
                                        </div>
                                        <div className="relative w-1.5 h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-rose-400 rounded-t-md"
                                                style={{ height: data.trouble > 0 ? `${Math.max((data.trouble / maxCount) * 100, 5)}%` : '0%' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <span className="mt-1 text-2xs font-medium text-gray-500">{data.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronDown size={16} className="rotate-90" />
                    </button>
                    <h3 className="text-sm font-medium text-gray-800">
                        {format(selectedDate, 'yyyy年MM月', { locale: ja })}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronUp size={16} className="rotate-90" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {daysOfWeek.map((day, i) => (
                        <div
                            key={day}
                            className={`text-2xs font-medium py-0.5 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                        if (!day.date) return <div key={i} className="aspect-square" />;

                        const isSelected = isSameDay(day.date, selectedDate);
                        const isCurrentDay = isToday(day.date);
                        const hasEvents = day.events.length > 0;

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day.date!)}
                                className={`aspect-square flex flex-col items-center justify-center relative rounded-md border text-xs
                                    ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-transparent hover:bg-gray-50'}
                                    ${isCurrentDay ? 'font-bold' : ''}
                                `}
                            >
                                <span>{format(day.date, 'd')}</span>

                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {day.hasAchievement && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
                                        {day.hasHappy && <div className="w-1 h-1 bg-sky-400 rounded-full" />}
                                        {day.hasFailure && <div className="w-1 h-1 bg-amber-400 rounded-full" />}
                                        {day.hasTrouble && <div className="w-1 h-1 bg-rose-400 rounded-full" />}
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
        <div className="bg-white rounded-lg p-4 animate-slideUp">
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setSelectedView('daily')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedView === 'daily'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        日次
                    </button>
                    <button
                        onClick={() => setSelectedView('weekly')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedView === 'weekly'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        週間
                    </button>
                    <button
                        onClick={() => setSelectedView('calendar')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedView === 'calendar'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        カレンダー
                    </button>
                </div>

                {selectedView !== 'calendar' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <InfoIcon size={16} className="text-gray-500" />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg p-2 z-10 w-32 text-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-600">合計表示</label>
                                    <button
                                        onClick={() => setShowTotal(!showTotal)}
                                        className={`w-8 h-4 rounded-full relative ${showTotal ? 'bg-orange-400' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transform transition-transform ${showTotal ? 'translate-x-4.5' : 'translate-x-0.5'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-gray-600">凡例表示</label>
                                    <button
                                        onClick={() => setShowLevelInfo(!showLevelInfo)}
                                        className={`w-8 h-4 rounded-full relative ${showLevelInfo ? 'bg-orange-400' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transform transition-transform ${showLevelInfo ? 'translate-x-4.5' : 'translate-x-0.5'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedView === 'daily' && renderDailyBarGraph()}
            {selectedView === 'weekly' && renderWeeklyBarGraph()}
            {selectedView === 'calendar' && renderCalendar()}
        </div>
    );
};

export default BarGraph; 