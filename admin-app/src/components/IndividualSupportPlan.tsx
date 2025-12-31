import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Loader2,
  Save,
  Edit3,
  Trash2,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  generateIndividualSupportPlan,
  getDomainLabel,
  type Child,
  type GrowthRecord,
  type DekitaRecord,
  type IndividualSupportPlan as ISP
} from '../lib/gemini';

interface ChildWithFacility extends Child {
  facility_id: string;
}

interface SavedPlan {
  id: string;
  child_id: string;
  child_name: string;
  plan_start_date: string;
  plan_end_date: string;
  support_policy: string;
  support_approach: string;
  status: string;
  created_at: string;
  ai_generated: boolean;
}

const IndividualSupportPlan: React.FC = () => {
  const [children, setChildren] = useState<ChildWithFacility[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildWithFacility | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<ISP | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    longTermGoals: true,
    shortTermGoals: true,
    activities: true
  });
  const [editMode, setEditMode] = useState(false);
  const [editedPlan, setEditedPlan] = useState<ISP | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 初期データの読み込み
  useEffect(() => {
    loadChildren();
    loadSavedPlans();
  }, []);

  // 児童データの読み込み
  const loadChildren = async () => {
    try {
      setIsLoading(true);

      // ログインユーザーの施設IDを取得
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('ユーザー情報が見つかりません');
      }

      const user = JSON.parse(userStr);
      const facilityId = user.facility_id || user.facilityId;

      if (!facilityId) {
        throw new Error('施設情報が見つかりません');
      }

      // facility_childrenテーブルから児童情報を取得
      const { data: facilityChildren, error: fcError } = await supabase
        .from('facility_children')
        .select('child_id, facility_id')
        .eq('facility_id', facilityId)
        .eq('status', 'active');

      if (fcError) throw fcError;

      if (!facilityChildren || facilityChildren.length === 0) {
        setChildren([]);
        return;
      }

      // 児童の詳細情報を取得
      const childIds = facilityChildren.map(fc => fc.child_id);
      const { data: childrenData, error: childError } = await supabase
        .from('children')
        .select('id, name, age, birthdate')
        .in('id', childIds)
        .eq('status', 'active');

      if (childError) throw childError;

      // facility_idを追加
      const childrenWithFacility = childrenData.map(child => ({
        ...child,
        facility_id: facilityId
      }));

      setChildren(childrenWithFacility);
    } catch (err) {
      console.error('児童データの読み込みエラー:', err);
      setError('児童データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存済み計画書の読み込み
  const loadSavedPlans = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const facilityId = user.facility_id || user.facilityId;

      // 個別支援計画書を取得
      const { data: plans, error } = await supabase
        .from('individual_support_plans')
        .select(`
          id,
          child_id,
          plan_start_date,
          plan_end_date,
          support_policy,
          support_approach,
          status,
          created_at,
          ai_generated,
          children:child_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plansWithNames = plans.map(plan => ({
        ...plan,
        child_name: plan.children?.name || '不明'
      }));

      setSavedPlans(plansWithNames);
    } catch (err) {
      console.error('計画書の読み込みエラー:', err);
    }
  };

  // 計画書を生成
  const handleGeneratePlan = async () => {
    if (!selectedChild) {
      alert('児童を選択してください');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // 成長記録を取得
      const { data: growthData, error: growthError } = await supabase
        .from('growth_records')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('date', { ascending: false })
        .limit(50);

      if (growthError) throw growthError;

      // できた記録を取得
      const { data: recordsData, error: recordsError } = await supabase
        .from('records')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (recordsError) throw recordsError;

      const growthRecords: GrowthRecord[] = growthData || [];
      const dekitaRecords: DekitaRecord[] = recordsData || [];

      // Gemini APIを使って計画書を生成
      const plan = await generateIndividualSupportPlan(
        selectedChild,
        growthRecords,
        dekitaRecords
      );

      setGeneratedPlan(plan);
      setEditedPlan(plan);
      setEditMode(false);
      setViewMode('create');
    } catch (err) {
      console.error('計画書の生成エラー:', err);
      setError('計画書の生成に失敗しました。APIキーが設定されているか確認してください。');
    } finally {
      setIsGenerating(false);
    }
  };

  // 計画書を保存
  const handleSavePlan = async () => {
    if (!selectedChild || !editedPlan) {
      alert('保存する計画書がありません');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // 計画期間を設定（開始日: 今日、終了日: 6ヶ月後）
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      // 個別支援計画書を保存
      const { data: planData, error: planError } = await supabase
        .from('individual_support_plans')
        .insert({
          child_id: selectedChild.id,
          plan_start_date: startDate.toISOString().split('T')[0],
          plan_end_date: endDate.toISOString().split('T')[0],
          support_policy: editedPlan.supportPolicy,
          support_approach: editedPlan.supportApproach,
          ai_generated: true,
          ai_model: 'gemini-2.5-flash-preview-05-20',
          ai_generation_timestamp: new Date().toISOString(),
          status: 'draft'
        })
        .select()
        .single();

      if (planError) throw planError;

      // 長期目標を保存
      const longTermGoalsData = editedPlan.longTermGoals.map((goal, index) => ({
        support_plan_id: planData.id,
        goal_text: goal.goalText,
        domain: goal.domain,
        priority: goal.priority,
        display_order: index
      }));

      const { data: savedLongTermGoals, error: ltgError } = await supabase
        .from('long_term_goals')
        .insert(longTermGoalsData)
        .select();

      if (ltgError) throw ltgError;

      // 短期目標を保存
      const shortTermGoalsData = editedPlan.shortTermGoals.map((goal, index) => {
        const longTermGoalId = goal.longTermGoalIndex !== undefined
          ? savedLongTermGoals[goal.longTermGoalIndex]?.id
          : null;

        return {
          support_plan_id: planData.id,
          long_term_goal_id: longTermGoalId,
          goal_text: goal.goalText,
          domain: goal.domain,
          success_criteria: goal.successCriteria,
          display_order: index
        };
      });

      const { data: savedShortTermGoals, error: stgError } = await supabase
        .from('short_term_goals')
        .insert(shortTermGoalsData)
        .select();

      if (stgError) throw stgError;

      // 支援活動を保存
      const activitiesData = editedPlan.supportActivities.map((activity, index) => {
        const shortTermGoalId = activity.shortTermGoalIndex !== undefined
          ? savedShortTermGoals[activity.shortTermGoalIndex]?.id
          : null;

        return {
          support_plan_id: planData.id,
          short_term_goal_id: shortTermGoalId,
          activity_name: activity.activityName,
          activity_description: activity.activityDescription,
          domain: activity.domain,
          frequency: activity.frequency,
          duration: activity.duration,
          display_order: index
        };
      });

      const { error: activitiesError } = await supabase
        .from('support_activities')
        .insert(activitiesData);

      if (activitiesError) throw activitiesError;

      alert('個別支援計画書を保存しました！');

      // リストを再読み込み
      await loadSavedPlans();

      // リスト画面に戻る
      setViewMode('list');
      setGeneratedPlan(null);
      setEditedPlan(null);
      setSelectedChild(null);
    } catch (err) {
      console.error('保存エラー:', err);
      setError('計画書の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // セクションの展開/折りたたみ
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 編集モードの切り替え
  const handleEditToggle = () => {
    if (!editMode && generatedPlan) {
      setEditedPlan(JSON.parse(JSON.stringify(generatedPlan)));
    }
    setEditMode(!editMode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-24">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-pink-500" />
              <h1 className="text-2xl font-bold text-gray-800">個別支援計画書</h1>
            </div>
            {viewMode !== 'list' && (
              <button
                onClick={() => {
                  setViewMode('list');
                  setGeneratedPlan(null);
                  setEditedPlan(null);
                  setSelectedChild(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                一覧に戻る
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">エラー</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 一覧表示 */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {/* 新規作成ボタン */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">新しい計画書を作成</h2>

              {children.length === 0 ? (
                <p className="text-gray-500">登録されている児童がいません</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      児童を選択
                    </label>
                    <select
                      value={selectedChild?.id || ''}
                      onChange={(e) => {
                        const child = children.find(c => c.id === e.target.value);
                        setSelectedChild(child || null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">児童を選択してください</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.name} ({child.age}歳)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    disabled={!selectedChild || isGenerating}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AIが計画書を生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        AIで計画書を生成
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 保存済み計画書一覧 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">保存済み計画書</h2>

              {savedPlans.length === 0 ? (
                <p className="text-gray-500">保存済みの計画書がありません</p>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map(plan => (
                    <div
                      key={plan.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setViewMode('view');
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{plan.child_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            計画期間: {plan.plan_start_date} 〜 {plan.plan_end_date}
                          </p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {plan.support_policy}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {plan.ai_generated && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              AI生成
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            plan.status === 'active' ? 'bg-green-100 text-green-700' :
                            plan.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 作成/編集画面 */}
        {viewMode === 'create' && generatedPlan && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedChild?.name}さんの個別支援計画書
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {editMode ? 'プレビュー' : '編集'}
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={isSaving}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* 総合的な支援方針 */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2">総合的な支援方針</h3>
                {editMode ? (
                  <textarea
                    value={editedPlan?.supportPolicy || ''}
                    onChange={(e) => setEditedPlan(prev => prev ? { ...prev, supportPolicy: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {generatedPlan.supportPolicy}
                  </p>
                )}
              </div>

              {/* 支援アプローチ */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2">支援アプローチ</h3>
                {editMode ? (
                  <textarea
                    value={editedPlan?.supportApproach || ''}
                    onChange={(e) => setEditedPlan(prev => prev ? { ...prev, supportApproach: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {generatedPlan.supportApproach}
                  </p>
                )}
              </div>

              {/* 長期目標 */}
              <div>
                <button
                  onClick={() => toggleSection('longTermGoals')}
                  className="w-full flex items-center justify-between py-2 text-left"
                >
                  <h3 className="font-bold text-gray-800">長期目標</h3>
                  {expandedSections.longTermGoals ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedSections.longTermGoals && (
                  <div className="space-y-3 mt-3">
                    {generatedPlan.longTermGoals.map((goal, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                            {getDomainLabel(goal.domain)}
                          </span>
                          <span className="text-sm text-gray-600">優先度: {goal.priority}</span>
                        </div>
                        <p className="text-gray-800">{goal.goalText}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 短期目標 */}
              <div>
                <button
                  onClick={() => toggleSection('shortTermGoals')}
                  className="w-full flex items-center justify-between py-2 text-left"
                >
                  <h3 className="font-bold text-gray-800">短期目標</h3>
                  {expandedSections.shortTermGoals ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedSections.shortTermGoals && (
                  <div className="space-y-3 mt-3">
                    {generatedPlan.shortTermGoals.map((goal, index) => (
                      <div key={index} className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                            {getDomainLabel(goal.domain)}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium mb-2">{goal.goalText}</p>
                        <p className="text-sm text-gray-600">
                          達成基準: {goal.successCriteria}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 支援活動 */}
              <div>
                <button
                  onClick={() => toggleSection('activities')}
                  className="w-full flex items-center justify-between py-2 text-left"
                >
                  <h3 className="font-bold text-gray-800">支援活動</h3>
                  {expandedSections.activities ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedSections.activities && (
                  <div className="space-y-3 mt-3">
                    {generatedPlan.supportActivities.map((activity, index) => (
                      <div key={index} className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                            {getDomainLabel(activity.domain)}
                          </span>
                          <div className="text-sm text-gray-600 text-right">
                            <div>{activity.frequency}</div>
                            <div>{activity.duration}</div>
                          </div>
                        </div>
                        <p className="text-gray-800 font-medium mb-2">{activity.activityName}</p>
                        <p className="text-sm text-gray-600">{activity.activityDescription}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualSupportPlan;
