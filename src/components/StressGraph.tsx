import React, { useMemo, useState } from 'react';
import { BarChart, Calendar as CalendarIcon } from 'lucide-react';
import { useStress } from '../context/StressContext';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import StressAnalysis from './StressAnalysis';

interface StressGraphProps {
  mode: 'stress' | 'good';
}

const StressGraph: React.FC<StressGraphProps> = ({ mode }) => {
  const [selectedView, setSelectedView] = useState<'daily' | 'calendar'>('daily');
  const { stressEvents, goodThingEvents, selectedDate, todayEvents, todayGoodThings } = useStress();

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

  const renderBar = (value: number, color: string) => {
    const height = `${(value / maxCount) * 100}%`;
    return (
      <div className={`w-full ${color}`} style={{ height }} />
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

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
          <BarChart size={18} />
          <span className="whitespace-nowrap">
            {mode === 'stress' ? '不安に思ったこと分析' : '良かったこと分析'}
          </span>
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedView('daily')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedView === 'daily'
                ? 'bg-blue-500 text-white'
                : 'text-blue-500 hover:bg-blue-50'
              }`}
          >
            今日
          </button>
          <button
            onClick={() => setSelectedView('calendar')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedView === 'calendar'
                ? 'bg-blue-500 text-white'
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

          <div className="mt-4">
            <div className="flex justify-end gap-3 mb-2 text-xs">
              {mode === 'stress' ? (
                <>
                  <span className="text-gray-600">強:{stats.high}</span>
                  <span className="text-gray-600">普:{stats.medium}</span>
                  <span className="text-gray-600">軽:{stats.low}</span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">大:{stats.big}</span>
                  <span className="text-gray-600">普:{stats.medium}</span>
                  <span className="text-gray-600">小:{stats.small}</span>
                </>
              )}
            </div>

            <div className="h-28 relative bg-gray-50 rounded-lg p-2">
              <div className="absolute inset-y-2 left-0 w-4 flex flex-col justify-between text-xs text-gray-500">
                <span>{maxCount}</span>
                <span>{Math.floor(maxCount / 2)}</span>
                <span>0</span>
              </div>
              <div className="absolute inset-2 left-4 flex items-end justify-center gap-4">
                {mode === 'stress' ? (
                  <>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.high, 'bg-red-400')}
                    </div>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.medium, 'bg-yellow-400')}
                    </div>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.low, 'bg-green-400')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.big, 'bg-emerald-400')}
                    </div>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.medium, 'bg-blue-400')}
                    </div>
                    <div className="w-6 h-full flex flex-col justify-end">
                      {renderBar(stats.small, 'bg-sky-400')}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>
          <div className="text-center mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              {format(selectedDate, 'yyyy年M月', { locale: ja })}
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg p-0.5">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                {day}
              </div>
            ))}
            {days.map((day, i) => (
              <button
                key={i}
                disabled={!day.date}
                className={`aspect-square p-0.5 transition-all ${day.date && isSameDay(day.date, selectedDate)
                    ? 'bg-blue-100'
                    : day.date
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50'
                  }`}
              >
                {day.date && (
                  <div className="h-full flex flex-col items-center">
                    <span className="text-xs font-medium text-gray-900">
                      {format(day.date, 'd')}
                    </span>
                    {day.events.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {mode === 'stress' ? (
                          <>
                            {day.hasHigh && <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
                            {day.hasMedium && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
                            {day.hasLow && <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
                          </>
                        ) : (
                          <>
                            {day.hasHigh && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                            {day.hasMedium && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                            {day.hasLow && <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />}
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

      <div className="mt-3 flex justify-center gap-3 text-xs">
        {mode === 'stress' ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-sm" />
              <span>強</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-sm" />
              <span>普</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-sm" />
              <span>軽</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-sm" />
              <span>大</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-sm" />
              <span>普</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-sky-400 rounded-sm" />
              <span>小</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StressGraph;