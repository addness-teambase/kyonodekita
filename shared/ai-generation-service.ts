/**
 * AI個別支援計画自動生成サービス
 * HUG競合システムのコア機能
 */

import OpenAI from 'openai';

// ========================================
// 型定義
// ========================================

export interface ChildBasicInfo {
    id: string;
    familyName: string;
    givenName: string;
    birthDate: Date;
    age: number;
    gender: 'male' | 'female' | 'other';
    disabilityType: string[];
    disabilityCertificateGrade?: string;
}

export interface FiveDomainAssessment {
    // 健康・生活
    healthLife: {
        eating: AssessmentItem;
        toileting: AssessmentItem;
        sleeping: AssessmentItem;
        dressing: AssessmentItem;
        hygiene: AssessmentItem;
        healthManagement: AssessmentItem;
        safetyAwareness: AssessmentItem;
    };

    // 運動・感覚
    motorSensory: {
        posture: AssessmentItem;
        mobility: AssessmentItem;
        fineMotorSkills: AssessmentItem;
        grossMotorSkills: AssessmentItem;
        sensoryIntegration: AssessmentItem;
        bodyAwareness: AssessmentItem;
    };

    // 認知・行動
    cognitionBehavior: {
        cognitiveDevelopment: AssessmentItem;
        attention: AssessmentItem;
        memory: AssessmentItem;
        problemSolving: AssessmentItem;
        behaviorRegulation: AssessmentItem;
        emotionalRegulation: AssessmentItem;
    };

    // 言語・コミュニケーション
    languageCommunication: {
        receptiveLanguage: AssessmentItem;
        expressiveLanguage: AssessmentItem;
        nonVerbalCommunication: AssessmentItem;
        conversationSkills: AssessmentItem;
        pragmaticLanguage: AssessmentItem;
    };

    // 人間関係・社会性
    interpersonalSocial: {
        peerRelations: AssessmentItem;
        adultRelations: AssessmentItem;
        groupParticipation: AssessmentItem;
        socialRules: AssessmentItem;
        empathy: AssessmentItem;
        conflictResolution: AssessmentItem;
    };
}

export interface AssessmentItem {
    currentLevel: 1 | 2 | 3 | 4 | 5; // 1:要支援 5:自立
    observations: string;
    specificExamples: string[];
    priority: 1 | 2 | 3; // 1:高 2:中 3:低
}

export interface ParentNeeds {
    childWishes?: string;
    parentWishes: string[];
    priorityAreas: string[];
    homeEnvironment: string;
    familySupport: string;
}

export interface RecordHistory {
    date: Date;
    activityType: string;
    content: string;
    evaluation: string;
    achievements: string[];
}

export interface IndividualSupportPlan {
    // 基本情報
    childId: string;
    planStartDate: Date;
    planEndDate: Date;

    // 総合的な支援方針
    supportPolicy: string;
    supportApproach: string;

    // 目標
    longTermGoals: LongTermGoal[];
    shortTermGoals: ShortTermGoal[];

    // 具体的支援内容
    supportActivities: SupportActivity[];

    // 評価計画
    evaluationPlan: string;
    midTermEvaluationDate: Date;
    finalEvaluationDate: Date;

    // AI生成メタデータ
    aiGenerated: boolean;
    aiModel: string;
    generationTimestamp: Date;
    generationTimeSeconds: number;
}

export interface LongTermGoal {
    goalText: string;
    domain: string;
    priority: number;
    targetDate: Date;
    successCriteria: string;
}

export interface ShortTermGoal {
    goalText: string;
    domain: string;
    longTermGoalId?: string;
    targetDate: Date;
    successCriteria: string;
    evaluationMethod: string;
}

export interface SupportActivity {
    activityName: string;
    activityDescription: string;
    domain: string;
    relatedGoalIds: string[];
    frequency: string;
    duration: string;
    location: string;
    materials: string[];
    staffRequirements: string;
    implementationNotes: string;
}

// ========================================
// AI生成サービス
// ========================================

