import React, { useState, useEffect, useRef } from 'react';
import { Award, Smile, X, AlertTriangle, User, Users, Settings, Clock, PlusCircle, AlertCircle, HelpCircle, Trash2, Send, MessageSquare, Plus, History, MoreVertical } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { RecordProvider, useRecord, RecordCategory } from './context/RecordContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RecordButton from './components/RecordButton';
import GrowthRecords from './components/GrowthRecords';
import { compressImage } from './utils/imageUtils';

import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import BottomNavigationBar from './components/BottomNavigationBar';
import CalendarView from './components/CalendarView';
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

// 記録データの型定義はRecordContextから使用

// チャットメッセージの型定義
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  childId: string;
}

// チャットセッションの型定義
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  childId: string;
  createdAt: string;
  updatedAt: string;
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
    removeChild,
    deleteRecordEvent,
    todayEvents
  } = useRecord();
  const { user, logout, updateUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // 編集する子供が変わったときにフォームを更新
  useEffect(() => {
    console.log('👶 子供編集フォーム更新:', { editChildId, childrenCount: children.length });
    if (editChildId) {
      const childToEdit = children.find(child => child.id === editChildId);
      console.log('👶 編集対象の子供:', childToEdit);
      if (childToEdit) {
        setChildName(childToEdit.name);
        setChildBirthdate(childToEdit.birthdate || '');
        setChildGender(childToEdit.gender || '');
        setChildAvatarImage(childToEdit.avatarImage || '');
        console.log('👶 フォームに設定された情報:', {
          name: childToEdit.name,
          birthdate: childToEdit.birthdate,
          gender: childToEdit.gender,
          hasAvatar: !!childToEdit.avatarImage
        });
      }
    } else {
      // 新規追加の場合はフォームをクリア
      setChildName('');
      setChildBirthdate('');
      setChildGender('');
      setChildAvatarImage('');
      console.log('👶 フォームをクリア');
    }
  }, [editChildId, children]);

  // アクティブな子供が変更されたときにチャット履歴を読み込む
  useEffect(() => {
    if (user && activeChildId) {
      loadChatSessions();
    }
  }, [user, activeChildId]);

  // チャットセッション履歴をローカルストレージから読み込む
  const loadChatSessions = () => {
    if (!user || !activeChildId) return;

    try {
      const savedSessions = localStorage.getItem(`chatSessions_${user.id}_${activeChildId}`);
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        setChatSessions(sessions);
        // 最新のセッションを選択
        if (sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
        } else {
          setCurrentSessionId(null);
        }
      } else {
        // 初回の場合は空の状態にする
        setChatSessions([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('チャットセッション履歴の読み込みエラー:', error);
    }
  };

  // チャットセッション履歴をローカルストレージに保存
  const saveChatSessions = (sessions: ChatSession[]) => {
    if (!user || !activeChildId) return;

    try {
      localStorage.setItem(`chatSessions_${user.id}_${activeChildId}`, JSON.stringify(sessions));
    } catch (error) {
      console.error('チャットセッション履歴の保存エラー:', error);
    }
  };

  // 新しいチャットセッションを作成（テーマ選択画面に戻る）
  const createNewChatSession = () => {
    if (!user || !activeChildId) return;

    // セッションIDをnullに設定してテーマボタンを表示
    setCurrentSessionId(null);
  };

  // テーマ別チャットセッションを作成
  const createThematicChatSession = (theme: 'development' | 'behavior' | 'concerns') => {
    if (!user || !activeChildId) return;

    const childName = childInfo?.name || 'お子さま';
    const suffix = getChildSuffix(childInfo?.gender);
    const age = childInfo?.age || '';

    const themeMessages = {
      development: {
        title: '発達について相談',
        content: `こんにちは！私は子育て支援の専門家です。\n\n${age}歳の${childName}${suffix}の発達について、最近気になることはありますか？\n\n言葉、運動、コミュニケーション、どんなことでも構いません。具体的な様子を教えてください。`
      },
      behavior: {
        title: '行動について相談',
        content: `こんにちは！私は子育て支援の専門家です。\n\n${childName}${suffix}の行動について、最近気になることはありますか？\n\n食事、睡眠、遊び、お友達との関わりなど、どんなことでも構いません。詳しく教えてください。`
      },
      concerns: {
        title: '育児の悩み相談',
        content: `こんにちは！私は子育て支援の専門家です。\n\n${childName}${suffix}との日々の生活で困っていることや、不安に思うことがあれば、遠慮なくお聞かせください。\n\n一緒に解決策を考えましょう。`
      }
    };

    const selectedTheme = themeMessages[theme];
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      content: selectedTheme.content,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      childId: activeChildId
    };

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: selectedTheme.title,
      messages: [welcomeMessage],
      childId: activeChildId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    saveChatSessions(updatedSessions);
  };

  // 現在のセッションを取得
  const getCurrentSession = (): ChatSession | null => {
    return chatSessions.find(session => session.id === currentSessionId) || null;
  };

  // セッションのタイトルを自動生成
  const generateSessionTitle = (firstUserMessage: string): string => {
    const maxLength = 20;
    if (firstUserMessage.length <= maxLength) {
      return firstUserMessage;
    }
    return firstUserMessage.substring(0, maxLength) + '...';
  };

  // チャットセッションを削除
  const deleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteSessionConfirm(true);
  };

  // セッション削除を確認
  const handleDeleteSessionConfirm = () => {
    if (sessionToDelete) {
      const updatedSessions = chatSessions.filter(session => session.id !== sessionToDelete);
      setChatSessions(updatedSessions);
      saveChatSessions(updatedSessions);

      // 削除したセッションが現在選択中の場合、別のセッションを選択
      if (currentSessionId === sessionToDelete) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
        } else {
          // 全部削除された場合は現在のセッションIDをnullに
          setCurrentSessionId(null);
        }
      }
    }
    setShowDeleteSessionConfirm(false);
    setSessionToDelete(null);
  };

  // セッション削除をキャンセル
  const handleDeleteSessionCancel = () => {
    setShowDeleteSessionConfirm(false);
    setSessionToDelete(null);
  };

  // 記録データのステートは削除（RecordContextのtodayEventsを使用）

  // メニューを閉じるためのクリックアウトサイドイベント
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // メニューまたはメニューボタンをクリックした場合は閉じない
      if (target.closest('.user-menu') || target.closest('.user-menu-button')) {
        return;
      }
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  // 記録モーダルの状態を追加
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordNote, setRecordNote] = useState('');
  const [recordError, setRecordError] = useState('');

  // 削除確認ダイアログの状態を追加
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // チャット機能の状態を追加
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // チャットの自動スクロール用のref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // チャットの自動スクロール関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // メッセージが更新されたときに自動スクロール
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (currentSession && currentSession.messages.length > 0) {
      scrollToBottom();
    }
  }, [chatSessions, currentSessionId]);

  // チャットタブを開いた時点で、セッションがない場合はテーマボタンを表示する状態にする
  useEffect(() => {
    if (activeTab === 'chat' && user && activeChildId) {
      // 現在のセッションがない場合は、currentSessionIdをnullに設定してテーマボタンを表示
      if (!currentSessionId && chatSessions.length === 0) {
        setCurrentSessionId(null);
      }
    }
  }, [activeTab, user, activeChildId, currentSessionId, chatSessions.length]);

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

    // アニメーション実行（RecordContextで管理）
    addRecordEvent(activeCategory, recordNote);

    // モーダルを閉じる
    setShowRecordModal(false);
    setRecordNote('');
    setRecordError('');
  };

  // 削除確認を開く関数
  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setShowDeleteConfirm(true);
  };

  // 削除を実行する関数
  const handleDeleteConfirm = () => {
    if (recordToDelete) {
      deleteRecordEvent(recordToDelete);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  // 削除をキャンセルする関数
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  // メッセージ送信機能
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeChildId || !user) return;

    let currentSession = getCurrentSession();
    if (!currentSession) {
      // セッションが存在しない場合は、メッセージだけの新しいセッションを作成（ウェルカムメッセージなし）
      currentSession = {
        id: Date.now().toString(),
        title: '新しい相談',
        messages: [], // 空の配列で開始
        childId: activeChildId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCurrentSessionId(currentSession.id);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      childId: activeChildId
    };

    const updatedMessages = [...currentSession.messages, userMessage];

    // セッションのタイトルを更新（初回のユーザーメッセージの場合）
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 1 && currentSession.messages[0].sender === 'ai') {
      updatedTitle = generateSessionTitle(userMessage.content);
    } else if (currentSession.messages.length === 0) {
      // 空のセッションの場合（通常のメッセージ送信での初回）
      updatedTitle = generateSessionTitle(userMessage.content);
    }

    const updatedSession: ChatSession = {
      ...currentSession,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    let updatedSessions;
    if (chatSessions.some(session => session.id === currentSession.id)) {
      // 既存のセッションを更新
      updatedSessions = chatSessions.map(session =>
        session.id === currentSession.id ? updatedSession : session
      );
    } else {
      // 新しいセッションを追加
      updatedSessions = [updatedSession, ...chatSessions];
    }

    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    setCurrentMessage('');
    setIsAiThinking(true);

    // AI応答を生成（実際のGemini API使用）
    (async () => {
      try {
        const aiResponseText = await generateAiResponse(userMessage.content, updatedSession.messages);

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponseText,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          childId: activeChildId
        };

        const finalMessages = [...updatedMessages, aiResponse];
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        };

        let finalSessions;
        if (chatSessions.some(session => session.id === currentSession.id)) {
          // 既存のセッションを更新
          finalSessions = chatSessions.map(session =>
            session.id === currentSession.id ? finalSession : session
          );
        } else {
          // 新しいセッションを追加
          finalSessions = [finalSession, ...chatSessions];
        }

        setChatSessions(finalSessions);
        saveChatSessions(finalSessions);
      } catch (error) {
        console.error('AI応答エラー:', error);
        // エラー時はフォールバック応答
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'すみません、少し調子が悪いようです。もう一度お話を聞かせていただけますか？',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          childId: activeChildId
        };

        const finalMessages = [...updatedMessages, aiResponse];
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        };

        let finalSessions;
        if (chatSessions.some(session => session.id === currentSession.id)) {
          finalSessions = chatSessions.map(session =>
            session.id === currentSession.id ? finalSession : session
          );
        } else {
          finalSessions = [finalSession, ...chatSessions];
        }

        setChatSessions(finalSessions);
        saveChatSessions(finalSessions);
      } finally {
        setIsAiThinking(false);
      }
    })();
  };

  // Google Gemini AI インスタンス
  const ai = new GoogleGenAI({
    apiKey: 'AIzaSyBW0cLo-OZbPYqNVBFXMbB41-0qC5Q2nuk'
  });

  // AI応答を生成（実際のGemini API使用）
  const generateAiResponse = async (userMessage: string, conversationHistory: ChatMessage[]): Promise<string> => {
    try {
      // 子供の情報と会話の文脈を作成
      const childName = childInfo?.name || 'お子さま';
      const childAge = childInfo?.age || '';
      const childGender = childInfo?.gender;
      const suffix = getChildSuffix(childGender);

      // 現在のセッションのタイトルから相談テーマを判定
      const currentSession = getCurrentSession();
      const sessionTitle = currentSession?.title || '';

      let themeSpecificInstruction = '';
      if (sessionTitle.includes('発達について')) {
        themeSpecificInstruction = `
**発達相談の専門性:**
- 言葉の発達、運動発達、社会性の発達に詳しい
- 年齢に応じた発達の目安を知っている
- 発達の個人差について理解している
- 具体的な発達促進のアドバイスを提供する`;
      } else if (sessionTitle.includes('行動について')) {
        themeSpecificInstruction = `
**行動相談の専門性:**
- 食事、睡眠、遊びの習慣に詳しい
- 年齢に応じた行動パターンを理解している
- 行動改善の具体的な方法を提案する
- 友達関係や社会性について専門的な知識を持つ`;
      } else if (sessionTitle.includes('育児の悩み')) {
        themeSpecificInstruction = `
**育児相談の専門性:**
- 保護者の心理的サポートに長けている
- 具体的な育児の困りごとの解決策を提案する
- 家族全体の生活バランスについて考慮する
- 保護者の負担軽減を重視する`;
      }

      // 会話履歴を文字列に変換
      const historyContext = conversationHistory
        .slice(-6) // 最新の6つのメッセージのみ使用
        .map(msg => `${msg.sender === 'user' ? '保護者' : 'AI先生'}: ${msg.content}`)
        .join('\n');

      const prompt = `あなたは子育て支援の専門家です。保護者と${childName}${suffix}（${childAge}歳）について相談を受けています。

**あなたの役割:**
- 温かく親身になって話を聞く子育て相談の専門家
- 積極的にヒアリングして詳細を聞き出す
- 具体的で実践的なアドバイスを提供
- 保護者の気持ちに共感し、励ます

${themeSpecificInstruction}

**会話の方針:**
- 必ず質問を含める（2-3個の具体的な質問）
- 150文字以内で簡潔に
- 子供の名前を使って親しみやすく
- 保護者の観察力を褒める
- 成長の兆候を一緒に見つける

**これまでの会話:**
${historyContext}

**保護者の最新メッセージ:**
${userMessage}

上記を踏まえて、温かく共感的で、具体的な質問を含む返答をしてください。`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        }
      });

      return response.text || 'お話を聞かせていただき、ありがとうございます。もう少し詳しく教えていただけますか？';

    } catch (error) {
      console.error('AI応答生成エラー:', error);
      // フォールバック応答
      const fallbackResponses = [
        `なるほど、詳しく教えていただいてありがとうございます。その時の${childInfo?.name}${getChildSuffix(childInfo?.gender)}の表情や反応はどうでしたか？`,
        `そうですね、よく観察されていますね。その場面で、${childInfo?.name}${getChildSuffix(childInfo?.gender)}は何か特別な様子を見せていましたか？`,
        `興味深いお話ですね。その出来事の前後で、何か変化はありましたか？例えば、食事や睡眠、遊び方などで気づいたことがあれば聞かせてください。`
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  // メッセージ送信のキーボードイベント
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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



  // 子供情報を保存
  const saveChildInfo = async () => {
    const age = childBirthdate ? calculateAge(childBirthdate) : 0;
    if (childName.trim() && childBirthdate && age > 0) {
      if (editChildId) {
        // 既存の子供を更新
        await updateChildInfo(
          editChildId,
          childName.trim(),
          age,
          childBirthdate,
          childGender || undefined,
          childAvatarImage || undefined
        );
      } else {
        // 新しい子供を追加
        const newChildId = await addChild(
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

  // 今日の記録はRecordContextのtodayEventsを使用（フィルタリング済み）

  // 現在の日付を取得
  const today = new Date();
  const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 今日の記録
  const todaysFilteredRecords = todayEvents;
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
          icon: <HelpCircle size={16} className="text-amber-600" />,
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
            {/* 今日のできたことヘッダー */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {childInfo && (
                <div>
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
                        </div>
                        <h3 className="text-xl font-bold text-pink-500 mt-1">今日のできたこと</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('👶 編集ボタンクリック:', { activeChildId, childrenCount: children.length });
                          if (activeChildId) {
                            const childToEdit = children.find(child => child.id === activeChildId);
                            console.log('👶 編集対象の子供詳細:', childToEdit);
                            setEditChildId(activeChildId);
                            setIsChildSettingsOpen(true);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        title="お子さまの情報を編集"
                      >
                        <Settings size={16} />
                        <span>編集</span>
                      </button>
                      {children.length > 1 && (
                        <button
                          onClick={() => setShowChildSelector(true)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium focus:outline-none"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          title="お子さまを切り替え"
                        >
                          <Users size={16} />
                          <span>切り替え</span>
                        </button>
                      )}
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 flex items-center bg-white/60 px-3 py-1 rounded-full">
                              <Clock size={14} className="mr-1" />
                              {formatTime(new Date(record.timestamp))}
                            </span>
                            <button
                              onClick={() => handleDeleteClick(record.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                              title="この記録を削除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-base text-gray-700 leading-relaxed">{record.note}</p>
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
          <div className="flex flex-col items-center space-y-4">
            {/* 先生相談ヘッダー */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  先生に相談
                </h2>
                <p className="text-sm text-gray-500">
                  {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}` : 'お子さま'}の発達や子育てについて、専門的なアドバイスを受けられます
                </p>
              </div>
            </div>

            {/* チャットヘッダー */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <History size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    履歴
                  </span>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                  {getCurrentSession()?.title || '新しい相談'}
                </h3>
              </div>
              <button
                onClick={createNewChatSession}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                title="新しい話をする"
              >
                <Plus size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">新しい話</span>
              </button>
            </div>

            {/* チャット履歴（折りたたみ可能） */}
            {showChatHistory && (
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">チャット履歴</h4>
                <div className="space-y-2">
                  {chatSessions.length > 0 ? (
                    chatSessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg transition-colors ${session.id === currentSessionId
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => {
                              setCurrentSessionId(session.id);
                              setShowChatHistory(false);
                            }}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {session.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(new Date(session.updatedAt))}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors text-red-500 hover:text-red-700"
                            title="この履歴を削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <History size={20} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        まだチャット履歴がありません
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* チャットメッセージエリア */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[450px]">
              <div className="flex-1 overflow-y-auto mb-4">
                {getCurrentSession()?.messages.map(message => (
                  <div key={message.id} className={`flex items-start space-x-3 mb-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                    {message.sender === 'ai' && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">先生</span>
                      </div>
                    )}

                    <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl max-w-xs lg:max-w-md ${message.sender === 'ai'
                        ? 'bg-purple-50 border border-purple-200 rounded-tl-md text-gray-800'
                        : 'bg-orange-500 text-white rounded-tr-md'
                        }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                      <p className={`text-xs text-gray-500 mt-2 ${message.sender === 'user' ? 'mr-4' : 'ml-4'}`}>
                        {formatTime(new Date(message.timestamp))}
                      </p>
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {!getCurrentSession() && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">どのようなことでご相談ですか？</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          テーマを選んでご相談を始めましょう
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => createThematicChatSession('development')}
                          className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-left transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">発達</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">発達について相談</h4>
                              <p className="text-sm text-gray-600">言葉、運動、成長の様子など</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => createThematicChatSession('behavior')}
                          className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 text-left transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">行動</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">行動について相談</h4>
                              <p className="text-sm text-gray-600">食事、睡眠、遊び、友達関係など</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => createThematicChatSession('concerns')}
                          className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-4 text-left transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">悩み</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">育児の悩み相談</h4>
                              <p className="text-sm text-gray-600">困っていることや不安なことなど</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI思考中の表示 */}
                {isAiThinking && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">先生</span>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-purple-50 border border-purple-200 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-4">考え中...</p>
                    </div>
                  </div>
                )}

                {/* 自動スクロール用の参照点 */}
                <div ref={messagesEndRef} />
              </div>

              {/* メッセージ入力エリア */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="今日の様子や気になることを教えてください..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none leading-relaxed"
                      disabled={isAiThinking}
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isAiThinking}
                    className="w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send size={18} className="text-white" />
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
                    <HelpCircle size={24} className="text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">気になったこと</span>
                  <span className="text-xs text-gray-500 mt-1">心配・疑問</span>
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 flex items-center bg-white/60 px-2 py-1 rounded-full">
                              <Clock size={12} className="mr-1" />
                              {formatTime(new Date(record.timestamp))}
                            </span>
                            <button
                              onClick={() => handleDeleteClick(record.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                              title="この記録を削除"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{record.note}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <div className="relative">
              <button
                className="user-menu-button w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center focus:outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('👤 ユーザーメニューボタンクリック:', !showUserMenu);
                  setShowUserMenu(!showUserMenu);
                }}
                aria-label="ユーザーメニュー"
                title="ユーザーメニュー"
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

              {showUserMenu && (
                <div className="user-menu absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('👤 保護者名変更ボタンクリック');
                        setParentName(user?.username || '');
                        setIsParentSettingsOpen(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 focus:outline-none flex items-center gap-3"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Settings size={16} />
                      保護者名変更
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('👤 ログアウトボタンクリック');
                        setShowLogoutConfirm(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 focus:outline-none flex items-center gap-3"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteConfirm} onClose={handleDeleteCancel} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              今日の記録を削除
            </Dialog.Title>

            <p className="text-sm text-gray-600 mb-6">
              この記録を削除してもよろしいですか？<br />
              <span className="text-xs text-gray-500">※削除された記録は復元できません</span>
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium"
                onClick={handleDeleteCancel}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium"
                onClick={handleDeleteConfirm}
              >
                削除する
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* セッション削除確認ダイアログ */}
      <Dialog open={showDeleteSessionConfirm} onClose={handleDeleteSessionCancel} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              チャット履歴を削除
            </Dialog.Title>

            <p className="text-sm text-gray-600 mb-6">
              この会話の履歴がすべて削除されます。<br />
              <span className="text-xs text-gray-500">※削除された履歴は復元できません</span>
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium"
                onClick={handleDeleteSessionCancel}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium"
                onClick={handleDeleteSessionConfirm}
              >
                削除する
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

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
              保護者名変更
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-6">保護者名を変更してください</p>

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
                    updateUser(parentName.trim(), user?.avatarImage);
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
      console.log('👶 初回設定で子供情報を保存:', {
        name: childName.trim(),
        age,
        birthdate: childBirthdate,
        gender: childGender,
        hasAvatar: !!childAvatarImage
      });
      const newChildId = await addChild(
        childName.trim(),
        age,
        childBirthdate,
        childGender,
        childAvatarImage || undefined
      );
      console.log('👶 新しい子供ID:', newChildId);
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

// データ移行確認コンポーネント
function DataMigrationPrompt() {
  const { migrateFromLocalStorage } = useRecord();
  const [isLoading, setIsLoading] = useState(false);

  const handleMigrate = async () => {
    setIsLoading(true);
    try {
      await migrateFromLocalStorage();
    } catch (error) {
      console.error('データ移行エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('dataMigrated', 'true');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">データ移行</h2>
          <p className="text-gray-600">
            以前のデータをクラウドに移行しますか？
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleMigrate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                移行中...
              </div>
            ) : (
              'データを移行する'
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            新しく始める
          </button>
        </div>
      </div>
    </div>
  );
}

// ログイン後の状態管理コンポーネント
function AuthenticatedApp() {
  const { children, isDataMigrated } = useRecord();
  const hasChildren = children.length > 0;

  // LocalStorageに既存データがあり、まだ移行していない場合は移行画面を表示
  const hasLocalData = localStorage.getItem('children') || localStorage.getItem('recordEvents');
  if (hasLocalData && !isDataMigrated) {
    return <DataMigrationPrompt />;
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 mb-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-medium text-gray-600">読み込み中...</p>
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