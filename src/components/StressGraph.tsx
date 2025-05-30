import React, { useMemo, useState } from 'react';
import { BarChart, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useStress } from '../context/StressContext';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import StressAnalysis from './StressAnalysis';

interface StressGraphProps {
  mode: 'stress' | 'good';
}

const StressGraph: React.FC<StressGraphProps> = ({ mode }) => {
  const [selectedView, setSelectedView] = useState<'daily' | 'calendar'>('daily');
  const { stressEvents, goodThingEvents, selectedDate, todayEvents, todayGoodThings, setSelectedDate } = useStress();
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const stats = useMemo(() => {
    const events = mode === 'stress' ? todayEvents : todayGoodThings;
    if (mode === 'stress') {
      return {
        high: events.filter(e => e.level === 'high').length,
        medium: events.filter(e => e.level === 'medium').length,
        low: events.filter(e => e.level === 'low').length
      };
    } else {
      return {
        big: events.filter(e => e.level === 'big').length,
        medium: events.filter(e => e.level === 'medium').length,
        small: events.filter(e => e.level === 'small').length
      };
    }
  }, [todayEvents, todayGoodThings, mode]);

  const maxCount = Math.max(...Object.values(stats), 1);

  const renderBar = (value: number, color: string, label: string) => {
    const height = `${(value / maxCount) * 100}%`;
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-7 h-full flex flex-col justify-end">
          <div className={`w-full ${color} rounded-t-md transition-all duration-500 ease-out`} style={{ height }}>
            {value > 0 && (
              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-600">
                {value}
              </span>
            )}
          </div>
        </div>
        <span className="mt-1 text-2xs font-medium text-gray-500">{label}</span>
      </div>
    );
  };

  const days = useMemo(() => {
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
        hasLow: dayEvents.some(e => e.level === (mode === 'stress' ? 'low' : 'small'))
      };
    });
  }, [stressEvents, goodThingEvents, selectedDate, mode]);

  const handlePrevMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-900 flex items-center gap-1">
          <BarChart size={14} className="text-blue-500" />
          <span className="whitespace-nowrap">
            {mode === 'stress' ? '不安に思ったこと分析' : '良かったこと分析'}
          </span>
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedView('daily')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedView === 'daily'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-blue-500 hover:bg-blue-50'
              }`}
          >
            今日
          </button>
          <button
            onClick={() => setSelectedView('calendar')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedView === 'calendar'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-blue-500 hover:bg-blue-50'
              }`}
          >
            カレンダー
          </button>
        </div>
      </div>

      {selectedView === 'daily' ? (
        <>
          <StressAnalysis mode={mode} />

          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-medium text-gray-700">今日の記録数</h3>
              <button
                onClick={() => setShowLevelInfo(!showLevelInfo)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="レベルの説明"
              >
                <Info size={14} />
              </button>
            </div>

            <div className="h-36 relative bg-gray-50 rounded-lg p-2">
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
                {mode === 'stress' ? (
                  <>
                    {renderBar(stats.high, 'bg-red-400', '強い')}
                    {renderBar(stats.medium, 'bg-yellow-400', '普通')}
                    {renderBar(stats.low, 'bg-green-400', '軽い')}
                  </>
                ) : (
                  <>
                    {renderBar(stats.big, 'bg-emerald-400', '大きな')}
                    {renderBar(stats.medium, 'bg-blue-400', '普通の')}
                    {renderBar(stats.small, 'bg-sky-400', '小さな')}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
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
                className={`text-center text-2xs font-medium p-0.5 ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-600'}`}
              >
                {day}
              </div>
            ))}
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => day.date && setSelectedDate(day.date)}
                disabled={!day.date}
                className={`aspect-square p-0.5 transition-all ${day.date && isSameDay(day.date, selectedDate)
                    ? 'bg-blue-100 rounded-md shadow-sm'
                    : day.date
                      ? 'bg-white hover:bg-gray-50 rounded-md'
                      : 'bg-gray-50'
                  }`}
              >
                {day.date && (
                  <div className="h-full flex flex-col items-center">
                    <span className={`text-2xs font-medium ${getDay(day.date) === 0 ? 'text-red-500' :
                        getDay(day.date) === 6 ? 'text-blue-500' :
                          'text-gray-700'
                      }`}>
                      {format(day.date, 'd')}
                    </span>
                    {day.events.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-full">
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
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-center gap-3 text-2xs">
        {mode === 'stress' ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-sm" />
              <span>強い</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-sm" />
              <span>普通</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-sm" />
              <span>軽い</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-sm" />
              <span>大きな</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-sm" />
              <span>普通の</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-sky-400 rounded-sm" />
              <span>小さな</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StressGraph;