export class AISupportPlanGenerator {
    private openai: OpenAI;
    private defaultModel = 'gpt-4o'; // 最新モデル

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    /**
     * 個別支援計画の完全自動生成
     * HUGの「30分」を「30秒」にする核心機能
     */
    async generateCompletePlan(
        childInfo: ChildBasicInfo,
        assessment: FiveDomainAssessment,
        parentNeeds: ParentNeeds,
        history: RecordHistory[] = []
    ): Promise<IndividualSupportPlan> {
        const startTime = Date.now();

        try {
            // システムプロンプト（専門家の役割設定）
            const systemPrompt = this.buildSystemPrompt();

            // ユーザープロンプト（具体的な指示）
            const userPrompt = this.buildUserPrompt(
                childInfo,
                assessment,
                parentNeeds,
                history
            );

            console.log('🤖 AI生成開始...');

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            });

            const generationTime = (Date.now() - startTime) / 1000;
            console.log(`✅ AI生成完了: ${generationTime.toFixed(2)}秒`);

            // JSONパース
            const aiOutput = JSON.parse(response.choices[0].message.content || '{}');

            // 構造化データに変換
            const supportPlan = this.parseAIOutput(
                aiOutput,
                childInfo,
                generationTime
            );

            return supportPlan;

        } catch (error) {
            console.error('❌ AI生成エラー:', error);
            throw new Error('個別支援計画の自動生成に失敗しました');
        }
    }

    /**
     * システムプロンプト構築
     * AIに専門家の役割を与える
     */
    private buildSystemPrompt(): string {
        return `あなたは、児童発達支援・放課後等デイサービスにおける20年以上の経験を持つ、児童発達支援管理責任者です。

【あなたの専門性】
- 発達障害（ASD、ADHD、知的障害など）の深い理解
- 個別支援計画作成の豊富な実績（1000件以上）
- 5領域（健康・生活、運動・感覚、認知・行動、言語・コミュニケーション、人間関係・社会性）に基づく総合的な支援計画立案
- エビデンスに基づく支援手法の選択
- 保護者との協働関係構築

【あなたの役割】
児童のアセスメント結果と保護者のニーズを基に、実現可能で効果的な個別支援計画を作成してください。

【重要な原則】
1. 児童の「できること」から始める（ストレングス視点）
2. 小さな成功体験を積み重ねる段階的目標設定
3. 家庭と施設の連携を重視
4. 具体的で測定可能な目標（SMART原則）
5. 児童と保護者の希望を最優先
6. 科学的根拠のある支援手法
7. 過度な目標設定を避け、達成感を大切に

【出力形式】
JSON形式で、以下の構造に従って出力してください。`;
    }

    /**
     * ユーザープロンプト構築
     * 具体的なデータを含む指示
     */
    private buildUserPrompt(
        childInfo: ChildBasicInfo,
        assessment: FiveDomainAssessment,
        parentNeeds: ParentNeeds,
        history: RecordHistory[]
    ): string {
        return `
以下の児童の個別支援計画を作成してください。

# 児童基本情報
- 氏名: ${childInfo.familyName} ${childInfo.givenName}（${childInfo.age}歳）
- 性別: ${childInfo.gender}
- 生年月日: ${childInfo.birthDate.toLocaleDateString('ja-JP')}
- 障害種別: ${childInfo.disabilityType.join('、')}
- 障害等級: ${childInfo.disabilityCertificateGrade || '未取得'}

# 5領域アセスメント結果

## 1. 健康・生活
${this.formatDomainAssessment(assessment.healthLife)}

## 2. 運動・感覚
${this.formatDomainAssessment(assessment.motorSensory)}

## 3. 認知・行動
${this.formatDomainAssessment(assessment.cognitionBehavior)}

## 4. 言語・コミュニケーション
${this.formatDomainAssessment(assessment.languageCommunication)}

## 5. 人間関係・社会性
${this.formatDomainAssessment(assessment.interpersonalSocial)}

# 本人・保護者の希望
${parentNeeds.childWishes ? `【本人の希望】\n${parentNeeds.childWishes}\n\n` : ''}
【保護者の希望】
${parentNeeds.parentWishes.map(w => `- ${w}`).join('\n')}

【優先してほしい領域】
${parentNeeds.priorityAreas.map(a => `- ${a}`).join('\n')}

【家庭環境】
${parentNeeds.homeEnvironment}

【家族のサポート体制】
${parentNeeds.familySupport}

${history.length > 0 ? `
# 過去の支援記録（直近5件）
${history.slice(0, 5).map(h => `
【${h.date.toLocaleDateString('ja-JP')}】${h.activityType}
内容: ${h.content}
評価: ${h.evaluation}
成果: ${h.achievements.join('、')}
`).join('\n')}
` : ''}

# 作成する個別支援計画の要件

1. **計画期間**: 6ヶ月（${new Date().toLocaleDateString('ja-JP')}から）

2. **総合的な支援方針**（200-300字）
   - 児童の強みと課題を踏まえた方針
   - 保護者の希望を反映
   - 温かみのある表現

3. **長期目標**（3-5個）
   - 5領域をバランスよくカバー
   - 保護者の優先事項を重視
   - 6ヶ月後に達成可能なレベル
   - 各目標に優先度を設定（1-5）

4. **短期目標**（8-12個）
   - 長期目標を細分化
   - 3ヶ月で達成可能
   - 具体的で測定可能（SMART原則）
   - 成功体験を得やすい設定

5. **具体的支援内容**（短期目標ごとに2-3個、合計20-30個）
   - 活動名
   - 詳細な活動内容（どのように実施するか）
   - 頻度（例：週3回、毎日など）
   - 所要時間（例：30分、1時間など）
   - 場所（例：室内、屋外、教室など）
   - 必要な教材・道具
   - スタッフ配置（例：1対1、小集団など）
   - 実施上の注意点

6. **評価計画**
   - 中間評価: 3ヶ月後
   - 最終評価: 6ヶ月後
   - 評価方法

# JSON出力フォーマット

\`\`\`json
{
  "supportPolicy": "総合的な支援方針（200-300字）",
  "supportApproach": "具体的な支援アプローチ（100-200字）",
  "longTermGoals": [
    {
      "goalText": "長期目標の文章",
      "domain": "該当領域（health_life等）",
      "priority": 1,
      "targetDate": "6ヶ月後の日付（YYYY-MM-DD）",
      "successCriteria": "達成基準"
    }
  ],
  "shortTermGoals": [
    {
      "goalText": "短期目標の文章",
      "domain": "該当領域",
      "targetDate": "3ヶ月後の日付（YYYY-MM-DD）",
      "successCriteria": "達成基準",
      "evaluationMethod": "評価方法"
    }
  ],
  "supportActivities": [
    {
      "activityName": "活動名",
      "activityDescription": "詳細な活動内容",
      "domain": "該当領域",
      "relatedGoalTexts": ["関連する短期目標の文章"],
      "frequency": "頻度",
      "duration": "所要時間",
      "location": "場所",
      "materials": ["教材1", "教材2"],
      "staffRequirements": "スタッフ配置要件",
      "implementationNotes": "実施上の注意点"
    }
  ],
  "evaluationPlan": "評価計画の説明"
}
\`\`\`

【重要】
- 実際の現場で使える具体的な内容にしてください
- 専門用語を使いすぎず、保護者にも理解しやすい表現を心がけてください
- 児童の「できること」を活かした支援を優先してください
- 段階的で無理のない目標設定を行ってください
`;
    }

    /**
     * 領域別アセスメントのフォーマット
     */
    private formatDomainAssessment(domain: any): string {
        return Object.entries(domain)
            .map(([key, item]: [string, any]) => {
                const levelText = ['要支援', '一部介助', '見守り必要', '概ね自立', '自立'][item.currentLevel - 1];
                const priorityText = ['◎高', '○中', '△低'][item.priority - 1];

                return `
### ${this.translateKey(key)}
- 現在のレベル: ${item.currentLevel}/5（${levelText}）
- 優先度: ${priorityText}
- 観察内容: ${item.observations}
${item.specificExamples.length > 0 ? `- 具体例:\n${item.specificExamples.map((ex: string) => `  - ${ex}`).join('\n')}` : ''}
`;
            })
            .join('\n');
    }

    /**
     * キー名の日本語変換
     */
    private translateKey(key: string): string {
        const translations: Record<string, string> = {
            // 健康・生活
            eating: '食事',
            toileting: '排泄',
            sleeping: '睡眠',
            dressing: '衣服の着脱',
            hygiene: '衛生管理',
            healthManagement: '健康管理',
            safetyAwareness: '安全への配慮',

            // 運動・感覚
            posture: '姿勢',
            mobility: '移動能力',
            fineMotorSkills: '微細運動',
            grossMotorSkills: '粗大運動',
            sensoryIntegration: '感覚統合',
            bodyAwareness: '身体認識',

            // 認知・行動
            cognitiveDevelopment: '認知発達',
            attention: '注意集中',
            memory: '記憶',
            problemSolving: '問題解決',
            behaviorRegulation: '行動調整',
            emotionalRegulation: '感情調整',

            // 言語・コミュニケーション
            receptiveLanguage: '言語理解',
            expressiveLanguage: '言語表出',
            nonVerbalCommunication: '非言語的コミュニケーション',
            conversationSkills: '会話スキル',
            pragmaticLanguage: '語用論',

            // 人間関係・社会性
            peerRelations: '仲間関係',
            adultRelations: '大人との関係',
            groupParticipation: '集団参加',
            socialRules: '社会的ルール',
            empathy: '共感性',
            conflictResolution: '葛藤解決'
        };

        return translations[key] || key;
    }

    /**
     * AI出力のパース
     */
    private parseAIOutput(
        aiOutput: any,
        childInfo: ChildBasicInfo,
        generationTime: number
    ): IndividualSupportPlan {
        const now = new Date();
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        return {
            childId: childInfo.id,
            planStartDate: now,
            planEndDate: sixMonthsLater,

            supportPolicy: aiOutput.supportPolicy || '',
            supportApproach: aiOutput.supportApproach || '',

            longTermGoals: (aiOutput.longTermGoals || []).map((goal: any) => ({
                goalText: goal.goalText,
                domain: goal.domain,
                priority: goal.priority,
                targetDate: new Date(goal.targetDate),
                successCriteria: goal.successCriteria
            })),

            shortTermGoals: (aiOutput.shortTermGoals || []).map((goal: any) => ({
                goalText: goal.goalText,
                domain: goal.domain,
                targetDate: new Date(goal.targetDate),
                successCriteria: goal.successCriteria,
                evaluationMethod: goal.evaluationMethod
            })),

            supportActivities: (aiOutput.supportActivities || []).map((activity: any) => ({
                activityName: activity.activityName,
                activityDescription: activity.activityDescription,
                domain: activity.domain,
                relatedGoalIds: [], // 後でマッピング
                frequency: activity.frequency,
                duration: activity.duration,
                location: activity.location,
                materials: activity.materials || [],
                staffRequirements: activity.staffRequirements,
                implementationNotes: activity.implementationNotes
            })),

            evaluationPlan: aiOutput.evaluationPlan || '',
            midTermEvaluationDate: threeMonthsLater,
            finalEvaluationDate: sixMonthsLater,

            aiGenerated: true,
            aiModel: this.defaultModel,
            generationTimestamp: now,
            generationTimeSeconds: generationTime
        };
    }

    /**
     * 個別支援計画の再生成（部分修正）
     */
    async regenerateSection(
        currentPlan: IndividualSupportPlan,
        section: 'policy' | 'longTermGoals' | 'shortTermGoals' | 'activities',
        additionalInstructions: string
    ): Promise<any> {
        const systemPrompt = `あなたは児童発達支援管理責任者です。既存の個別支援計画の一部を修正してください。`;

        const userPrompt = `
現在の個別支援計画の「${section}」セクションを、以下の指示に基づいて修正してください。

【現在の内容】
${JSON.stringify(currentPlan[section as keyof IndividualSupportPlan], null, 2)}

【修正指示】
${additionalInstructions}

【出力】
修正後のJSON
`;

        const response = await this.openai.chat.completions.create({
            model: this.defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    }
}

// ========================================
// 使用例
// ========================================

export async function exampleUsage() {
    // API初期化
    const generator = new AISupportPlanGenerator(process.env.OPENAI_API_KEY!);

    // サンプルデータ
    const childInfo: ChildBasicInfo = {
        id: 'child-123',
        familyName: '山田',
        givenName: '太郎',
        birthDate: new Date('2018-04-01'),
        age: 7,
        gender: 'male',
        disabilityType: ['自閉スペクトラム症', '注意欠如・多動症'],
        disabilityCertificateGrade: 'B2'
    };

    const assessment: FiveDomainAssessment = {
        healthLife: {
            eating: {
                currentLevel: 3,
                observations: '好き嫌いが多く、特定の食材を拒否することがある',
                specificExamples: ['野菜を避ける傾向', '白いご飯は食べられる'],
                priority: 2
            },
            toileting: {
                currentLevel: 4,
                observations: '概ね自立しているが、たまに失敗することがある',
                specificExamples: ['声かけがあれば確実', '夢中になると忘れる'],
                priority: 3
            },
            // ... 他の項目
            sleeping: { currentLevel: 4, observations: '', specificExamples: [], priority: 3 },
            dressing: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            hygiene: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            healthManagement: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            safetyAwareness: { currentLevel: 2, observations: '衝動的な行動がある', specificExamples: ['道路に飛び出すことがある'], priority: 1 }
        },
        motorSensory: {
            posture: { currentLevel: 4, observations: '', specificExamples: [], priority: 3 },
            mobility: { currentLevel: 4, observations: '', specificExamples: [], priority: 3 },
            fineMotorSkills: { currentLevel: 3, observations: 'ボタンの付け外しが苦手', specificExamples: [], priority: 2 },
            grossMotorSkills: { currentLevel: 4, observations: '', specificExamples: [], priority: 3 },
            sensoryIntegration: { currentLevel: 2, observations: '大きな音が苦手', specificExamples: ['運動会のピストル音で耳を塞ぐ'], priority: 1 },
            bodyAwareness: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 }
        },
        cognitionBehavior: {
            cognitiveDevelopment: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            attention: { currentLevel: 2, observations: '集中が続かない', specificExamples: ['5分程度で別のことに移る'], priority: 1 },
            memory: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            problemSolving: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            behaviorRegulation: { currentLevel: 2, observations: '衝動的な行動が多い', specificExamples: ['順番を待てない'], priority: 1 },
            emotionalRegulation: { currentLevel: 2, observations: '感情のコントロールが難しい', specificExamples: ['気に入らないとパニックになる'], priority: 1 }
        },
        languageCommunication: {
            receptiveLanguage: { currentLevel: 3, observations: '簡単な指示は理解できる', specificExamples: [], priority: 2 },
            expressiveLanguage: { currentLevel: 3, observations: '単語でのやり取りが中心', specificExamples: [], priority: 2 },
            nonVerbalCommunication: { currentLevel: 3, observations: '', specificExamples: [], priority: 2 },
            conversationSkills: { currentLevel: 2, observations: 'キャッチボールが続かない', specificExamples: ['一方的に話す'], priority: 1 },
            pragmaticLanguage: { currentLevel: 2, observations: '', specificExamples: [], priority: 2 }
        },
        interpersonalSocial: {
            peerRelations: { currentLevel: 2, observations: '友達との関わりが少ない', specificExamples: ['一人遊びが多い'], priority: 1 },
            adultRelations: { currentLevel: 3, observations: '大人とは良好', specificExamples: [], priority: 3 },
            groupParticipation: { currentLevel: 2, observations: '集団活動への参加が難しい', specificExamples: ['すぐに離脱する'], priority: 1 },
            socialRules: { currentLevel: 2, observations: '順番やルールの理解が難しい', specificExamples: [], priority: 1 },
            empathy: { currentLevel: 2, observations: '', specificExamples: [], priority: 2 },
            conflictResolution: { currentLevel: 2, observations: '', specificExamples: [], priority: 2 }
        }
    };

    const parentNeeds: ParentNeeds = {
        childWishes: 'お友達と遊びたい',
        parentWishes: [
            '集団生活に慣れてほしい',
            '感情のコントロールができるようになってほしい',
            '学校での困りごとを減らしたい'
        ],
        priorityAreas: ['人間関係・社会性', '認知・行動'],
        homeEnvironment: '両親と本人の3人家族。母親が主に育児を担当。',
        familySupport: '祖父母が近くに住んでおり、週末にサポート可能。'
    };

    // 🚀 AI自動生成実行
    console.log('========================================');
    console.log('個別支援計画 AI自動生成デモ');
    console.log('========================================\n');

    const startTime = Date.now();
    const supportPlan = await generator.generateCompletePlan(
        childInfo,
        assessment,
        parentNeeds
    );
    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n========================================');
    console.log('✅ 生成完了！');
    console.log('========================================');
    console.log(`⏱️  所要時間: ${totalTime.toFixed(2)}秒`);
    console.log(`🎯 長期目標: ${supportPlan.longTermGoals.length}個`);
    console.log(`📝 短期目標: ${supportPlan.shortTermGoals.length}個`);
    console.log(`🎨 支援活動: ${supportPlan.supportActivities.length}個`);
    console.log('\n📄 支援方針:');
    console.log(supportPlan.supportPolicy);

    return supportPlan;
}

