import React, { useState, useRef, useEffect } from 'react';
import { Menu, Smile, Brain, LogOut, User, Calendar as CalendarIcon, Search, Image, MessageSquare, Gift, Bell, Settings, X } from 'lucide-react';
import { StressProvider, useStress } from './context/StressContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ObservationButton from './components/StressButton';
import BarGraph from './components/BarGraph';
import StressHistory from './components/StressHistory';
import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import BottomNavigationBar from './components/BottomNavigationBar';

function AppContent() {
  const { recordMode, setRecordMode } = useStress();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'record' | 'calendar'>('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [statusMessage, setStatusMessage] = useState('ステータスメッセージを入力');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // 現在の日付を取得
  const today = new Date();
  const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // ユーザーメニューの外側をクリックしたときに閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // ステータスメッセージ編集時にフォーカスを当てる
  useEffect(() => {
    if (isEditingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
    }
  }, [isEditingStatus]);

  // 友達リストのダミーデータ
  const friendsList = [
    { id: 1, name: '山田太郎', status: 'オンライン', lastActive: '1時間前' },
    { id: 2, name: '佐藤花子', status: 'オフライン', lastActive: '3時間前' },
    { id: 3, name: '鈴木一郎', status: 'オンライン', lastActive: '30分前' },
  ];

  // サービスリストのダミーデータ
  const servicesList = [
    { id: 1, name: '記録', icon: <MessageSquare size={24} className="text-orange-500" /> },
    { id: 2, name: 'カレンダー', icon: <CalendarIcon size={24} className="text-blue-500" /> },
    { id: 3, name: '通知設定', icon: <Bell size={24} className="text-yellow-500" /> },
    { id: 4, name: '設定', icon: <Settings size={24} className="text-gray-500" /> }
  ];

  // タブごとのコンテンツをレンダリングする関数
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center space-y-4">
            {/* プロフィールセクション */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="プロフィール" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-orange-500" />
                    )}
                  </div>
                  <button
                    className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-1"
                    onClick={() => alert('プロフィール画像を変更する機能は開発中です')}
                  >
                    <Image size={12} />
                  </button>
                </div>

                <div className="ml-4 flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    {user ? user.username : 'ゲスト'}
                  </h2>

                  {isEditingStatus ? (
                    <div className="flex items-center mt-1">
                      <input
                        ref={statusInputRef}
                        type="text"
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-orange-500 w-full"
                        onBlur={() => setIsEditingStatus(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatus(false)}
                      />
                    </div>
                  ) : (
                    <p
                      className="text-sm text-gray-600 mt-1 cursor-pointer"
                      onClick={() => setIsEditingStatus(true)}
                    >
                      {statusMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* 設定ボタンエリア */}
              <div className="mt-4 flex items-center space-x-2">
                <button className="flex-1 text-sm bg-gray-100 py-2 px-3 rounded-md text-gray-700 flex items-center justify-center">
                  <Image size={16} className="mr-2" />
                  <span>BGMを設定</span>
                </button>
              </div>
            </div>

            {/* 検索バー */}
            <div className="w-full bg-gray-100 rounded-lg p-3 flex items-center">
              <Search size={18} className="text-gray-400 mr-2" />
              <span className="text-gray-400 text-sm">検索</span>
            </div>

            {/* 友達リスト */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">友だちリスト</h3>
                <button className="text-sm text-orange-500">すべて見る</button>
              </div>

              <div className="space-y-3">
                {friendsList.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{friend.name}</p>
                        <p className="text-xs text-gray-500">{friend.status} · {friend.lastActive}</p>
                      </div>
                    </div>
                    <button className="text-orange-500">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* サービス */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">サービス</h3>
                <button className="text-sm text-orange-500">すべて見る</button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {servicesList.map(service => (
                  <button
                    key={service.id}
                    className="flex flex-col items-center"
                    onClick={() => {
                      if (service.name === '記録') setActiveTab('record');
                      if (service.name === 'カレンダー') setActiveTab('calendar');
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                      {service.icon}
                    </div>
                    <span className="text-xs text-gray-700">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 今日のヒント */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-800 mb-2">今日のヒント</h3>
              <p className="text-sm text-gray-600">
                毎日の記録を続けることで、自分の気持ちの変化やパターンを見つけることができます。
                「記録」タブから今日の気持ちを記録してみましょう。
              </p>
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

              <div className="flex justify-center">
                <ObservationButton />
              </div>
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

            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-800 mb-2">グラフ表示</h3>
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
            <div className="relative user-menu-container">
              <button
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User size={18} className="text-white" />
              </button>

              {/* ユーザーメニュー */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg p-2 w-48">
                  <div className="flex items-center p-2 border-b border-gray-100">
                    <User size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <button
                    className="flex items-center w-full p-2 text-left hover:bg-gray-50 rounded-md"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <LogOut size={16} className="text-red-500 mr-2" />
                    <span className="text-sm text-red-500">ログアウト</span>
                  </button>
                </div>
              )}
            </div>
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