import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, UserCircle, DollarSign, Save, X } from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
  self_introduction: string;
  description: string;
  consultation_fee: number;
  timerex_url: string;
  display_order: number;
  is_active: boolean;
}

interface ExpertForm {
  name: string;
  profile_image_url: string;
  self_introduction: string;
  description: string;
  timerex_url: string;
  display_order: number;
}

const ExpertManagement: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [formData, setFormData] = useState<ExpertForm>({
    name: '',
    profile_image_url: '',
    self_introduction: '',
    description: '',
    timerex_url: '',
    display_order: 0
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadExperts();
  }, []);

  const getDemoExperts = (): Expert[] => {
    return [
      {
        id: 'demo-1',
        name: '田中 花子',
        profile_image_url: null,
        self_introduction: '臨床心理士として15年以上、発達障害のあるお子さんとそのご家族を支援してきました。ABA（応用行動分析）をベースにした療育を専門としています。',
        description: 'お子さんの行動面やコミュニケーション面での困りごとについて、具体的な対応方法を一緒に考えます。家庭での取り組みやすい方法をお伝えします。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-1',
        display_order: 0,
        is_active: true
      },
      {
        id: 'demo-2',
        name: '佐藤 太郎',
        profile_image_url: null,
        self_introduction: '言語聴覚士として、ことばの発達が気になるお子さんを支援してきました。10年以上の経験があり、未就学児から小学生まで幅広く対応しています。',
        description: 'ことばが遅い、発音が気になる、会話が続かないなどの言語面の相談に対応します。お子さんの発達段階に合わせた関わり方を提案します。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-2',
        display_order: 1,
        is_active: true
      },
      {
        id: 'demo-3',
        name: '鈴木 美咲',
        profile_image_url: null,
        self_introduction: '作業療法士として、感覚統合を専門に療育を提供しています。保育園や学校での過ごし方、家庭での支援方法についてもアドバイスしています。',
        description: '感覚過敏や感覚鈍麻、手先の不器用さ、姿勢保持の困難さなど、感覚や運動面の相談に対応します。日常生活での工夫をお伝えします。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-3',
        display_order: 2,
        is_active: false
      }
    ];
  };

  const loadExperts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('専門家取得エラー:', error);
        // テーブルが存在しない場合やエラー時はデモデータを表示
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setExperts(getDemoExperts());
          return;
        }
        throw error;
      }

      // データが空の場合もデモデータを表示
      if (!data || data.length === 0) {
        setExperts(getDemoExperts());
      } else {
        setExperts(data || []);
      }
    } catch (error) {
      console.error('専門家取得エラー:', error);
      // エラー時もデモデータを表示
      setExperts(getDemoExperts());
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルのチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    setUploading(true);
    try {
      // Base64に変換
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, profile_image_url: base64String });
        setUploading(false);
      };
      reader.onerror = () => {
        alert('画像の読み込みに失敗しました');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      alert('画像のアップロードに失敗しました');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        name: formData.name,
        profile_image_url: formData.profile_image_url || null,
        self_introduction: formData.self_introduction,
        description: formData.description,
        consultation_fee: 3000, // 固定
        timerex_url: formData.timerex_url,
        display_order: formData.display_order
      };

      if (editingExpert) {
        // 更新
        const { error } = await supabase
          .from('experts')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingExpert.id);

        if (error) throw error;
        alert('専門家を更新しました');
      } else {
        // 新規追加
        const { error } = await supabase
          .from('experts')
          .insert({
            ...dataToSave,
            is_active: true
          });

        if (error) throw error;
        alert('専門家を追加しました');
      }

      // フォームをリセット
      setFormData({
        name: '',
        profile_image_url: '',
        self_introduction: '',
        description: '',
        timerex_url: '',
        display_order: 0
      });
      setShowForm(false);
      setEditingExpert(null);
      loadExperts();
    } catch (error: any) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + error.message);
    }
  };

  const handleEdit = (expert: Expert) => {
    setEditingExpert(expert);
    setFormData({
      name: expert.name,
      profile_image_url: expert.profile_image_url || '',
      self_introduction: expert.self_introduction,
      description: expert.description,
      timerex_url: expert.timerex_url,
      display_order: expert.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (expert: Expert) => {
    if (!confirm(`${expert.name} を削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('experts')
        .delete()
        .eq('id', expert.id);

      if (error) throw error;
      alert('専門家を削除しました');
      loadExperts();
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました: ' + error.message);
    }
  };


  const handleCancel = () => {
    setShowForm(false);
    setEditingExpert(null);
    setFormData({
      name: '',
      profile_image_url: '',
      self_introduction: '',
      description: '',
      timerex_url: '',
      display_order: 0
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">専門家管理</h2>
          <p className="text-sm text-gray-600 mt-1">専門家の追加・編集・削除</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
          >
            <Plus size={20} />
            <span>専門家を追加</span>
          </button>
        )}
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {editingExpert ? '専門家を編集' : '新しい専門家を追加'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロフィール画像
              </label>
              <div className="flex items-center gap-4">
                {formData.profile_image_url ? (
                  <img
                    src={formData.profile_image_url}
                    alt="プレビュー"
                    className="w-24 h-24 rounded-full object-cover border-2 border-pink-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <UserCircle className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {uploading ? 'アップロード中...' : '画像ファイルを選択（5MB以下、任意）'}
                  </p>
                  {formData.profile_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profile_image_url: '' })}
                      className="text-xs text-red-600 hover:text-red-700 mt-2"
                    >
                      画像を削除
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自己紹介 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.self_introduction}
                onChange={(e) => setFormData({ ...formData, self_introduction: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                相談内容の説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TimeRex URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.timerex_url}
                onChange={(e) => setFormData({ ...formData, timerex_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="https://timerex.net/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示順序
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">数字が小さいほど上に表示されます</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
              >
                <Save size={20} />
                <span>{editingExpert ? '更新する' : '追加する'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 専門家一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {experts.length === 0 ? (
          <div className="p-12 text-center">
            <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">まだ専門家が登録されていません</p>
            <p className="text-sm text-gray-500 mt-2">「専門家を追加」ボタンから登録してください</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {experts.map((expert) => (
              <div
                key={expert.id}
                className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* プロフィール写真 */}
                  <div className="flex-shrink-0">
                    {expert.profile_image_url ? (
                      <img
                        src={expert.profile_image_url}
                        alt={expert.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-pink-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-200">
                        <UserCircle className="w-8 h-8 text-pink-500" />
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{expert.name}</h3>
                        <span className="text-sm text-gray-500">表示順: {expert.display_order}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(expert)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(expert)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{expert.self_introduction}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{expert.description}</p>

                    <a
                      href={expert.timerex_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      TimeRex URL →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertManagement;

