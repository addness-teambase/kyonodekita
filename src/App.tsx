import React, { useState } from 'react';
import { Menu, Smile, Brain, LogOut, User } from 'lucide-react';
import { StressProvider, useStress } from './context/StressContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ObservationButton from './components/StressButton';
import BarGraph from './components/BarGraph';
import StressHistory from './components/StressHistory';
import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import Sidebar from './components/Sidebar';

function AppContent() {
  const { recordMode, setRecordMode } = useStress();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-400 md:flex">
      {/* サイドバー */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/10 backdrop-blur-md shadow-sm">
          <div className="container mx-auto max-w-md px-4 py-2 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="メニューを開く"
            >
              <Menu size={18} />
            </button>

            <h1 className="text-xl font-bold text-white absolute left-1/2 transform -translate-x-1/2">
              きょうのできた
            </h1>

            <div className="w-[18px]"></div> {/* スペーサー要素で中央揃えを維持 */}
          </div>
        </header>

        <div className="container mx-auto max-w-md px-4 pt-2 pb-6 flex-1 will-change-transform">
          <div className="mb-3 text-center">
            <h2 className="text-base font-medium text-white mb-1">
              {recordMode === 'good' ? '良かったこと' : '不安に思ったこと'}
            </h2>
            <p className="text-xs text-white/80 max-w-xs mx-auto">
              {recordMode === 'good'
                ? '自分や周りに対して「いいな」と感じたことを記録'
                : '不安や悩み、心配事などを記録'
              }
            </p>
          </div>

          <div className="md:hidden bg-white/10 backdrop-blur-sm rounded-lg p-1 mb-4 shadow-inner">
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => setRecordMode('stress')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'stress'
                  ? 'bg-white text-blue-500 shadow-md'
                  : 'bg-transparent text-white hover:bg-white/10'
                  }`}
              >
                <Brain size={14} />
                <span>不安なこと</span>
              </button>
              <button
                onClick={() => setRecordMode('good')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'good'
                  ? 'bg-white text-blue-500 shadow-md'
                  : 'bg-transparent text-white hover:bg-white/10'
                  }`}
              >
                <Smile size={14} />
                <span>良かったこと</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-5">
            <ObservationButton />
          </div>

          <div className="space-y-3">
            <BarGraph mode={recordMode} />
            <StressHistory mode={recordMode} />
          </div>
        </div>
      </div>

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-400">
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