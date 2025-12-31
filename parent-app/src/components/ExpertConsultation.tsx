import React, { useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { UserCircle, ChevronRight, Clock, DollarSign, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
  self_introduction: string;
  description: string;
  consultation_fee: number;
  timerex_url: string;
}

interface ExpertConsultationProps {
  onExpertSelect: (expert: Expert) => void;
  selectedExpert: Expert | null;
}

const ExpertConsultation: React.FC<ExpertConsultationProps> = ({ onExpertSelect, selectedExpert }) => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('experts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('専門家取得エラー:', fetchError);
        // テーブルが存在しない場合はデモデータを表示
        if (fetchError.code === '42P01' || fetchError.message.includes('does not exist')) {
          setExperts(getDemoExperts());
          setError(null);
          return;
        }
        setError('専門家情報の取得に失敗しました');
        return;
      }

      // データが空の場合はデモデータを表示
      if (!data || data.length === 0) {
        setExperts(getDemoExperts());
      } else {
        setExperts(data);
      }
    } catch (err) {
      console.error('専門家取得エラー:', err);
      // エラー時もデモデータを表示
      setExperts(getDemoExperts());
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // デモデータ（テーブルが存在しない場合やデータがない場合に使用）
  const getDemoExperts = (): Expert[] => {
    return [
      {
        id: 'demo-1',
        name: '田中 花子',
        profile_image_url: null,
        self_introduction: '臨床心理士として15年以上、発達障害のあるお子さんとそのご家族を支援してきました。ABA（応用行動分析）をベースにした療育を専門としています。',
        description: 'お子さんの行動面やコミュニケーション面での困りごとについて、具体的な対応方法を一緒に考えます。家庭での取り組みやすい方法をお伝えします。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-1'
      },
      {
        id: 'demo-2',
        name: '佐藤 太郎',
        profile_image_url: null,
        self_introduction: '言語聴覚士として、ことばの発達が気になるお子さんを支援してきました。10年以上の経験があり、未就学児から小学生まで幅広く対応しています。',
        description: 'ことばが遅い、発音が気になる、会話が続かないなどの言語面の相談に対応します。お子さんの発達段階に合わせた関わり方を提案します。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-2'
      },
      {
        id: 'demo-3',
        name: '鈴木 美咲',
        profile_image_url: null,
        self_introduction: '作業療法士として、感覚統合を専門に療育を提供しています。保育園や学校での過ごし方、家庭での支援方法についてもアドバイスしています。',
        description: '感覚過敏や感覚鈍麻、手先の不器用さ、姿勢保持の困難さなど、感覚や運動面の相談に対応します。日常生活での工夫をお伝えします。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-3'
      },
      {
        id: 'demo-4',
        name: '山田 健一',
        profile_image_url: null,
        self_introduction: '保育士として15年以上勤務後、発達支援コーディネーターとして活動しています。集団生活での適応支援や、保護者の方への相談支援を専門としています。',
        description: '保育園や幼稚園での集団生活での困りごと、友達との関わり方、活動への参加の仕方などについて相談できます。実践的なアドバイスをします。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-4'
      },
      {
        id: 'demo-5',
        name: '高橋 さくら',
        profile_image_url: null,
        self_introduction: '臨床心理士・公認心理師として、子どもの心理的な支援を専門としています。不登校や情緒面の不安定さ、家族関係の相談にも対応しています。',
        description: 'お子さんの気持ちの理解や、保護者の方の気持ちの整理、家族関係についての相談に対応します。心理的な視点から支援方法を一緒に考えます。',
        consultation_fee: 3000,
        timerex_url: 'https://timerex.net/booking/example-expert-5'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadExperts}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">現在、専門家の登録がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* ヘッダー */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">専門家相談</h2>
        <p className="text-gray-600 text-sm">専門家とZoomで相談できます</p>
      </div>

      {/* 仮想スクロールリスト */}
      <div className="flex-1">
        <Virtuoso
          style={{ height: '100%' }}
          data={experts}
          itemContent={(index, expert) => (
            <div className="pb-3">
              <div
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-pink-200 cursor-pointer active:scale-[0.98]"
                onClick={() => onExpertSelect(expert)}
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
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">
                        {expert.name}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>

                    {/* 自己紹介文（2行まで） */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {expert.self_introduction}
                    </p>

                    {/* 料金 */}
                    <div className="flex items-center">
                      <div className="flex items-center text-pink-600">
                        <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="text-sm font-semibold">
                          {expert.consultation_fee.toLocaleString()}円
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          components={{
            Footer: () => <div className="h-32" />, // ナビゲーションバー用のスペース
          }}
        />
      </div>
    </div>
  );
};

export default ExpertConsultation;

