import React, { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, Clock, CheckCircle, AlertCircle, XCircle, ExternalLink, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  user_id: string;
  expert_id: string;
  consultation_date: string | null;
  consultation_comment: string;
  status: 'pending' | 'paid' | 'booked' | 'completed' | 'cancelled';
  amount: number;
  paid_at: string | null;
  created_at: string;
  user: {
    username: string;
    email: string;
  };
  expert: {
    name: string;
  };
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('expert_consultations')
        .select(`
          *,
          user:users!expert_consultations_user_id_fkey(username, email),
          expert:experts!expert_consultations_expert_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('予約取得エラー:', error);
        // デモデータを表示
        setBookings(getDemoBookings());
        return;
      }

      setBookings(data || []);
    } catch (err) {
      console.error('予約取得エラー:', err);
      setBookings(getDemoBookings());
    } finally {
      setLoading(false);
    }
  };

  const getDemoBookings = (): Booking[] => {
    return [
      {
        id: 'demo-1',
        user_id: 'user-1',
        expert_id: 'expert-1',
        consultation_date: '2025-11-15T14:00:00',
        consultation_comment: '子どもの発達について相談したいです',
        status: 'booked',
        amount: 3000,
        paid_at: '2025-11-07T10:00:00',
        created_at: '2025-11-07T10:00:00',
        user: {
          username: '山田太郎',
          email: 'yamada@example.com'
        },
        expert: {
          name: '田中花子'
        }
      },
      {
        id: 'demo-2',
        user_id: 'user-2',
        expert_id: 'expert-1',
        consultation_date: null,
        consultation_comment: '言語発達について相談したいです',
        status: 'paid',
        amount: 3000,
        paid_at: '2025-11-06T15:30:00',
        created_at: '2025-11-06T15:30:00',
        user: {
          username: '佐藤花子',
          email: 'sato@example.com'
        },
        expert: {
          name: '田中花子'
        }
      },
      {
        id: 'demo-3',
        user_id: 'user-3',
        expert_id: 'expert-1',
        consultation_date: '2025-11-01T10:00:00',
        consultation_comment: '療育の進め方について',
        status: 'completed',
        amount: 3000,
        paid_at: '2025-10-25T09:00:00',
        created_at: '2025-10-25T09:00:00',
        user: {
          username: '鈴木一郎',
          email: 'suzuki@example.com'
        },
        expert: {
          name: '田中花子'
        }
      }
    ];
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'paid':
        return { text: '日時未選択', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle };
      case 'booked':
        return { text: '予約済み', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'completed':
        return { text: '完了', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle };
      case 'cancelled':
        return { text: 'キャンセル', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
      default:
        return { text: '処理中', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
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
      minute: '2-digit',
      weekday: 'short'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    // フィルター
    if (filter === 'upcoming' && !['paid', 'booked'].includes(booking.status)) return false;
    if (filter === 'completed' && booking.status !== 'completed') return false;

    // 検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        booking.user.username.toLowerCase().includes(term) ||
        booking.consultation_comment.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('expert_consultations')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('ステータス更新エラー:', error);
        alert('ステータスの更新に失敗しました');
        return;
      }

      // リストを再取得
      await loadBookings();
      alert('ステータスを更新しました');
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      alert('ステータスの更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">予約管理</h1>
        <p className="text-gray-600">専門家相談の予約一覧を管理します</p>
      </div>

      {/* フィルターと検索 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* フィルター */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              すべて
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              予定
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              完了
            </button>
          </div>

          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="保護者名、コメントで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 予約統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 text-sm font-medium">日時未選択</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {bookings.filter(b => b.status === 'paid').length}件
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">予約済み</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {bookings.filter(b => b.status === 'booked').length}件
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 text-sm font-medium">完了</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {bookings.filter(b => b.status === 'completed').length}件
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* 予約リスト */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">予約がありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保護者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    専門家
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    相談日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => {
                  const status = getStatusLabel(booking.status);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.expert.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(booking.consultation_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-pink-500" />
                          {booking.amount.toLocaleString()}円
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'booked' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('相談を完了にしますか？')) {
                                updateBookingStatus(booking.id, 'completed');
                              }
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            完了
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                          className="text-pink-600 hover:text-pink-900"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">予約詳細</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 保護者情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">保護者情報</h3>
                <p className="text-gray-900 font-medium">{selectedBooking.user.username}</p>
                <p className="text-gray-600 text-sm">{selectedBooking.user.email}</p>
              </div>

              {/* 専門家 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">担当専門家</h3>
                <p className="text-gray-900 font-medium">{selectedBooking.expert.name}</p>
              </div>

              {/* 相談日時 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  相談日時
                </h3>
                <p className="text-gray-900 font-medium">{formatDate(selectedBooking.consultation_date)}</p>
              </div>

              {/* 相談内容 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">相談内容</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedBooking.consultation_comment}</p>
              </div>

              {/* 金額・ステータス */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">金額</h3>
                  <p className="text-gray-900 font-medium text-lg flex items-center">
                    <DollarSign className="w-5 h-5 mr-1 text-pink-500" />
                    {selectedBooking.amount.toLocaleString()}円
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">ステータス</h3>
                  <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStatusLabel(selectedBooking.status).color}`}>
                    {React.createElement(getStatusLabel(selectedBooking.status).icon, { className: 'w-3 h-3 mr-1' })}
                    {getStatusLabel(selectedBooking.status).text}
                  </span>
                </div>
              </div>

              {/* 決済情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">決済情報</h3>
                <p className="text-gray-600 text-sm">決済日時: {formatDate(selectedBooking.paid_at)}</p>
                <p className="text-gray-600 text-sm">予約作成日時: {formatDate(selectedBooking.created_at)}</p>
              </div>
            </div>

            {/* アクション */}
            <div className="mt-6 flex gap-3">
              {selectedBooking.status === 'booked' && (
                <button
                  onClick={() => {
                    if (confirm('相談を完了にしますか？')) {
                      updateBookingStatus(selectedBooking.id, 'completed');
                      setSelectedBooking(null);
                    }
                  }}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  完了にする
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
