import { ChildObservation } from '../types';

const STORAGE_KEY = 'child-observation-records';

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

// 個人の成長記録に基づいたサマリー生成
export const generatePersonalizedSummary = (stressEvents: ChildObservation[], goodThingEvents: ChildObservation[], childInfo?: any): string => {
  if (stressEvents.length === 0 && goodThingEvents.length === 0) {
    return `今日の記録

${childInfo?.name || 'お子さま'}の今日はまだ記録がありません。
何か気になることや良かったことがあったら、ぜひ記録してみてくださいね。`;
  }

  const childName = childInfo?.name || 'お子さま';
  const totalEvents = stressEvents.length + goodThingEvents.length;

  let summary = `今日の記録\n\n`;

  // 記録の概要
  if (goodThingEvents.length > stressEvents.length) {
    summary += `${childName}にとって良い一日でした！ `;
  } else if (stressEvents.length > goodThingEvents.length) {
    summary += `${childName}にとって少し大変な一日でしたが、成長の機会でもありました。 `;
  } else {
    summary += `${childName}にとってバランスの取れた一日でした。 `;
  }

  // 時系列での記録内容
  const allEvents = [
    ...stressEvents.map(e => ({ ...e, type: 'stress' })),
    ...goodThingEvents.map(e => ({ ...e, type: 'good' }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (allEvents.length > 0) {
    summary += `\n\n【記録内容】\n`;
    allEvents.forEach(event => {
      const time = formatTime(event.timestamp);
      const icon = event.type === 'good' ? '✨' : '💭';
      summary += `${icon} ${time}: ${event.content}\n`;
    });
  }

  // 成長のポイント
  if (goodThingEvents.length > 0) {
    summary += `\n🌟 今日の成長ポイント: ${goodThingEvents.length}個の素敵な瞬間を記録しました`;
  }

  if (stressEvents.length > 0) {
    summary += `\n💪 頑張ったこと: ${stressEvents.length}個の気になることと向き合いました`;
  }

  return summary;
};

// 成長記録に基づいた個人的なメッセージ生成
export const getPersonalizedMessage = (events: ChildObservation[], childInfo?: any): string => {
  if (events.length === 0) return '';

  const childName = childInfo?.name || 'お子さま';
  const eventCount = events.length;

  // レベル別の分析
  const levelCounts = events.reduce((acc, event) => {
    acc[event.level] = (acc[event.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 主要なレベルを特定
  const mainLevel = Object.entries(levelCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  // レベルに応じたメッセージ
  const messages = {
    happy: [
      `${childName}の笑顔がたくさん見られた素敵な日ですね！`,
      `${childName}が楽しそうにしている様子が伝わってきます♪`,
      `${childName}の嬉しそうな表情を想像すると、こちらも嬉しくなります！`
    ],
    good: [
      `${childName}の成長を感じられる出来事がありましたね！`,
      `${childName}らしい素敵な一面を見つけられましたね。`,
      `${childName}の頑張りが実を結んでいるのを感じます。`
    ],
    normal: [
      `${childName}の日常の様子をよく観察されていますね。`,
      `${childName}の小さな変化も大切な成長の記録です。`,
      `${childName}との穏やかな時間を過ごされましたね。`
    ],
    tired: [
      `${childName}も時には疲れることがありますね。そんな日もあります。`,
      `${childName}が疲れた時の様子を記録することも大切です。`,
      `${childName}のペースを大切にしてあげてください。`
    ],
    worried: [
      `${childName}のことを心配されているのが伝わります。親の愛情ですね。`,
      `${childName}の気になることを記録しておくことで、成長を見守れますね。`,
      `${childName}の変化を見逃さずに記録されている、素晴らしい観察力です。`
    ]
  };

  const messageList = messages[mainLevel as keyof typeof messages] || messages.normal;
  const message = messageList[Math.floor(Math.random() * messageList.length)];

  // 記録の頻度に応じた追加メッセージ
  let additionalMessage = '';
  if (eventCount >= 3) {
    additionalMessage = ' 今日もたくさんの記録をありがとうございます！';
  } else if (eventCount === 1) {
    additionalMessage = ' 一つ一つの記録が大切な思い出になりますね。';
  }

  return message + additionalMessage;
};

// 成長記録に基づいた褒めメッセージ生成
export const getPersonalizedPraiseMessage = (events: ChildObservation[], childInfo?: any): string => {
  if (events.length === 0) return '';

  const childName = childInfo?.name || 'お子さま';
  const eventCount = events.length;

  // レベル別の分析
  const levelCounts = events.reduce((acc, event) => {
    acc[event.level] = (acc[event.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 褒めメッセージのバリエーション
  const praiseMessages = [
    `${childName}の素晴らしい成長が記録できましたね！`,
    `${childName}の頑張りがよく伝わってきます✨`,
    `${childName}らしい素敵な瞬間がたくさんありましたね`,
    `${childName}の良いところをしっかりと見つけられていますね！`,
    `${childName}の成長の瞬間を大切に記録されていて素晴らしいです`
  ];

  // イベント数に基づく追加メッセージ
  const countMessages = {
    1: '一つ一つの記録が宝物ですね💎',
    2: '今日も良い発見がありましたね😊',
    3: 'たくさんの成長を見つけられましたね🌟',
    4: '素晴らしい観察力です！今日は特に良い日でしたね🎉',
    5: '今日は本当に充実した一日だったようですね！✨'
  };

  const baseMessage = praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
  const additionalMessage = countMessages[Math.min(eventCount, 5) as keyof typeof countMessages];

  return `${baseMessage} ${additionalMessage}`;
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