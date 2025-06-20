import React, { useState, useEffect } from 'react';
import { Menu, Award, Smile, X, AlertTriangle, LogOut, User, Calendar as CalendarIcon, PlusCircle, Clock, Settings, Users } from 'lucide-react';
import { RecordProvider, useRecord, RecordCategory } from './context/RecordContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RecordButton from './components/RecordButton';
import BarGraph from './components/BarGraph';
import RecordHistory from './components/RecordHistory';
import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import BottomNavigationBar from './components/BottomNavigationBar';
import CalendarView from './components/CalendarView';
import BirthdayEffect from './components/BirthdayEffect';
import { Dialog } from '@headlessui/react';

// 生年月日から年齢を計算する関数
const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0;

  const today = new Date();
  const birthdateObj = new Date(birthdate);

  let age = today.getFullYear() - birthdateObj.getFullYear();

  // 誕生日がまだ来ていない場合は1引く
  const monthDiff = today.getMonth() - birthdateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
    age--;
  }

  return age;
};

// 記録データの型定義
interface RecordEntry {
  id: string;
  date: Date;
  content: string;
  category: RecordCategory;
  createdAt: Date;
}

function AppContent() {
  const {
    activeCategory,
    setActiveCategory,
    getCategoryName,
    childInfo,
    children,
    activeChildId,
    setActiveChildId,
    addChild,
    updateChildInfo,
    removeChild
  } = useRecord();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'record' | 'calendar' | 'graph'>('home');
  const [isChildSettingsOpen, setIsChildSettingsOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [childGender, setChildGender] = useState<'male' | 'female' | ''>('');
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showChildSettings, setShowChildSettings] = useState(false);

  // 編集する子供が変わったときにフォームを更新
  useEffect(() => {
    if (editChildId) {
      const childToEdit = children.find(child => child.id === editChildId);
      if (childToEdit) {
        setChildName(childToEdit.name);
        setChildAge(childToEdit.age.toString());
        setChildBirthdate(childToEdit.birthdate || '');
        setChildGender(childToEdit.gender || '');
      }
    } else {
      // 新規追加の場合はフォームをクリア
      setChildName('');
      setChildAge('');
      setChildBirthdate('');
      setChildGender('');
    }
  }, [editChildId, children]);

  // 記録データのステート
  const [todayRecords, setTodayRecords] = useState<RecordEntry[]>([]);

  // 記録を追加する関数
  const addRecord = (content: string) => {
    const newRecord: RecordEntry = {
      id: Date.now().toString(),
      date: new Date(),
      content,
      category: activeCategory,
      createdAt: new Date()
    };

    setTodayRecords(prev => [newRecord, ...prev]);
  };

  // 子供情報を保存
  const saveChildInfo = () => {
    const age = parseInt(childAge);
    if (childName.trim() && !isNaN(age) && age > 0) {
      if (editChildId) {
        // 既存の子供を更新
        updateChildInfo(
          editChildId,
          childName.trim(),
          age,
          childBirthdate,
          childGender || undefined
        );
      } else {
        // 新しい子供を追加
        const newChildId = addChild(
          childName.trim(),
          age,
          childBirthdate,
          childGender || undefined
        );
        // 新しい子供を選択状態にする
        setActiveChildId(newChildId);
      }

      setIsChildSettingsOpen(false);
      setEditChildId(null);
    }
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

  // カテゴリーに対応するアイコンとカラーを取得
  const getCategoryIconAndColor = (category: RecordCategory): { icon: React.ReactNode, bgColor: string, borderColor: string, textColor: string } => {
    switch (category) {
      case 'achievement':
        return {
          icon: <Award size={16} className="text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-400',
          textColor: 'text-emerald-600'
        };
      case 'happy':
        return {
          icon: <Smile size={16} className="text-sky-600" />,
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-400',
          textColor: 'text-sky-600'
        };
      case 'failure':
        return {
          icon: <X size={16} className="text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-400',
          textColor: 'text-amber-600'
        };
      case 'trouble':
        return {
          icon: <AlertTriangle size={16} className="text-rose-600" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-400',
          textColor: 'text-rose-600'
        };
      default:
        return {
          icon: <Award size={16} />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-600'
        };
    }
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
                <div>
                  <button
                    onClick={() => {
                      if (activeChildId) {
                        // 現在選択中の子供を編集
                        setEditChildId(activeChildId);
                        setIsChildSettingsOpen(true);
                      } else {
                        // 子供の追加
                        setEditChildId(null);
                        setIsChildSettingsOpen(true);
                      }
                    }}
                    className="text-orange-500 hover:text-orange-600"
                    title="お子さま情報の設定"
                  >
                    <Settings size={18} />
                  </button>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formattedDate}
                  </div>
                </div>
              </div>

              {childInfo && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center mr-2">
                      <Users size={16} className="text-sky-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {childInfo.name}ちゃん ({childInfo.age}歳)の
                      </p>
                      <h3 className="text-lg font-bold text-orange-500">きょうのできた</h3>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 記録サマリー */}
            <div className="w-full bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-gray-800 mb-3">今日の記録</h3>

              {hasRecords ? (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  {todaysFilteredRecords.map(record => {
                    const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                    return (
                      <div key={record.id} className={`p-3 rounded-lg ${bgColor} border-l-4 ${borderColor}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-medium flex items-center gap-1 ${textColor}`}>
                            {icon}
                            {getCategoryName(record.category)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{record.content}</p>
                      </div>
                    );
                  })}
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

              {/* 子供情報がなければ設定を促す */}
              {!childInfo && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">お子さまの情報を設定すると、記録がより便利になります！</p>
                  <button
                    onClick={() => {
                      setEditChildId(null);
                      setIsChildSettingsOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium"
                  >
                    <Settings size={14} />
                    <span>お子さまを登録する</span>
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
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setActiveCategory('achievement')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeCategory === 'achievement'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <Award size={14} />
                    <span>できたこと</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('happy')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeCategory === 'happy'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <Smile size={14} />
                    <span>嬉しかったこと</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('failure')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeCategory === 'failure'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <X size={14} />
                    <span>できなかったこと</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('trouble')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeCategory === 'trouble'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                  >
                    <AlertTriangle size={14} />
                    <span>困ったこと</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center mb-5">
                <RecordButton onSubmit={addRecord} />
              </div>

              {/* 今日の記録一覧 */}
              {hasRecords && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">今日の記録一覧</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    {todaysFilteredRecords.map(record => {
                      const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                      return (
                        <div key={record.id} className={`p-3 rounded-lg ${bgColor} border-l-4 ${borderColor}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-medium flex items-center gap-1 ${textColor}`}>
                              {icon}
                              {getCategoryName(record.category)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {formatTime(record.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{record.content}</p>
                        </div>
                      );
                    })}
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

              <CalendarView />
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

              <BarGraph />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 誕生日かどうかをチェック
  const showBirthdayEffect = childInfo && useRecord().isBirthday();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-400 flex flex-col">
      {/* 誕生日エフェクト */}
      {showBirthdayEffect && (
        <BirthdayEffect childName={childInfo!.name} />
      )}

      {/* ヘッダー - 固定スタイリング修正 */}
      <header className="sticky top-0 z-50 bg-orange-500 shadow-sm">
        <div className="container mx-auto max-w-md px-4 py-2 flex justify-between items-center">
          <div className="w-8 h-8"></div> {/* スペーサー要素 */}
          <h1
            className="text-xl font-bold text-white flex items-center cursor-pointer"
            onClick={() => setShowChildSelector(true)}
          >
            きょうのできた
            {childInfo && (
              <span className="text-xs font-normal ml-1 flex items-center">
                (<span>{childInfo.name}ちゃん</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="m6 9 6 6 6-6" />
                </svg>)
              </span>
            )}
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
      <div className="container mx-auto max-w-md px-4 pt-4 pb-20 flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* 下部ナビゲーション */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ログアウト確認ダイアログ */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
      />

      {/* 子供選択ダイアログ */}
      <Dialog open={showChildSelector} onClose={() => setShowChildSelector(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users size={18} className="mr-2 text-orange-500" />
              お子さまを選択
            </Dialog.Title>

            <div className="space-y-3 mb-6">
              {children.length > 0 ? (
                children.map(child => (
                  <button
                    key={child.id}
                    className={`w-full p-3 rounded-lg flex items-center justify-between ${activeChildId === child.id
                      ? 'bg-orange-50 border border-orange-300'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      setActiveChildId(child.id);
                      setShowChildSelector(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${child.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                        }`}>
                        <Users size={18} className={`${child.gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                          }`} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">{child.name}</div>
                        <div className="text-sm text-gray-500">{child.age}歳</div>
                      </div>
                    </div>

                    {activeChildId === child.id && (
                      <div className="text-orange-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-2">まだお子さまが登録されていません</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
                onClick={() => {
                  setEditChildId(null); // 新規追加モード
                  setShowChildSelector(false);
                  setIsChildSettingsOpen(true);
                }}
              >
                新しいお子さまを追加
              </button>

              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                onClick={() => setShowChildSelector(false)}
              >
                閉じる
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 子供設定ダイアログ */}
      <Dialog open={isChildSettingsOpen} onClose={() => setIsChildSettingsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users size={18} className="mr-2 text-orange-500" />
              {editChildId ? 'お子さま情報の編集' : '新しいお子さまを登録'}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label htmlFor="child-name" className="block text-xs font-medium text-gray-700 mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="child-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="例：たろう"
                />
              </div>

              <div>
                <label htmlFor="child-age" className="block text-xs font-medium text-gray-700 mb-1">
                  年齢 <span className="text-red-500">*</span>
                  {childBirthdate && (
                    <span className="text-xs text-gray-500 ml-2">(誕生日から自動計算)</span>
                  )}
                </label>
                <input
                  type="number"
                  id="child-age"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="例：5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  誕生日
                </label>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:border sm:border-gray-300 sm:rounded-md sm:overflow-hidden">
                  {/* 年選択 - モバイル最適化 */}
                  <div className="flex-1 relative">
                    <div className="block text-xs text-gray-500 pl-2 mb-1 sm:hidden">年</div>
                    <div className="border border-gray-300 rounded-md sm:border-none sm:rounded-none">
                      <select
                        className="w-full py-3 pl-4 pr-10 appearance-none bg-transparent focus:outline-none text-base"
                        value={childBirthdate ? new Date(childBirthdate).getFullYear().toString() : ''}
                        onChange={(e) => {
                          const year = e.target.value;
                          if (!year) return;
                          const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                          currentDate.setFullYear(parseInt(year));
                          const newBirthdate = currentDate.toISOString().split('T')[0];
                          setChildBirthdate(newBirthdate);
                          // 誕生日から年齢を自動計算
                          setChildAge(calculateAge(newBirthdate).toString());
                        }}
                      >
                        <option value="">年</option>
                        {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 月選択 - モバイル最適化 */}
                  <div className="flex-1 relative">
                    <div className="block text-xs text-gray-500 pl-2 mb-1 sm:hidden">月</div>
                    <div className="border border-gray-300 rounded-md sm:border-none sm:rounded-none">
                      <select
                        className="w-full py-3 pl-4 pr-10 appearance-none bg-transparent focus:outline-none text-base"
                        value={childBirthdate ? (new Date(childBirthdate).getMonth() + 1).toString() : ''}
                        onChange={(e) => {
                          const month = e.target.value;
                          if (!month) return;
                          const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                          currentDate.setMonth(parseInt(month) - 1);
                          const newBirthdate = currentDate.toISOString().split('T')[0];
                          setChildBirthdate(newBirthdate);
                          // 誕生日から年齢を自動計算
                          setChildAge(calculateAge(newBirthdate).toString());
                        }}
                      >
                        <option value="">月</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 日選択 - モバイル最適化 */}
                  <div className="flex-1 relative">
                    <div className="block text-xs text-gray-500 pl-2 mb-1 sm:hidden">日</div>
                    <div className="border border-gray-300 rounded-md sm:border-none sm:rounded-none">
                      <select
                        className="w-full py-3 pl-4 pr-10 appearance-none bg-transparent focus:outline-none text-base"
                        value={childBirthdate ? new Date(childBirthdate).getDate().toString() : ''}
                        onChange={(e) => {
                          const day = e.target.value;
                          if (!day) return;
                          const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                          currentDate.setDate(parseInt(day));
                          const newBirthdate = currentDate.toISOString().split('T')[0];
                          setChildBirthdate(newBirthdate);
                          // 誕生日から年齢を自動計算
                          setChildAge(calculateAge(newBirthdate).toString());
                        }}
                      >
                        <option value="">日</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm ${childGender === 'male'
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      onClick={() => setChildGender('male')}
                    >
                      男の子
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm ${childGender === 'female'
                        ? 'border-pink-500 bg-pink-50 text-pink-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      onClick={() => setChildGender('female')}
                    >
                      女の子
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <div>
                  {editChildId && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                      onClick={() => {
                        if (confirm('このお子さまの情報を削除してもよろしいですか？')) {
                          removeChild(editChildId);
                          setIsChildSettingsOpen(false);
                          setEditChildId(null);
                        }
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    onClick={() => {
                      setIsChildSettingsOpen(false);
                      setEditChildId(null);
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md disabled:opacity-50"
                    onClick={saveChildInfo}
                    disabled={!childName.trim() || !childAge || parseInt(childAge) <= 0}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
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
    <RecordProvider>
      <AppContent />
    </RecordProvider>
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