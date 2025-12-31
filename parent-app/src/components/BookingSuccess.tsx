import React, { useEffect, useState } from 'react';
import { CheckCircle, Calendar, ExternalLink, Clock, DollarSign, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
  consultation_fee: number;
  timerex_url: string;
}

interface BookingSuccessProps {
  expertId: string;
  onClose: () => void;
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({ expertId, onClose }) => {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpert();
  }, [expertId]);

  const loadExpert = async () => {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', expertId)
        .single();

      if (error) {
        console.error('専門家情報取得エラー:', error);
        return;
      }

      setExpert(data);
    } catch (err) {
      console.error('専門家情報取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTimeRex = () => {
    if (expert?.timerex_url) {
      window.open(expert.timerex_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* 成功アイコン */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            お支払いが完了しました！
          </h1>
          <p className="text-gray-600">
            ありがとうございます。決済が正常に完了しました。
          </p>
        </div>

        {/* 専門家情報 */}
        {expert && (
          <div className="bg-pink-50 rounded-xl p-4 mb-6">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-pink-600 mr-2" />
              <span className="text-sm font-semibold text-gray-700">相談先</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-lg">{expert.name}</p>
                <div className="flex items-center text-pink-600 mt-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span className="text-sm font-semibold">
                    {expert.consultation_fee.toLocaleString()}円
                  </span>
                </div>
              </div>
              {expert.profile_image_url && (
                <img
                  src={expert.profile_image_url}
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-pink-200"
                />
              )}
            </div>
          </div>
        )}

        {/* 次のステップ */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-pink-500" />
            次のステップ
          </h2>
          <ol className="space-y-3 mb-6">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-pink-500 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0">
                1
              </span>
              <span className="text-gray-700 pt-0.5">
                下のボタンから予約ページへ移動
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-pink-500 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0">
                2
              </span>
              <span className="text-gray-700 pt-0.5">
                ご希望の日時を選択
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-pink-500 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0">
                3
              </span>
              <span className="text-gray-700 pt-0.5">
                予約完了後、Zoomリンクがメールで届きます
              </span>
            </li>
          </ol>
        </div>

        {/* TimeRexボタン */}
        <button
          onClick={handleOpenTimeRex}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center mb-4 active:scale-95"
        >
          <Calendar className="w-5 h-5 mr-2" />
          予約日時を選ぶ
          <ExternalLink className="w-4 h-4 ml-2" />
        </button>

        {/* 後で予約ボタン */}
        <button
          onClick={onClose}
          className="w-full bg-white text-gray-700 font-medium py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
        >
          後で予約する
        </button>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 ポイント：</span>
            予約履歴は「マイページ」からいつでも確認できます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
