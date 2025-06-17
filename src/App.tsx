import React, { useState, useEffect } from 'react';
import { Menu, Smile, Brain, LogOut, User, Calendar as CalendarIcon, PlusCircle, Clock } from 'lucide-react';
import { StressProvider, useStress } from './context/StressContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ObservationButton from './components/StressButton';
import BarGraph from './components/BarGraph';
import StressHistory from './components/StressHistory';
import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import BottomNavigationBar from './components/BottomNavigationBar';

// 記録データの型定義
interface RecordEntry {
  id: string;
  date: Date;
  content: string;
  type: 'stress' | 'good';
  createdAt: Date;
}

function AppContent() {
  const { recordMode, setRecordMode } = useStress();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'record' | 'calendar' | 'graph'>('home');

  // 記録データのステート
  const [todayRecords, setTodayRecords] = useState<RecordEntry[]>([]);

  // 記録を追加する関数
  const addRecord = (content: string) => {
    const newRecord: RecordEntry = {
      id: Date.now().toString(),
      date: new Date(),
      content,
      type: recordMode,
      createdAt: new Date()
    };

    setTodayRecords(prev => [newRecord, ...prev]);
  };

  // 今日の日付の記録だけをフィルタリングする関数
  const filterTodayRecords = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return todayRecords.filter(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  };

  // 現在の日付を取得
  const today = new Date();
  const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 今日の記録
  const todaysFilteredRecords = filterTodayRecords();
  const hasRecords = todaysFilteredRecords.length > 0;

  // 記録時間をフォーマットする関数
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // タブごとのコンテンツをレンダリングする関数
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center">
            {/* シンプルなウェルカムカード */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <User size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-medium text-gray-800">
                      {user ? user.username : 'ゲスト'}さん
                    </h2>
                    <p className="text-xs text-gray-500">
                      今日も頑張りましょう！
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {formattedDate}
                </div>
              </div>
            </div>

            {/* 記録サマリー */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-gray-800 mb-3">今日の記録</h3>

              {hasRecords ? (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  {todaysFilteredRecords.map(record => (
                    <div key={record.id} className={`p-3 rounded-lg ${record.type === 'good' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${record.type === 'good' ? 'text-green-600' : 'text-orange-600'}`}>
                          {record.type === 'good' ? '良かったこと' : '不安なこと'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatTime(record.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{record.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-3">今日はまだ記録がありません</p>
                  <button
                    onClick={() => setActiveTab('record')}
                    className="inline-flex items-center justify-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <PlusCircle size={16} />
                    <span>記録を始める</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-bold text-white mb-2">チャット</h2>
            <p className="text-white/80">この機能は開発中です</p>
          </div>
        );
      case 'record':
        return (
          <div className="flex flex-col items-center">
            <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-3">
                今日の記録
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {formattedDate}の気持ちを記録しましょう
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex justify-center gap-1.5">
                  <button
                    onClick={() => setRecordMode('stress')}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'stress'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <Brain size={14} />
                    <span>不安なこと</span>
                  </button>
                  <button
                    onClick={() => setRecordMode('good')}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'good'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <Smile size={14} />
                    <span>良かったこと</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center mb-5">
                <ObservationButton onSubmit={addRecord} />
              </div>

              {/* 今日の記録一覧 */}
              {hasRecords && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">今日の記録一覧</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    {todaysFilteredRecords.map(record => (
                      <div key={record.id} className={`p-3 rounded-lg ${record.type === 'good' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-medium ${record.type === 'good' ? 'text-green-600' : 'text-orange-600'}`}>
                            {record.type === 'good' ? '良かったこと' : '不安なこと'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{record.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="flex flex-col items-center">
            <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-3">
                記録カレンダー
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                過去の記録を振り返ることができます
              </p>

              <StressHistory mode={recordMode} />
            </div>
          </div>
        );
      case 'graph':
        return (
          <div className="flex flex-col items-center">
            <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-3">
                グラフ表示
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                気分の変化をグラフで確認できます
              </p>

              <BarGraph mode={recordMode} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-400 flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/10 backdrop-blur-md shadow-sm">
        <div className="container mx-auto max-w-md px-4 py-2 flex justify-between items-center">
          <div className="w-[18px]"></div> {/* スペーサー要素 */}
          <h1 className="text-xl font-bold text-white">
            きょうのできた
          </h1>
          {user && (
            <button
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="ログアウト"
              title="ログアウト"
            >
              <User size={18} className="text-white" />
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto max-w-md px-4 pt-2 pb-20 flex-1 will-change-transform overflow-y-auto">
        {renderContent()}
      </div>

      {/* 下部ナビゲーション */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
      />
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-500 to-orange-400">
        <div className="flex flex-col items-center text-white">
          <svg className="animate-spin h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <StressProvider>
      <AppContent />
    </StressProvider>
  ) : (
    <LoginPage />
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;