import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCklSsHsyaIBBBALgKBheLWcqNuaY6FO2A');

interface StressEvent {
  id: string;
  timestamp: string;
  level: 'high' | 'medium' | 'low';
  note: string;
}

interface GoodThingEvent {
  id: string;
  timestamp: string;
  level: 'big' | 'medium' | 'small';
  note: string;
}

interface CachedContent {
  [key: string]: {
    diary?: string;
    message?: string;
    lastUpdate?: number;
  };
}

interface StressContextType {
  stressEvents: StressEvent[];
  goodThingEvents: GoodThingEvent[];
  todayEvents: StressEvent[];
  todayGoodThings: GoodThingEvent[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  recordMode: 'stress' | 'good';
  setRecordMode: (mode: 'stress' | 'good') => void;
  addStressEvent: (level: 'high' | 'medium' | 'low', note: string) => void;
  addGoodThingEvent: (level: 'big' | 'medium' | 'small', note: string) => void;
  deleteStressEvent: (id: string) => void;
  deleteGoodThingEvent: (id: string) => void;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  cachedContent: CachedContent;
  setCachedContent: React.Dispatch<React.SetStateAction<CachedContent>>;
  lastSelectedDate: Date | null;
  today: Date;
}

const StressContext = createContext<StressContextType | undefined>(undefined);

export const useStress = () => {
  const context = useContext(StressContext);
  if (!context) {
    throw new Error('useStress must be used within a StressProvider');
  }
  return context;
};

interface StressProviderProps {
  children: ReactNode;
}

export const StressProvider: React.FC<StressProviderProps> = ({ children }) => {
  const [stressEvents, setStressEvents] = useState<StressEvent[]>([]);
  const [goodThingEvents, setGoodThingEvents] = useState<GoodThingEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [recordMode, setRecordMode] = useState<'stress' | 'good'>('stress');
  const [isAnimating, setIsAnimating] = useState(false);
  const [cachedContent, setCachedContent] = useState<CachedContent>({});
  const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);

  const today = startOfToday();

  const todayEvents = stressEvents.filter(event =>
    isSameDay(new Date(event.timestamp), today)
  );

  const todayGoodThings = goodThingEvents.filter(event =>
    isSameDay(new Date(event.timestamp), today)
  );

  const updateSelectedDate = (date: Date) => {
    setSelectedDate(date);
    if (!isSameDay(date, today)) {
      setLastSelectedDate(date);
    } else {
      setLastSelectedDate(null);
    }
  };

  const addStressEvent = (level: 'high' | 'medium' | 'low', note: string) => {
    const newEvent: StressEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      note
    };
    setStressEvents(prev => [...prev, newEvent]);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  const addGoodThingEvent = (level: 'big' | 'medium' | 'small', note: string) => {
    const newEvent: GoodThingEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      note
    };
    setGoodThingEvents(prev => [...prev, newEvent]);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  const deleteStressEvent = (id: string) => {
    setStressEvents(prev => prev.filter(event => event.id !== id));
  };

  const deleteGoodThingEvent = (id: string) => {
    setGoodThingEvents(prev => prev.filter(event => event.id !== id));
  };

  return (
    <StressContext.Provider value={{
      stressEvents,
      goodThingEvents,
      todayEvents,
      todayGoodThings,
      selectedDate,
      setSelectedDate: updateSelectedDate,
      recordMode,
      setRecordMode,
      addStressEvent,
      addGoodThingEvent,
      deleteStressEvent,
      deleteGoodThingEvent,
      isAnimating,
      setIsAnimating,
      cachedContent,
      setCachedContent,
      lastSelectedDate,
      today
    }}>
      {children}
    </StressContext.Provider>
  );
};

export const getMotivationalMessage = async (events: StressEvent[]): Promise<string> => {
  if (events.length === 0) return '';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
以下の不安に思ったことの記録から、50文字程度の励ましのメッセージを作成してください。共感的で前向きな内容にしてください。

記録:
${events.map(e => `- ${e.level === 'high' ? '強い' : e.level === 'medium' ? '普通' : '軽い'}: ${e.note}`).join('\n')}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || '一歩一歩、着実に前に進んでいきましょう。あなたならできます！';
  } catch (error) {
    console.error('Error generating message:', error);
    return '一歩一歩、着実に前に進んでいきましょう。あなたならできます！';
  }
};

export const getPraiseMessage = async (events: GoodThingEvent[]): Promise<string> => {
  if (events.length === 0) return '';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
以下の良かったことの記録から、50文字程度の褒めのメッセージを作成してください。具体的な良かった点に触れ、前向きな内容にしてください。

記録:
${events.map(e => `- ${e.level === 'big' ? '大きな' : e.level === 'medium' ? '普通の' : '小さな'}: ${e.note}`).join('\n')}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || '素晴らしい成果ですね！これからも良い瞬間を大切にしていきましょう。';
  } catch (error) {
    console.error('Error generating message:', error);
    return '素晴らしい成果ですね！これからも良い瞬間を大切にしていきましょう。';
  }
};

export const generateDiarySummary = async (stressEvents: StressEvent[], goodThingEvents: GoodThingEvent[]): Promise<string> => {
  if (stressEvents.length === 0 && goodThingEvents.length === 0) {
    return 'きょうのできた\n\n今日はまだ記録がありません。';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
以下の記録から、一日のサマリーを作成してください。

不安に思ったこと:
${stressEvents.map(e => `- ${e.level === 'high' ? '強い' : e.level === 'medium' ? '普通' : '軽い'}: ${e.note}`).join('\n')}

良かったこと:
${goodThingEvents.map(e => `- ${e.level === 'big' ? '大きな' : e.level === 'medium' ? '普通の' : '小さな'}: ${e.note}`).join('\n')}

要件:
1. タイトルは「今日のできた」で固定
2. 150-200字程度で簡潔に
3. 時系列で出来事を要約
4. 不安に思ったことと良かったことをバランスよく含める
5. 最後に短い前向きな一言を添える
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || defaultSummary(stressEvents, goodThingEvents);
  } catch (error) {
    console.error('Error generating diary summary:', error);
    return defaultSummary(stressEvents, goodThingEvents);
  }
};

const defaultSummary = (stressEvents: StressEvent[], goodThingEvents: GoodThingEvent[]): string => {
  const allEvents = [...stressEvents, ...goodThingEvents]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let summary = 'きょうのできた\n\n';

  if (allEvents.length === 0) {
    return summary + 'まだ記録がありません。';
  }

  const formatEvent = (event: StressEvent | GoodThingEvent) => {
    const time = format(new Date(event.timestamp), 'HH:mm');
    if ('level' in event && (event.level === 'high' || event.level === 'medium' || event.level === 'low')) {
      const level = event.level === 'high' ? '強い' : event.level === 'medium' ? '普通の' : '軽い';
      return `${time} - ${level}不安: ${event.note}`;
    } else {
      const level = (event as GoodThingEvent).level === 'big' ? '大きな' :
        (event as GoodThingEvent).level === 'medium' ? '普通の' : '小さな';
      return `${time} - ${level}良いこと: ${event.note}`;
    }
  };

  summary += allEvents.map(formatEvent).join('\n');
  summary += '\n\n今日も一日お疲れ様でした。明日も頑張りましょう。';

  return summary;
};