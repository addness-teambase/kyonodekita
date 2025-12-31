import React, { useState, useEffect } from 'react';
import { Send, Bell, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  is_published: boolean;
  published_at: string;
  created_at: string;
}

const NotificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('expert_announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('お知らせ取得エラー:', error);
        // デモデータを表示
        setAnnouncements([
          {
            id: 'demo-1',
            title: '新しい専門家が加わりました',
            content: '田中先生が新しく加わりました。臨床心理士として15年以上の経験があります。',
            created_by: 'demo-user',
            is_published: true,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setAnnouncements(data || []);
      }
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message) {
      alert('タイトルと本文を入力してください');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('expert_announcements')
        .insert({
          title,
          content: message,
          created_by: user?.id || 'demo-user-id',
          is_published: true,
          published_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('お知らせを送信しました');
      setTitle('');
      setMessage('');
      loadAnnouncements(); // リロード
    } catch (error: any) {
      console.error('送信エラー:', error);
      alert('送信に失敗しました: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このお知らせを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('expert_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('お知らせを削除しました');
      loadAnnouncements();
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">お知らせ管理</h2>
        <p className="text-sm text-gray-600 mt-1">親アプリのホーム画面に通知を送信</p>
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-pink-500" />
          <h3 className="text-xl font-semibold text-gray-800">新しいお知らせ</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="例: 新しい専門家が加わりました"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              本文 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={6}
              placeholder="お知らせの内容を入力してください"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            <span>{sending ? '送信中...' : 'お知らせを送信'}</span>
          </button>
        </form>
      </div>

      {/* 送信済みお知らせ一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">送信済みお知らせ</h3>
          <p className="text-sm text-gray-600 mt-1">最新10件を表示</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>まだお知らせがありません</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {announcement.title}
                    </h4>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(announcement.published_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 説明パネル */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 お知らせについて</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">●</span>
            <span>送信されたお知らせは、すべての親アプリユーザーのホーム画面に表示されます</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">●</span>
            <span>新しい専門家の紹介、相談受付のお知らせなどに活用してください</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">●</span>
            <span>お知らせはリアルタイムで配信されます</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationManagement;

