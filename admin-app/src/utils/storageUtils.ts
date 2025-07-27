import { ChildObservation } from '../types';
import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'child-observation-records';

const ai = new GoogleGenAI({
  apiKey: 'AIzaSyCklSsHsyaIBBBALgKBheLWcqNuaY6FO2A'
});

export const getObservations = (): ChildObservation[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error retrieving observations from local storage:', error);
    return [];
  }
};

export const saveObservations = (observations: ChildObservation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  } catch (error) {
    console.error('Error saving observations to local storage:', error);
  }
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'excellent': return 'とても良い';
    case 'good': return '良い';
    case 'normal': return '普通';
    case 'concerned': return '少し気になる';
    case 'worried': return '心配';
    default: return '不明';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'excellent': return 'bg-emerald-400';
    case 'good': return 'bg-blue-400';
    case 'normal': return 'bg-sky-400';
    case 'concerned': return 'bg-amber-400';
    case 'worried': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
};

export const generateDiarySummary = async (stressEvents: ChildObservation[], goodThingEvents: ChildObservation[]): Promise<string> => {
  if (stressEvents.length === 0 && goodThingEvents.length === 0) {
    return '今日の記録\n\n今日はまだ記録がありません。';
  }

  try {
    const prompt = `
以下の記録から、一日のサマリーを作成してください。

ストレス記録:
${stressEvents.map(e => `- ${formatTime(e.timestamp)}: ${e.level}
内容: ${e.content}`).join('\n')}

良かったこと:
${goodThingEvents.map(e => `- ${formatTime(e.timestamp)}: ${e.level}
内容: ${e.content}`).join('\n')}

要件:
1. タイトルは「今日の記録」で固定
2. 150-200字程度で簡潔に
3. 時系列で出来事を要約
4. ストレスと良かったことをバランスよく含める
5. 最後に短い前向きな一言を添える

出力形式:
今日の記録

（ここに記録の本文）`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      }
    });

    return response.text || defaultSummary(stressEvents, goodThingEvents);
  } catch (error) {
    console.error('Error generating diary summary:', error);
    return defaultSummary(stressEvents, goodThingEvents);
  }
};

export const getMotivationalMessage = async (events: ChildObservation[]): Promise<string> => {
  if (events.length === 0) return '';

  try {
    const prompt = `
以下のストレス記録から、励ましのメッセージを作成してください。

記録:
${events.map(e => `- ${e.level}: ${e.content}`).join('\n')}

要件:
1. 50-80字程度で簡潔に
2. 共感的で前向きな内容
3. 具体的なアドバイスは控えめに

出力形式:
（ここにメッセージ）`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      }
    });

    return response.text || defaultMotivationalMessage();
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return defaultMotivationalMessage();
  }
};

export const getPraiseMessage = async (events: ChildObservation[]): Promise<string> => {
  if (events.length === 0) return '';

  try {
    const prompt = `
以下の良かったことの記録から、褒めのメッセージを作成してください。

記録:
${events.map(e => `- ${e.level}: ${e.content}`).join('\n')}

要件:
1. 50-80字程度で簡潔に
2. 具体的な良かった点に触れる
3. 前向きで励みになる内容

出力形式:
（ここにメッセージ）`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      }
    });
    
    return response.text || defaultPraiseMessage();
  } catch (error) {
    console.error('Error generating praise message:', error);
    return defaultPraiseMessage();
  }
};

const defaultSummary = (stressEvents: ChildObservation[], goodThingEvents: ChildObservation[]): string => {
  let summary = '今日の記録\n\n';

  const allEvents = [...stressEvents, ...goodThingEvents]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(e => `${formatTime(e.timestamp)} - ${e.content}`);

  summary += allEvents.join('\n');
  summary += '\n\n今日も一日お疲れ様でした。明日も頑張りましょう。';

  return summary;
};

const defaultMotivationalMessage = (): string => {
  return 'お疲れ様です。大変な状況でも、一つずつ乗り越えていきましょう。';
};

const defaultPraiseMessage = (): string => {
  return '素晴らしい成果ですね。これからも良い瞬間を大切にしていきましょう。';
};