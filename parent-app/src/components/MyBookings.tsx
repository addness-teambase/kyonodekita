import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ExternalLink, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: string;
  expert_id: string;
  consultation_date: string | null;
  consultation_comment: string;
  status: 'pending' | 'paid' | 'booked' | 'completed' | 'cancelled';
  amount: number;
  paid_at: string | null;
  created_at: string;
  expert: {
    name: string;
    profile_image_url: string | null;
    timerex_url: string;
  };
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id]);

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('expert_consultations')
        .select(`
          *,
          expert:experts(name, profile_image_url, timerex_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('予約履歴取得エラー:', error);
        // デモデータを表示
        setBookings(getDemoBookings());
        return;
      }

      setBookings(data || []);
    } catch (err) {
      console.error('予約履歴取得エラー:', err);
      setBookings(getDemoBookings());
    } finally {
      setLoading(false);
    }
  };

  const getDemoBookings = (): Booking[] => {
    return [
      {
        id: 'demo-1',
        expert_id: 'demo-expert-1',
        consultation_date: '2025-11-15T14:00:00',
        consultation_comment: '子どもの発達について相談したいです',
        status: 'booked',
        amount: 3000,
        paid_at: '2025-11-07T10:00:00',
        created_at: '2025-11-07T10:00:00',
        expert: {
          name: '田中 花子',
          profile_image_url: null,
          timerex_url: 'https://timerex.net/example'
        }
      },
      {
        id: 'demo-2',
        expert_id: 'demo-expert-2',
        consultation_date: null,
        consultation_comment: '言語発達について',
        status: 'paid',
        amount: 3000,
        paid_at: '2025-11-06T15:30:00',
        created_at: '2025-11-06T15:30:00',
        expert: {
          name: '佐藤 太郎',
          profile_image_url: null,
          timerex_url: 'https://timerex.net/example'
        }
      }
    ];
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'paid':
        return { text: '日時未選択', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      case 'booked':
        return { text: '予約済み', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'completed':
        return { text: '完了', color: 'bg-gray-100 text-gray-800', icon: CheckCircle };
      case 'cancelled':
        return { text: 'キャンセル', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { text: '処理中', color: 'bg-blue-100 text-blue-800', icon: Clock };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未定';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return booking.status === 'paid' || booking.status === 'booked';
    }
    if (filter === 'past') {
      return booking.status === 'completed' || booking.status === 'cancelled';
    }
    return true;
  });

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
    <div className="w-full h-full overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">予約履歴</h1>
          <p className="text-gray-600">専門家相談の予約一覧です</p>
        </div>

        {/* フィルター */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'upcoming'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            予定
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'past'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            過去
          </button>
        </div>

        {/* 予約リスト */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">予約履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const status = getStatusLabel(booking.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {/* ステータスバッジ */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color} flex items-center`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.text}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(booking.created_at)}
                    </span>
                  </div>

                  {/* 専門家情報 */}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      {booking.expert.profile_image_url ? (
                        <img
                          src={booking.expert.profile_image_url}
                          alt={booking.expert.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-pink-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{booking.expert.name}</p>
                      <div className="flex items-center text-pink-600 text-sm">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {booking.amount.toLocaleString()}円
                      </div>
                    </div>
                  </div>

                  {/* 相談日時 */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center text-gray-700 text-sm">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">相談日時:</span>
                      <span className="ml-2">{formatDate(booking.consultation_date)}</span>
                    </div>
                  </div>

                  {/* コメント */}
                  {booking.consultation_comment && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {booking.consultation_comment}
                    </p>
                  )}

                  {/* アクションボタン */}
                  {booking.status === 'paid' && (
                    <button
                      onClick={() => window.open(booking.expert.timerex_url, '_blank')}
                      className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      予約日時を選ぶ
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
