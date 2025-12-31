import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExpertManagement from './components/ExpertManagement';
import NotificationManagement from './components/NotificationManagement';
import BookingManagement from './components/BookingManagement';
import { Users, Bell, LayoutDashboard, LogOut, Calendar } from 'lucide-react';

type View = 'dashboard' | 'experts' | 'notifications' | 'bookings';

function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'experts':
        return <ExpertManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'bookings':
        return <BookingManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">専門家管理</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.expert ? user.expert.name : user?.username} さん
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'dashboard'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">ダッシュボード</span>
            </button>
            <button
              onClick={() => setCurrentView('experts')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'experts'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">専門家管理</span>
            </button>
            <button
              onClick={() => setCurrentView('notifications')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'notifications'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell size={20} />
              <span className="font-medium">お知らせ</span>
            </button>
            <button
              onClick={() => setCurrentView('bookings')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'bookings'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={20} />
              <span className="font-medium">予約管理</span>
            </button>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App;





