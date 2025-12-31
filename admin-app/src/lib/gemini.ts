import { GoogleGenAI } from '@google/genai';

// Gemini APIの初期化
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('VITE_GOOGLE_AI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// 成長記録の型定義
export interface GrowthRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  child_id: string;
}

export interface DekitaRecord {
  id: string;
  category: string;
  note: string;
  timestamp: string;
  child_id: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  birthdate?: string;
}

// 個別支援計画書の生成結果の型定義
export interface IndividualSupportPlan {
  supportPolicy: string; // 総合的な支援方針
  supportApproach: string; // 支援のアプローチ
  longTermGoals: Array<{
    goalText: string;
    domain: string; // health_life, motor_sensory, cognition_behavior, language_communication, interpersonal_social
    priority: number;
  }>;
  shortTermGoals: Array<{
    goalText: string;
    domain: string;
    longTermGoalIndex?: number; // 対応する長期目標のインデックス
    successCriteria: string;
  }>;
  supportActivities: Array<{
    activityName: string;
    activityDescription: string;
    domain: string;
    frequency: string;
    duration: string;
    shortTermGoalIndex?: number; // 対応する短期目標のインデックス
  }>;
}

/**
 * 成長記録をもとに個別支援計画書を生成する
 */
export async function generateIndividualSupportPlan(
  child: Child,
  growthRecords: GrowthRecord[],
  dekitaRecords: DekitaRecord[]
): Promise<IndividualSupportPlan> {
  try {
    // プロンプトの作成
    const prompt = createSupportPlanPrompt(child, growthRecords, dekitaRecords);

    // Gemini APIを呼び出し（新しいAPI使用）
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt
    });

    const text = response.text;

    // JSONをパース
    const parsed = parseGeneratedPlan(text);
    return parsed;
  } catch (error) {
    console.error('個別支援計画書の生成エラー:', error);
    throw new Error('個別支援計画書の生成に失敗しました');
  }
}

/**
 * プロンプトの作成
 */
function createSupportPlanPrompt(
  child: Child,
  growthRecords: GrowthRecord[],
  dekitaRecords: DekitaRecord[]
): string {
  // 成長記録をテキストにまとめる
  const growthRecordsText = growthRecords
    .map((record) => {
      return `- 【${record.date}】${record.title}
  カテゴリ: ${record.category}
  内容: ${record.description}`;
    })
    .join('\n\n');

  // できた記録をテキストにまとめる
  const dekitaRecordsText = dekitaRecords
    .map((record) => {
      return `- 【${record.timestamp}】${record.category}: ${record.note}`;
    })
    .join('\n');

  const prompt = `あなたは児童発達支援・放課後等デイサービスの児童発達支援管理責任者です。
保護者から記録された成長記録・できた記録をもとに、個別支援計画書を作成してください。

# 対象児童の情報
- 名前: ${child.name}
- 年齢: ${child.age}歳
${child.birthdate ? `- 生年月日: ${child.birthdate}` : ''}

# 保護者が記録した成長記録
${growthRecordsText || '（成長記録はまだありません）'}

# 保護者が記録したできた記録
${dekitaRecordsText || '（できた記録はまだありません）'}

# 指示
上記の情報をもとに、以下の構造で個別支援計画書を作成してください。

## 出力形式
JSON形式で以下の構造で出力してください。**JSONのみを出力し、他のテキストは含めないでください。**

\`\`\`json
{
  "supportPolicy": "総合的な支援方針を200-300文字で記述",
  "supportApproach": "具体的な支援アプローチを200-300文字で記述",
  "longTermGoals": [
    {
      "goalText": "長期目標の内容（6ヶ月〜1年程度で達成を目指す目標）",
      "domain": "5領域のいずれか（health_life, motor_sensory, cognition_behavior, language_communication, interpersonal_social）",
      "priority": 1
    }
    // ... 3-5個の長期目標
  ],
  "shortTermGoals": [
    {
      "goalText": "短期目標の内容（1-3ヶ月程度で達成を目指す目標）",
      "domain": "5領域のいずれか",
      "longTermGoalIndex": 0,
      "successCriteria": "達成基準を具体的に記述"
    }
    // ... 5-10個の短期目標
  ],
  "supportActivities": [
    {
      "activityName": "支援活動の名称",
      "activityDescription": "具体的な支援内容・方法",
      "domain": "5領域のいずれか",
      "frequency": "週3回",
      "duration": "30分",
      "shortTermGoalIndex": 0
    }
    // ... 5-10個の支援活動
  ]
}
\`\`\`

## 注意事項
1. 5領域とは以下を指します:
   - health_life: 健康・生活
   - motor_sensory: 運動・感覚
   - cognition_behavior: 認知・行動
   - language_communication: 言語・コミュニケーション
   - interpersonal_social: 人間関係・社会性

2. 成長記録とできた記録から、子供の強みと課題を分析してください
3. 具体的で測定可能な目標を設定してください
4. 保護者が実践しやすい支援活動を提案してください
5. 子供の年齢と発達段階に適した内容にしてください
6. ポジティブな表現を心がけ、子供の可能性を引き出す内容にしてください`;

  return prompt;
}

/**
 * 生成されたテキストをパースする
 */
function parseGeneratedPlan(text: string): IndividualSupportPlan {
  try {
    // JSONブロックを抽出（```json ... ``` で囲まれている場合）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    // JSONをパース
    const parsed = JSON.parse(jsonText.trim());

    // 必須フィールドのバリデーション
    if (!parsed.supportPolicy || !parsed.supportApproach) {
      throw new Error('必須フィールドが不足しています');
    }

    return parsed as IndividualSupportPlan;
  } catch (error) {
    console.error('パースエラー:', error);
    console.error('生成されたテキスト:', text);

    // フォールバック: デフォルトの計画書を返す
    return {
      supportPolicy: '保護者の記録をもとに、お子様の成長をサポートしていきます。',
      supportApproach: '個々の特性に合わせた支援を行います。',
      longTermGoals: [
        {
          goalText: '保護者と連携しながら、お子様の成長を見守ります。',
          domain: 'interpersonal_social',
          priority: 1
        }
      ],
      shortTermGoals: [
        {
          goalText: '日々の成長記録を継続していきます。',
          domain: 'interpersonal_social',
          successCriteria: '毎日の記録が継続できる',
        }
      ],
      supportActivities: [
        {
          activityName: '日常活動の記録',
          activityDescription: '日々の活動や成長を記録していきます。',
          domain: 'interpersonal_social',
          frequency: '毎日',
          duration: '適宜'
        }
      ]
    };
  }
}

/**
 * 5領域の日本語名を取得
 */
export function getDomainLabel(domain: string): string {
  const domainLabels: { [key: string]: string } = {
    health_life: '健康・生活',
    motor_sensory: '運動・感覚',
    cognition_behavior: '認知・行動',
    language_communication: '言語・コミュニケーション',
    interpersonal_social: '人間関係・社会性'
  };

  return domainLabels[domain] || domain;
}
