import React, { useState, useEffect } from 'react';
import { Award, Smile, X, AlertTriangle, User, Users, Settings, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { RecordProvider, useRecord, RecordCategory } from './context/RecordContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RecordButton from './components/RecordButton';
import GrowthRecords from './components/GrowthRecords';
import { compressImage } from './utils/imageUtils';

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

// 性別に応じて適切な敬称を返す関数
const getChildSuffix = (gender?: 'male' | 'female'): string => {
  return gender === 'male' ? 'くん' : 'ちゃん';
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
    addRecordEvent,
    getCategoryName,
    childInfo,
    children,
    activeChildId,
    setActiveChildId,
    addChild,
    updateChildInfo,
    removeChild
  } = useRecord();
  const { user, logout, updateUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'record' | 'calendar' | 'growth'>('home');
  const [isChildSettingsOpen, setIsChildSettingsOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [childGender, setChildGender] = useState<'male' | 'female' | ''>('');
  const [childAvatarImage, setChildAvatarImage] = useState<string>('');
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [isParentSettingsOpen, setIsParentSettingsOpen] = useState(false);
  const [parentName, setParentName] = useState(user?.username || '');
  const [parentAvatarImage, setParentAvatarImage] = useState<string>(user?.avatarImage || '');

  // 編集する子供が変わったときにフォームを更新
  useEffect(() => {
    if (editChildId) {
      const childToEdit = children.find(child => child.id === editChildId);
      if (childToEdit) {
        setChildName(childToEdit.name);
        setChildBirthdate(childToEdit.birthdate || '');
        setChildGender(childToEdit.gender || '');
        setChildAvatarImage(childToEdit.avatarImage || '');
      }
    } else {
      // 新規追加の場合はフォームをクリア
      setChildName('');
      setChildBirthdate('');
      setChildGender('');
      setChildAvatarImage('');
    }
  }, [editChildId, children]);

  // 記録データのステート
  const [todayRecords, setTodayRecords] = useState<RecordEntry[]>([]);

  // 記録モーダルの状態を追加
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordNote, setRecordNote] = useState('');
  const [recordError, setRecordError] = useState('');

  // カテゴリー選択と同時に記録モーダルを開く関数
  const handleCategorySelect = (category: RecordCategory) => {
    setActiveCategory(category);
    setShowRecordModal(true);
    setRecordNote('');
    setRecordError('');
  };

  // 記録を実行する関数
  const handleRecordSubmit = () => {
    if (!recordNote.trim()) {
      setRecordError('内容を入力してください');
      return;
    }

    // 記録を追加
    const newRecord: RecordEntry = {
      id: Date.now().toString(),
      date: new Date(),
      content: recordNote,
      category: activeCategory,
      createdAt: new Date()
    };

    setTodayRecords(prev => [newRecord, ...prev]);

    // アニメーション実行
    addRecordEvent(activeCategory, recordNote);

    // モーダルを閉じる
    setShowRecordModal(false);
    setRecordNote('');
    setRecordError('');
  };

  // 画像をBase64エンコードする関数
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 画像を圧縮してBase64エンコード
        const compressedImage = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeKB: 300 // 300KB以下に制限
        });
        setChildAvatarImage(compressedImage);
      } catch (error) {
        console.error('画像の処理に失敗しました:', error);
        alert('画像の処理に失敗しました。別の画像を試してください。');
      }
    }
  };

  // 保護者の画像をBase64エンコードする関数
  const handleParentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 画像を圧縮してBase64エンコード
        const compressedImage = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeKB: 300 // 300KB以下に制限
        });
        setParentAvatarImage(compressedImage);
      } catch (error) {
        console.error('画像の処理に失敗しました:', error);
        alert('画像の処理に失敗しました。別の画像を試してください。');
      }
    }
  };

  // 子供情報を保存
  const saveChildInfo = () => {
    const age = childBirthdate ? calculateAge(childBirthdate) : 0;
    if (childName.trim() && childBirthdate && age > 0) {
      if (editChildId) {
        // 既存の子供を更新
        updateChildInfo(
          editChildId,
          childName.trim(),
          age,
          childBirthdate,
          childGender || undefined,
          childAvatarImage || undefined
        );
      } else {
        // 新しい子供を追加
        const newChildId = addChild(
          childName.trim(),
          age,
          childBirthdate,
          childGender || undefined,
          childAvatarImage || undefined
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
          <div className="flex flex-col items-center space-y-4">
            {/* ウェルカムカード - スマホ対応 */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden">
                    {user?.avatarImage ? (
                      <img
                        src={user.avatarImage}
                        alt="保護者アイコン"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👋</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">
                      おはよう、{user ? user.username : 'ママ・パパ'}さん！
                    </h2>
                    <p className="text-base text-gray-500 mt-1 leading-relaxed">
                      今日も{childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}` : 'お子さま'}と素敵な一日を過ごしましょう
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => {
                      setParentName(user?.username || '');
                      setParentAvatarImage(user?.avatarImage || '');
                      setIsParentSettingsOpen(true);
                    }}
                    className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center focus:outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="保護者設定"
                  >
                    <Settings size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {childInfo && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mr-4 overflow-hidden">
                        {childInfo.avatarImage ? (
                          <img
                            src={childInfo.avatarImage}
                            alt={`${childInfo.name}のアイコン`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{childInfo.gender === 'male' ? '👦' : '👧'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-gray-700">
                            {childInfo.name}{getChildSuffix(childInfo.gender)}（{childInfo.age}歳）
                          </p>
                          {children.length > 1 && (
                            <button
                              onClick={() => setShowChildSelector(true)}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium focus:outline-none"
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                              title="お子さまを切り替え"
                            >
                              <Users size={14} />
                              <span>切り替え</span>
                            </button>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-pink-500 mt-1">今日のできたこと</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (activeChildId) {
                            setEditChildId(activeChildId);
                            setIsChildSettingsOpen(true);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        title="お子さまの詳細設定"
                      >
                        <Settings size={16} />
                        <span>詳細</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditChildId(null);
                          setIsChildSettingsOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        title="お子さまを追加"
                      >
                        <PlusCircle size={16} />
                        <span>追加</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 今日の記録サマリー - スマホ対応 */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800">📅 今日の記録</h3>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
                  {formattedDate}
                </div>
              </div>

              {hasRecords ? (
                <div className="space-y-4">
                  {todaysFilteredRecords.map(record => {
                    const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                    return (
                      <div key={record.id} className={`p-5 rounded-xl ${bgColor} border-l-4 ${borderColor}`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-base font-medium flex items-center gap-2 ${textColor}`}>
                            {icon}
                            {getCategoryName(record.category)}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center bg-white/60 px-3 py-1 rounded-full">
                            <Clock size={14} className="mr-1" />
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <p className="text-base text-gray-700 leading-relaxed">{record.content}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✍️</span>
                  </div>
                  <p className="text-lg text-gray-500 mb-6">今日はまだ記録がありません</p>
                  <button
                    onClick={() => setActiveTab('record')}
                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-sm min-h-12 focus:outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <PlusCircle size={20} />
                    <span>記録を始める</span>
                  </button>
                </div>
              )}

              {/* 子供情報がなければ設定を促す - スマホ対応 */}
              {!childInfo && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">👶</span>
                    <p className="text-base text-blue-700 font-medium">お子さまの情報を登録しませんか？</p>
                  </div>
                  <p className="text-sm text-blue-600 mb-4">記録がより便利で楽しくなります！</p>
                  <button
                    onClick={() => {
                      setEditChildId(null);
                      setIsChildSettingsOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl text-base font-medium shadow-sm min-h-12 focus:outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Settings size={18} />
                    <span>お子さまを登録する</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-full">
            {/* チャットヘッダー */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-1">
                AIチャット
              </h2>
              <p className="text-sm text-gray-600">
                {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}` : 'お子さま'}の成長について相談できます
              </p>
            </div>

            {/* チャットメッセージエリア */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {/* システムメッセージ */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-gray-800">
                        こんにちは！お子さまの成長や日々の記録について、何でもお気軽にご相談ください。
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">今</p>
                  </div>
                </div>

                {/* ユーザーメッセージの例 */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 text-right">
                    <div className="inline-block bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
                      <p className="text-sm">
                        最近よく泣いてしまうのですが、どう対応すればいいでしょうか？
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mr-4">2分前</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                </div>

                {/* AIレスポンスの例 */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-gray-800">
                        お子さまが泣いてしまう理由はいくつか考えられますね。まず、基本的な欲求（お腹が空いた、眠い、おむつが濡れているなど）をチェックしてみてください。
                        <br /><br />
                        また、環境の変化や新しい体験に対する不安も原因となることがあります。記録を見返して、泣く前の状況や時間帯にパターンがないか確認してみるのも良いでしょう。
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">1分前</p>
                  </div>
                </div>
              </div>

              {/* メッセージ入力エリア */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="メッセージを入力..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'record':
        return (
          <div className="flex flex-col items-center space-y-4">
            {/* 記録ヘッダー */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}の記録` : '今日の記録'}
                </h2>
                <p className="text-sm text-gray-500">
                  今日あったことを記録してみましょう
                </p>
              </div>
            </div>

            {/* カテゴリー選択 */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                今日あったことを記録しましょう
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                カテゴリーを選ぶとすぐに記録できます
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCategorySelect('achievement')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 bg-green-50 border-green-200 focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3 border-2 border-green-200"
                    style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <Award size={24} className="text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">できたこと</span>
                  <span className="text-xs text-gray-500 mt-1">成功・達成</span>
                </button>

                <button
                  onClick={() => handleCategorySelect('happy')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 bg-blue-50 border-blue-200 focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3 border-2 border-blue-200"
                    style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <Smile size={24} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">嬉しかったこと</span>
                  <span className="text-xs text-gray-500 mt-1">楽しい・幸せ</span>
                </button>

                <button
                  onClick={() => handleCategorySelect('failure')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 bg-amber-50 border-amber-200 focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3 border-2 border-amber-200"
                    style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <X size={24} className="text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">できなかったこと</span>
                  <span className="text-xs text-gray-500 mt-1">チャレンジ</span>
                </button>

                <button
                  onClick={() => handleCategorySelect('trouble')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 bg-red-50 border-red-200 focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3 border-2 border-red-200"
                    style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">困ったこと</span>
                  <span className="text-xs text-gray-500 mt-1">問題・悩み</span>
                </button>
              </div>
            </div>

            {/* 今日の記録一覧 */}
            {hasRecords && (
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  今日の記録一覧
                </h3>
                <div className="space-y-3">
                  {todaysFilteredRecords.map(record => {
                    const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                    return (
                      <div key={record.id} className={`p-4 rounded-xl ${bgColor} border-l-4 ${borderColor}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm font-medium flex items-center gap-2 ${textColor}`}>
                            {icon}
                            {getCategoryName(record.category)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center bg-white/60 px-2 py-1 rounded-full">
                            <Clock size={12} className="mr-1" />
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{record.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 記録モーダル */}
            {showRecordModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {getCategoryName(activeCategory)}を記録
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      今日あったことを詳しく教えてください
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        詳細内容
                      </label>
                      <textarea
                        value={recordNote}
                        onChange={(e) => {
                          setRecordNote(e.target.value);
                          if (e.target.value.trim()) setRecordError('');
                        }}
                        placeholder={`${getCategoryName(activeCategory)}の内容を詳しく記録してください`}
                        className={`w-full p-4 border rounded-2xl text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all bg-gray-50 focus:bg-white ${recordError ? 'border-red-300' : 'border-gray-200'
                          }`}
                        rows={5}
                      />
                      {recordError && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {recordError}
                      </p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowRecordModal(false);
                          setRecordError('');
                        }}
                        className="flex-1 py-3 px-4 border border-gray-300 rounded-2xl text-sm font-semibold bg-white focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleRecordSubmit}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-2xl text-sm font-semibold shadow-md focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        記録する
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'calendar':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  記録カレンダー
                </h2>
                <p className="text-sm text-gray-500">
                  {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}の記録` : 'お子さまの記録'}を振り返ることができます
                </p>
              </div>

              <CalendarView />
            </div>
          </div>
        );
      case 'growth':
        return <GrowthRecords />;
      default:
        return null;
    }
  };

  // 誕生日かどうかをチェック
  const { isBirthday } = useRecord();
  const showBirthdayEffect = childInfo && isBirthday();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 誕生日エフェクト */}
      {showBirthdayEffect && (
        <BirthdayEffect childName={childInfo!.name} childGender={childInfo!.gender} />
      )}

      {/* ヘッダー - スマホ対応の見やすいデザイン */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto max-w-md px-4 py-4 flex justify-between items-center">
          <div className="w-10 h-10"></div> {/* スペーサー要素 */}
          <h1
            className="text-xl font-bold text-gray-800 flex items-center cursor-pointer min-h-12 flex-1 justify-center focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => setShowChildSelector(true)}
          >
            <span className="text-pink-500 text-2xl">✨</span>
            <span className="mx-2">きょうのできた</span>
            {childInfo && (
              <span className="text-sm font-normal ml-1 flex items-center text-gray-600">
                (<span className="text-pink-500">{childInfo.name}{getChildSuffix(childInfo.gender)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="m6 9 6 6 6-6" />
                </svg>)
              </span>
            )}
          </h1>
          {user && (
            <button
              className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center focus:outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="ログアウト"
              title="ログアウト"
            >
              {user.avatarImage ? (
                <img
                  src={user.avatarImage}
                  alt="保護者アイコン"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-pink-600" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ - スマホ対応 */}
      <div className="container mx-auto max-w-md px-4 pt-6 pb-24 flex-1 overflow-y-auto">
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

      {/* 子供選択ダイアログ - 育児アプリ風デザイン */}
      <Dialog open={showChildSelector} onClose={() => setShowChildSelector(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-bold text-gray-800 mb-1 flex items-center">
              <span className="text-pink-500 mr-2">👶</span>
              お子さまを選択
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">記録するお子さまを選んでください</p>

            <div className="space-y-3 mb-6">
              {children.length > 0 ? (
                children.map(child => (
                  <button
                    key={child.id}
                    className={`w-full p-4 rounded-xl flex items-center justify-between focus:outline-none ${activeChildId === child.id
                      ? 'bg-pink-50 border-2 border-pink-300'
                      : 'bg-gray-50 border-2 border-transparent'
                      }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    onClick={() => {
                      setActiveChildId(child.id);
                      setShowChildSelector(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden ${child.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                        }`}>
                        {child.avatarImage ? (
                          <img
                            src={child.avatarImage}
                            alt={`${child.name}のアイコン`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {child.gender === 'male' ? '👦' : '👧'}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">{child.name}{getChildSuffix(child.gender)}</div>
                        <div className="text-sm text-gray-500">{child.age}歳</div>
                      </div>
                    </div>

                    {activeChildId === child.id && (
                      <div className="text-pink-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <span className="text-4xl mb-2 block">👶</span>
                  <p className="text-gray-500 mb-2">まだお子さまが登録されていません</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-3 text-sm font-medium text-pink-600 bg-pink-50 rounded-xl focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => {
                  setEditChildId(null);
                  setShowChildSelector(false);
                  setIsChildSettingsOpen(true);
                }}
              >
                ➕ 新しいお子さまを追加
              </button>

              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setShowChildSelector(false)}
              >
                閉じる
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 子供設定ダイアログ - 育児アプリ風デザイン */}
      <Dialog open={isChildSettingsOpen} onClose={() => setIsChildSettingsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-bold text-gray-800 mb-1 flex items-center">
              <span className="text-pink-500 mr-2">👶</span>
              {editChildId ? 'お子さま情報の編集' : '新しいお子さまを登録'}
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-6">
              {editChildId ? '情報を編集してください' : 'お子さまの基本情報を入力してください'}
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="child-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="例：たろう"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アイコン写真
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {childAvatarImage ? (
                      <img
                        src={childAvatarImage}
                        alt="アイコン"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                    >
                      📱 写真を選択
                    </label>
                    {childAvatarImage && (
                      <button
                        type="button"
                        onClick={() => setChildAvatarImage('')}
                        className="ml-2 text-sm text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  スマホのカメラフォルダーから写真を選択できます（自動で圧縮されます）
                </p>
              </div>

              {childBirthdate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢 <span className="text-xs text-gray-500 ml-2">(誕生日から自動計算)</span>
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                    {calculateAge(childBirthdate)}歳
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  誕生日
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                      value={childBirthdate ? new Date(childBirthdate).getFullYear().toString() : ''}
                      onChange={(e) => {
                        const year = e.target.value;
                        if (!year) return;
                        const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                        currentDate.setFullYear(parseInt(year));
                        const newBirthdate = currentDate.toISOString().split('T')[0];
                        setChildBirthdate(newBirthdate);
                      }}
                    >
                      <option value="">年</option>
                      {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                      value={childBirthdate ? (new Date(childBirthdate).getMonth() + 1).toString() : ''}
                      onChange={(e) => {
                        const month = e.target.value;
                        if (!month) return;
                        const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                        currentDate.setMonth(parseInt(month) - 1);
                        const newBirthdate = currentDate.toISOString().split('T')[0];
                        setChildBirthdate(newBirthdate);
                      }}
                    >
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                      value={childBirthdate ? new Date(childBirthdate).getDate().toString() : ''}
                      onChange={(e) => {
                        const day = e.target.value;
                        if (!day) return;
                        const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                        currentDate.setDate(parseInt(day));
                        const newBirthdate = currentDate.toISOString().split('T')[0];
                        setChildBirthdate(newBirthdate);
                      }}
                    >
                      <option value="">日</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  性別
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none ${childGender === 'male'
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    onClick={() => setChildGender('male')}
                  >
                    <span className="mr-2">👦</span>
                    男の子
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none ${childGender === 'female'
                      ? 'border-pink-300 bg-pink-50 text-pink-800'
                      : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    onClick={() => setChildGender('female')}
                  >
                    <span className="mr-2">👧</span>
                    女の子
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              {editChildId && (
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => {
                    if (window.confirm('本当に削除しますか？')) {
                      removeChild(editChildId);
                      setIsChildSettingsOpen(false);
                      setEditChildId(null);
                    }
                  }}
                >
                  🗑️ 削除
                </button>
              )}

              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => setIsChildSettingsOpen(false)}
                >
                  キャンセル
                </button>

                <button
                  type="button"
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-sm focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={saveChildInfo}
                >
                  {editChildId ? '保存' : '登録'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 保護者設定ダイアログ */}
      <Dialog open={isParentSettingsOpen} onClose={() => setIsParentSettingsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-bold text-gray-800 mb-1 flex items-center">
              <span className="text-blue-500 mr-2">👤</span>
              保護者設定
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-6">保護者の情報を編集してください</p>

            <div className="space-y-5">
              <div>
                <label htmlFor="parent-name" className="block text-sm font-medium text-gray-700 mb-2">
                  保護者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="parent-name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="保護者名を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アイコン写真
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {parentAvatarImage ? (
                      <img
                        src={parentAvatarImage}
                        alt="保護者アイコン"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleParentImageUpload}
                      className="hidden"
                      id="parent-avatar-upload"
                    />
                    <label
                      htmlFor="parent-avatar-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                    >
                      📱 写真を選択
                    </label>
                    {parentAvatarImage && (
                      <button
                        type="button"
                        onClick={() => setParentAvatarImage('')}
                        className="ml-2 text-sm text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  スマホのカメラフォルダーから写真を選択できます（自動で圧縮されます）
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setIsParentSettingsOpen(false)}
              >
                キャンセル
              </button>

              <button
                type="button"
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-sm focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => {
                  if (parentName.trim()) {
                    updateUser(parentName.trim(), parentAvatarImage || undefined);
                    setIsParentSettingsOpen(false);
                  }
                }}
              >
                保存
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

// 初回子供情報登録コンポーネント
function InitialChildSetup() {
  const {
    addChild,
    setActiveChildId
  } = useRecord();

  const [childName, setChildName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [childGender, setChildGender] = useState<'male' | 'female' | ''>('');
  const [childAvatarImage, setChildAvatarImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 画像をBase64エンコードする関数
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 画像を圧縮してBase64エンコード
        const compressedImage = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeKB: 300 // 300KB以下に制限
        });
        setChildAvatarImage(compressedImage);
      } catch (error) {
        console.error('画像の処理に失敗しました:', error);
        alert('画像の処理に失敗しました。別の画像を試してください。');
      }
    }
  };

  const handleSubmit = async () => {
    if (!childName.trim() || !childBirthdate || !childGender) {
      return;
    }

    setIsSubmitting(true);

    try {
      const age = calculateAge(childBirthdate);
      const newChildId = addChild(
        childName.trim(),
        age,
        childBirthdate,
        childGender,
        childAvatarImage || undefined
      );
      setActiveChildId(newChildId);
    } catch (error) {
      console.error('子供情報の登録に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = childName.trim() && childBirthdate && childGender;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">きょうのできた</h1>
          <h2 className="text-xl font-bold text-pink-500 mb-3">お子さまの情報を登録してください</h2>
          <p className="text-sm text-gray-600 mb-2">
            お子さまの成長記録を始めるために、まずは基本情報を教えてください
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
            <p className="text-xs text-blue-700 font-medium">
              💾 一度登録すると、この情報は自動的に保存されます。<br />
              次回からは毎回入力する必要がありません！
            </p>
          </div>
        </div>

        {/* 登録フォーム */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="space-y-6">
            {/* 名前 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="例：たろう"
                disabled={isSubmitting}
              />
            </div>

            {/* アイコン写真 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アイコン写真
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {childAvatarImage ? (
                    <img
                      src={childAvatarImage}
                      alt="アイコン"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">📷</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload-initial"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="avatar-upload-initial"
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${isSubmitting
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                      }`}
                  >
                    📱 写真を選択
                  </label>
                  {childAvatarImage && (
                    <button
                      type="button"
                      onClick={() => setChildAvatarImage('')}
                      className="ml-2 text-sm text-red-600 hover:text-red-800"
                      disabled={isSubmitting}
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                スマホのカメラフォルダーから写真を選択できます（自動で圧縮されます）
              </p>
            </div>

            {/* 誕生日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                誕生日 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                  value={childBirthdate ? new Date(childBirthdate).getFullYear().toString() : ''}
                  onChange={(e) => {
                    const year = e.target.value;
                    if (!year) return;
                    const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                    currentDate.setFullYear(parseInt(year));
                    const newBirthdate = currentDate.toISOString().split('T')[0];
                    setChildBirthdate(newBirthdate);
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">年</option>
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <select
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                  value={childBirthdate ? (new Date(childBirthdate).getMonth() + 1).toString() : ''}
                  onChange={(e) => {
                    const month = e.target.value;
                    if (!month) return;
                    const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                    currentDate.setMonth(parseInt(month) - 1);
                    const newBirthdate = currentDate.toISOString().split('T')[0];
                    setChildBirthdate(newBirthdate);
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>

                <select
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                  value={childBirthdate ? new Date(childBirthdate).getDate().toString() : ''}
                  onChange={(e) => {
                    const day = e.target.value;
                    if (!day) return;
                    const currentDate = childBirthdate ? new Date(childBirthdate) : new Date();
                    currentDate.setDate(parseInt(day));
                    const newBirthdate = currentDate.toISOString().split('T')[0];
                    setChildBirthdate(newBirthdate);
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 年齢表示 */}
            {childBirthdate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢 <span className="text-xs text-gray-500 ml-2">(誕生日から自動計算)</span>
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                  {calculateAge(childBirthdate)}歳
                </div>
              </div>
            )}

            {/* 性別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                性別 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none ${childGender === 'male'
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => setChildGender('male')}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">👦</span>
                  男の子
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none ${childGender === 'female'
                    ? 'border-pink-300 bg-pink-50 text-pink-800'
                    : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => setChildGender('female')}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">👧</span>
                  女の子
                </button>
              </div>
            </div>
          </div>

          {/* 登録ボタン */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl text-lg font-medium shadow-sm focus:outline-none ${isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isSubmitting ? '情報を保存中...' : '情報を保存して始める'}
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            登録後、いつでも設定から情報を変更できます
          </p>
        </div>
      </div>
    </div>
  );
}

// ログイン後の状態管理コンポーネント
function AuthenticatedApp() {
  const { children } = useRecord();
  const hasChildren = children.length > 0;

  // 子供情報が未登録の場合は初回セットアップ画面を表示
  if (!hasChildren) {
    return <InitialChildSetup />;
  }

  // 子供情報がある場合は通常のアプリ画面を表示
  return <AppContent />;
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
      <AuthenticatedApp />
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