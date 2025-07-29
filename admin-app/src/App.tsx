import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Calendar,
  Settings,
  Bell,
  Search,
  Home,
  LogOut,
  Building,
  User,
  Send,
  X,
  ChevronRight,
  Plus,
  MoreVertical,
  Edit,
  Eye,
  UserPlus
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CalendarView from './components/CalendarView';

// デモデータ（parent-appベース）
const DEMO_DATA = {
  stats: {
    totalChildren: 24,
    activeToday: 18,
    totalRecords: 1456,
    unreadMessages: 7
  },
  children: [
    {
      id: 'child1',
      name: '山田花子',
      age: 5,
      parentName: '山田一郎',
      parentEmail: 'yamada@example.com',
      lastActivity: '2024-01-15T14:30:00Z',
      unreadMessages: 2,
      todayRecords: 3,
      status: 'active',
      avatar: 'YH',
      birthdate: '2019-03-15',
      gender: 'female' as const
    },
    {
      id: 'child2',
      name: '佐藤太郎',
      age: 4,
      parentName: '佐藤美香',
      parentEmail: 'sato@example.com',
      lastActivity: '2024-01-15T11:15:00Z',
      unreadMessages: 0,
      todayRecords: 2,
      status: 'active',
      avatar: 'ST',
      birthdate: '2020-07-22',
      gender: 'male' as const
    },
    {
      id: 'child3',
      name: '鈴木みお',
      age: 3,
      parentName: '鈴木健二',
      parentEmail: 'suzuki@example.com',
      lastActivity: '2024-01-15T09:45:00Z',
      unreadMessages: 1,
      todayRecords: 4,
      status: 'active',
      avatar: 'SM',
      birthdate: '2021-01-10',
      gender: 'female' as const
    },
    {
      id: 'child4',
      name: '田中けんた',
      age: 6,
      parentName: '田中智子',
      parentEmail: 'tanaka@example.com',
      lastActivity: '2024-01-15T16:20:00Z',
      unreadMessages: 0,
      todayRecords: 1,
      status: 'active',
      avatar: 'TK',
      birthdate: '2018-11-03',
      gender: 'male' as const
    }
  ],
  chatMessages: [
    {
      id: 'msg1',
      childId: 'child1',
      sender: 'parent',
      senderName: '山田一郎',
      message: 'いつもお世話になっております。花子のお昼寝の件でご相談があります。',
      timestamp: '2024-01-15T14:25:00Z'
    },
    {
      id: 'msg2',
      childId: 'child1',
      sender: 'admin',
      senderName: '管理者',
      message: 'お疲れさまです。お昼寝の件、承知いたしました！どのようなご相談でしょうか？',
      timestamp: '2024-01-15T14:30:00Z'
    },
    {
      id: 'msg3',
      childId: 'child3',
      sender: 'parent',
      senderName: '鈴木健二',
      message: 'みおの様子はいかがでしょうか？',
      timestamp: '2024-01-15T13:15:00Z'
    }
  ]
};

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('children');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatChild, setChatChild] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(DEMO_DATA.chatMessages);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    birthdate: '',
    gender: 'female' as 'male' | 'female',
    parentName: '',
    parentEmail: ''
  });

  // ログインしていない場合はLoginPageを表示
  if (!user) {
    return <LoginPage />;
  }

  // 時間フォーマット
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric'
    });
  };

  // 年齢計算
  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const today = new Date();
    const birthdateObj = new Date(birthdate);
    let age = today.getFullYear() - birthdateObj.getFullYear();
    const monthDiff = today.getMonth() - birthdateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
      age--;
    }
    return age;
  };

  // チャット機能
  const startChat = (childId: string) => {
    setChatChild(childId);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !chatChild) return;

    const message = {
      id: `msg_${Date.now()}`,
      childId: chatChild,
      sender: 'admin' as const,
      senderName: '管理者',
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  // 園児追加
  const handleAddChild = () => {
    if (!newChild.name.trim() || !newChild.parentName.trim()) return;

    const child = {
      id: `child_${Date.now()}`,
      name: newChild.name,
      age: calculateAge(newChild.birthdate),
      parentName: newChild.parentName,
      parentEmail: newChild.parentEmail,
      lastActivity: new Date().toISOString(),
      unreadMessages: 0,
      todayRecords: 0,
      status: 'active' as const,
      avatar: newChild.name.charAt(0).toUpperCase() + (newChild.name.charAt(1) || '').toUpperCase(),
      birthdate: newChild.birthdate,
      gender: newChild.gender
    };

    // TODO: 実際のデータ追加処理
    console.log('園児追加:', child);
    setShowAddChildModal(false);
    setNewChild({
      name: '',
      birthdate: '',
      gender: 'female',
      parentName: '',
      parentEmail: ''
    });
  };

  // サイドバーメニュー
  const sidebarItems = [
    { id: 'children', label: '園児一覧', icon: Users },
    { id: 'management', label: '園児管理', icon: UserPlus },
    { id: 'messages', label: 'メッセージ', icon: MessageSquare, badge: DEMO_DATA.stats.unreadMessages },
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'settings', label: '設定', icon: Settings }
  ];

  // フィルタリングされた園児リスト
  const filteredChildren = DEMO_DATA.children.filter(child =>
    child.name.includes(searchQuery) || child.parentName.includes(searchQuery)
  );

  // メインコンテンツのレンダリング
  const renderMainContent = () => {
    switch (currentView) {
      case 'children':
        return (
          <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">総園児数</p>
                    <p className="text-3xl font-bold text-gray-900">{DEMO_DATA.stats.totalChildren}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">本日の出席</p>
                    <p className="text-3xl font-bold text-gray-900">{DEMO_DATA.stats.activeToday}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">総記録数</p>
                    <p className="text-3xl font-bold text-gray-900">{DEMO_DATA.stats.totalRecords}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">未読メッセージ</p>
                    <p className="text-3xl font-bold text-gray-900">{DEMO_DATA.stats.unreadMessages}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* 園児一覧 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">園児一覧</h2>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    園児追加
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChildren.map((child) => (
                    <div key={child.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{child.avatar}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{child.name}</h3>
                            <p className="text-sm text-gray-500">{child.age}歳</p>
                          </div>
                        </div>
                        {child.unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {child.unreadMessages}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">保護者:</span> {child.parentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">今日の記録:</span> {child.todayRecords}件
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">最終活動:</span> {formatTime(child.lastActivity)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => startChat(child.id)}
                          className="flex-1 bg-pink-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-all duration-200 flex items-center justify-center"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          チャット
                        </button>
                        <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all duration-200 flex items-center justify-center">
                          <Eye className="w-4 h-4 mr-1" />
                          詳細
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'management':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">園児管理</h2>
            <div className="grid grid-cols-1 gap-6">
              {DEMO_DATA.children.map((child) => (
                <div key={child.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{child.avatar}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
                        <p className="text-gray-600">{child.age}歳 • {child.gender === 'male' ? '男の子' : '女の子'}</p>
                        <p className="text-sm text-gray-500">生年月日: {child.birthdate}</p>
                        <p className="text-sm text-gray-500">保護者: {child.parentName} ({child.parentEmail})</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        <Edit className="w-4 h-4 inline mr-1" />
                        編集
                      </button>
                      <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">保護者との連絡</h1>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-pink-100 to-orange-100 px-4 py-2 rounded-2xl">
                  <span className="text-sm font-medium text-pink-600">
                    未読 {DEMO_DATA.stats.unreadMessages}件
                  </span>
                </div>
              </div>
            </div>

            {/* メッセージ一覧 */}
            <div className="space-y-4">
              {DEMO_DATA.children.map((child) => {
                const childMessages = chatMessages.filter(msg => msg.childId === child.id);
                const latestMessage = childMessages[childMessages.length - 1];
                const unreadCount = childMessages.filter(msg => msg.sender === 'parent').length;

                if (childMessages.length === 0) return null;

                return (
                  <div
                    key={child.id}
                    onClick={() => startChat(child.id)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {child.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-gray-900">{child.name}</h3>
                            <span className="text-sm text-gray-500">({child.age}歳)</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">保護者: {child.parentName}</p>
                          {latestMessage && (
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${latestMessage.sender === 'parent' ? 'bg-blue-400' : 'bg-orange-400'
                                }`}></span>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {latestMessage.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {latestMessage && (
                          <p className="text-xs text-gray-400 mb-2">
                            {formatTime(latestMessage.timestamp)}
                          </p>
                        )}
                        {unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* メッセージがない場合 */}
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">まだメッセージがありません</h3>
                  <p className="text-gray-500 text-sm">
                    保護者からのメッセージがここに表示されます
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'calendar':
        return <CalendarView />;

      default:
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{sidebarItems.find(item => item.id === currentView)?.label}</h2>
            <p className="text-gray-600">この機能は準備中です</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 z-50">
        {/* ロゴ */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">今日のできた</h1>
              <p className="text-xs text-gray-500">管理者画面</p>
            </div>
          </div>
        </div>

        {/* 事業所情報 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.facility.name}</p>
              <p className="text-sm text-gray-500">{user.facility.adminName}</p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-700 border border-pink-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ログアウト */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">ログアウト</span>
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="ml-72">
        {/* ヘッダー */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              {sidebarItems.find(item => item.id === currentView)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="園児を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all duration-200"
              />
            </div>
            {/* 通知ベル */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <Bell className="w-5 h-5" />
              {DEMO_DATA.stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {DEMO_DATA.stats.unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="p-8">
          {renderMainContent()}
        </div>
      </div>

      {/* 園児追加モーダル */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">園児追加</h3>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                  placeholder="山田花子"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">生年月日</label>
                <input
                  type="date"
                  value={newChild.birthdate}
                  onChange={(e) => setNewChild({ ...newChild, birthdate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                <select
                  value={newChild.gender}
                  onChange={(e) => setNewChild({ ...newChild, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                >
                  <option value="female">女の子</option>
                  <option value="male">男の子</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">保護者名</label>
                <input
                  type="text"
                  value={newChild.parentName}
                  onChange={(e) => setNewChild({ ...newChild, parentName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                  placeholder="山田一郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                <input
                  type="email"
                  value={newChild.parentEmail}
                  onChange={(e) => setNewChild({ ...newChild, parentEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                  placeholder="yamada@example.com"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddChild}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 rounded-2xl font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チャットモーダル */}
      {chatChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* チャットヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {DEMO_DATA.children.find(c => c.id === chatChild)?.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {DEMO_DATA.children.find(c => c.id === chatChild)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    保護者: {DEMO_DATA.children.find(c => c.id === chatChild)?.parentName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-400">オンライン</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatChild(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* チャットメッセージ */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages
                .filter(msg => msg.childId === chatChild)
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs">
                      <div
                        className={`px-4 py-3 rounded-2xl ${message.sender === 'admin'
                          ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-br-md'
                          : 'bg-blue-50 border border-blue-200 text-gray-900 rounded-bl-md'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1">
                        <p className={`text-xs ${message.sender === 'admin' ? 'text-gray-400' : 'text-blue-600'}`}>
                          {message.senderName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* メッセージ入力 */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`${DEMO_DATA.children.find(c => c.id === chatChild)?.parentName}さんにメッセージを送信...`}
                  className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-2xl hover:from-pink-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* 送信者情報 */}
              <div className="flex items-center space-x-2 mt-3 px-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">管</span>
                </div>
                <span className="text-xs text-gray-500">管理者として送信</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;