import React, { useState, useEffect, useRef } from 'react';
import { Award, Smile, X, AlertTriangle, User, Users, Settings, Clock, PlusCircle, AlertCircle, HelpCircle, Trash2, Send, MessageSquare, Plus, History, MoreVertical, UserCheck, TrendingUp, Heart, Bell, ChevronRight, Megaphone, LogOut, ClipboardList, Calendar } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { RecordProvider, useRecord, RecordCategory } from './context/RecordContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RecordButton from './components/RecordButton';
import GrowthRecords from './components/GrowthRecords';
import { compressImage } from './utils/imageUtils';
import { supabase, directChatApi, announcementApi } from './lib/supabase';
import { sendMessageToDify } from './lib/difyApi';

import LoginPage from './components/LoginPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import BottomNavigationBar from './components/BottomNavigationBar';
import CalendarView from './components/CalendarView';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import RecordSummary from './components/RecordSummary';
import { Dialog } from '@headlessui/react';
import { DirectChatMessage, DirectChatSession } from './types';

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

// エラーバウンダリーコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('アプリケーションエラー:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="full-screen-container bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center mobile-safe-padding">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">アプリケーションエラー</h2>
              <p className="text-gray-600 mb-4">
                アプリケーションでエラーが発生しました。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const {
    activeCategory,
    setActiveCategory,
    addRecordEvent,
    updateRecordEvent,
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
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'record' | 'calendar' | 'growth' | 'facility_records'>('home');

  // 施設からの記録関連
  const [facilityRecords, setFacilityRecords] = useState<any[]>([]);
  const [loadingFacilityRecords, setLoadingFacilityRecords] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'monthly'>('month');
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

  // 一斉メッセージ関連
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  // ダイレクトチャット関連（早期定義）
  const [chatType, setChatType] = useState<'ai' | 'direct'>('ai');
  const [directChatUnreadCount, setDirectChatUnreadCount] = useState(0);
  const [directChatSessions, setDirectChatSessions] = useState<DirectChatSession[]>([]);
  const [currentDirectSession, setCurrentDirectSession] = useState<string | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [isMarkingDirectChatRead, setIsMarkingDirectChatRead] = useState(false);

  // 施設からの出席記録を取得
  const loadFacilityRecords = async () => {
    if (!user?.id || !activeChildId) {
      setFacilityRecords([]);
      return;
    }

    setLoadingFacilityRecords(true);
    try {
      console.log('🔍 施設の出席記録を取得中...', { user_id: user.id, child_id: activeChildId });

      console.log('📊 クエリパラメータ:', {
        child_id: activeChildId,
        attendance_status: 'present'
      });

      const { data, error } = await supabase
        .from('attendance_schedules')
        .select('*')
        .eq('child_id', activeChildId)
        .eq('attendance_status', 'present') // 出席記録のみを表示（予定は除外）
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ 施設記録取得エラー:', error);
        setFacilityRecords([]);
        return;
      }

      console.log(`✅ 施設記録取得成功: ${data?.length || 0}件`);
      console.log('📋 取得したデータ:', data);
      setFacilityRecords(data || []);
    } catch (error) {
      console.error('❌ 施設記録取得エラー:', error);
      setFacilityRecords([]);
    } finally {
      setLoadingFacilityRecords(false);
    }
  };

  // 一斉メッセージを取得
  const loadAnnouncements = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await announcementApi.getAnnouncements(user.id);
      if (error) {
        console.error('お知らせ取得エラー:', error);
        return;
      }
      setAnnouncements(data || []);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    }
  };

  // 未読メッセージ数を取得
  const loadUnreadAnnouncementsCount = async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await announcementApi.getUnreadAnnouncementsCount(user.id);
      if (error) {
        console.error('未読お知らせ数取得エラー:', error);
        return;
      }
      setUnreadAnnouncementsCount(count || 0);
    } catch (error) {
      console.error('未読お知らせ数取得エラー:', error);
    }
  };

  // お知らせを既読にする
  const markAnnouncementAsRead = async (announcementId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await announcementApi.markAnnouncementAsRead(announcementId, user.id);
      if (error) {
        console.error('既読状態更新エラー:', error);
        return;
      }
      // 未読数を再取得
      await loadUnreadAnnouncementsCount();
    } catch (error) {
      console.error('既読状態更新エラー:', error);
    }
  };

  // お知らせ詳細を表示
  const showAnnouncementDetail = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
    // 既読にする
    markAnnouncementAsRead(announcement.id);
  };

  // ダイレクトチャットの未読数を取得
  const loadDirectChatUnreadCount = async () => {
    if (!user?.id || !activeChildId || !currentDirectSession) {
      setDirectChatUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await directChatApi.getUnreadCount(currentDirectSession, user.id);
      if (error) {
        console.error('ダイレクトチャット未読数取得エラー:', error);
        return;
      }
      setDirectChatUnreadCount(count || 0);
    } catch (error) {
      console.error('ダイレクトチャット未読数取得エラー:', error);
    }
  };

  // ダイレクトチャットメッセージを既読にする
  const markDirectChatAsRead = async () => {
    if (!user?.id || !currentDirectSession || isMarkingDirectChatRead) return;

    try {
      setIsMarkingDirectChatRead(true);
      const { error } = await directChatApi.markMessagesAsRead(currentDirectSession, user.id);
      if (error) {
        console.error('ダイレクトチャット既読状態更新エラー:', error);
        return;
      }
      // 未読数を再取得
      await loadDirectChatUnreadCount();
    } catch (error) {
      console.error('ダイレクトチャット既読状態更新エラー:', error);
    } finally {
      setIsMarkingDirectChatRead(false);
    }
  };



  // 一斉メッセージを初期化時に読み込む
  useEffect(() => {
    if (user?.id) {
      loadAnnouncements();
      loadUnreadAnnouncementsCount();
    }
  }, [user?.id]);

  // 施設からの記録を読み込む
  useEffect(() => {
    if (activeTab === 'facility_records' && user?.id && activeChildId) {
      loadFacilityRecords();
    }
  }, [activeTab, user?.id, activeChildId]);

  // ダイレクトチャット未読数を取得
  useEffect(() => {
    if (user?.id && activeChildId && currentDirectSession) {
      loadDirectChatUnreadCount();
    } else {
      setDirectChatUnreadCount(0);
    }
  }, [user?.id, activeChildId, currentDirectSession]);


  // チャットタブを開いた時に既読状態にする
  useEffect(() => {
    if (activeTab === 'chat' && chatType === 'direct' && directChatUnreadCount > 0 && !isMarkingDirectChatRead) {
      markDirectChatAsRead();
    }
  }, [activeTab, chatType, directChatUnreadCount, isMarkingDirectChatRead]);

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

  // シンプルなチャットセッションを作成
  const createSimpleChatSession = async () => {
    if (!user || !activeChildId) return;

    // Dify会話IDをリセットして新しい会話を開始
    setDifyConversationId(null);

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'AI先生に相談',
      messages: [],
      childId: activeChildId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 「相談を始める」というユーザーメッセージを作成
    const initialUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '相談を始める',
      sender: 'user',
      timestamp: new Date().toISOString(),
      childId: activeChildId
    };

    // メッセージを追加してセッションを更新
    const sessionWithUserMessage: ChatSession = {
      ...newSession,
      messages: [initialUserMessage],
      updatedAt: new Date().toISOString()
    };

    const updatedSessions = [sessionWithUserMessage, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    saveChatSessions(updatedSessions);
    setIsAiThinking(true);

    // Dify APIを呼び出してAI応答を取得
    try {
      const aiResponseText = await generateAiResponse('相談を始める', sessionWithUserMessage.messages);

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        childId: activeChildId
      };

      const finalMessages = [...sessionWithUserMessage.messages, aiResponse];
      const finalSession: ChatSession = {
        ...sessionWithUserMessage,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      const finalSessions = chatSessions.map(session =>
        session.id === newSession.id ? finalSession : session
      );

      // 新しいセッションなので、配列の先頭に追加
      const finalSessionsList = [finalSession, ...chatSessions.filter(s => s.id !== newSession.id)];

      setChatSessions(finalSessionsList);
      saveChatSessions(finalSessionsList);
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

      const finalMessages = [...sessionWithUserMessage.messages, aiResponse];
      const finalSession: ChatSession = {
        ...sessionWithUserMessage,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      const finalSessionsList = [finalSession, ...chatSessions.filter(s => s.id !== newSession.id)];

      setChatSessions(finalSessionsList);
      saveChatSessions(finalSessionsList);
    } finally {
      setIsAiThinking(false);
    }
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

      // 削除したセッションが現在選択中の場合、最初の画面に戻る
      if (currentSessionId === sessionToDelete) {
        setCurrentSessionId(null);
        setShowChatHistory(false);
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

  // ホーム画面のカテゴリー別一覧表示用の状態
  const [homeActiveCategory, setHomeActiveCategory] = useState<RecordCategory | null>(null);

  // チャット機能の状態を追加
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [difyConversationId, setDifyConversationId] = useState<string | null>(null);



  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // チャットの自動スクロール関数
  const scrollToBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 直接チャット開始
  const handleStartDirectChat = async () => {
    if (!user || !activeChildId) {
      console.error('🔧 チャット開始失敗: 必要な情報が不足', {
        hasUser: !!user,
        hasActiveChildId: !!activeChildId
      });
      return;
    }

    console.log('🔧 利用者チャット開始:', {
      userId: user.id,
      username: user.username,
      activeChildId
    });

    try {
      // 会話を取得または作成
      const { data: conversation, error } = await directChatApi.getOrCreateConversation(
        activeChildId,
        user.id
      );

      console.log('🔧 会話作成結果:', {
        conversation,
        error: error?.message
      });

      if (error || !conversation) {
        console.error('会話の作成に失敗しました:', error);
        alert(`チャットの開始に失敗しました。\n\nエラー詳細:\n${error?.message || '不明なエラー'}`);
        return;
      }

      // 既存のメッセージを取得
      const { data: messages, error: msgError } = await directChatApi.getMessages(conversation.id);

      if (msgError) {
        console.error('メッセージの取得に失敗しました:', msgError);
      }

      // 新しいセッションを作成
      const newSession: DirectChatSession = {
        id: conversation.id,
        childId: activeChildId,
        participantType: 'admin',
        participantName: '園の先生',
        messages: (messages || []).map(msg => ({
          id: msg.id,
          childId: activeChildId,
          sender: msg.sender_type === 'parent' ? 'parent' : 'admin',
          senderName: msg.sender_type === 'parent' ? '保護者' : '園の先生',
          content: msg.content,
          timestamp: msg.created_at
        })),
        lastMessageTime: conversation.last_message_at || new Date().toISOString()
      };

      // セッションリストに追加（重複を避ける）
      setDirectChatSessions(prev => {
        const exists = prev.find(s => s.id === newSession.id);
        if (exists) {
          // 既存のセッションを更新
          return prev.map(s => s.id === newSession.id ? newSession : s);
        }
        return [...prev, newSession];
      });

      setCurrentDirectSession(conversation.id);

      // 未読数を取得
      setTimeout(() => loadDirectChatUnreadCount(), 100);
    } catch (error) {
      console.error('チャット開始エラー:', error);
      alert('チャットの開始に失敗しました。');
    }
  };

  // 直接メッセージ送信
  const handleSendDirectMessage = async () => {
    if (!directMessage.trim() || !user || !activeChildId) return;

    // セッションがない場合は自動的に作成
    if (!currentDirectSession) {
      await handleStartDirectChat();
      // セッション作成後、まだセッションがない場合は処理を中止
      if (!currentDirectSession) {
        console.error('セッションの作成に失敗しました');
        return;
      }
    }

    try {
      // メッセージを送信
      const { data: savedMessage, error } = await directChatApi.sendMessage(
        currentDirectSession,
        user.id,
        'parent',
        directMessage.trim()
      );

      if (error || !savedMessage) {
        console.error('メッセージ送信エラー:', error);
        alert('メッセージの送信に失敗しました。');
        return;
      }

      // 新しいメッセージをローカルのセッションに追加
      const newMessage: DirectChatMessage = {
        id: savedMessage.id,
        childId: activeChildId,
        sender: 'parent',
        senderName: '保護者',
        content: directMessage.trim(),
        timestamp: savedMessage.created_at
      };

      setDirectChatSessions(prev =>
        prev.map(session =>
          session.id === currentDirectSession
            ? { ...session, messages: [...session.messages, newMessage], lastMessageTime: savedMessage.created_at }
            : session
        )
      );

      setDirectMessage('');

      // 未読数を更新（相手からのメッセージがある可能性があるため）
      await loadDirectChatUnreadCount();
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました。');
    }
  };

  // メッセージが更新されたときに自動スクロール
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (currentSession && currentSession.messages.length > 0) {
      // 少し遅延を入れてスクロールを実行
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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

  // ダイレクトチャットタブを開いた時に自動的にチャットを開始
  useEffect(() => {
    if (activeTab === 'chat' && chatType === 'direct' && user && activeChildId && !currentDirectSession) {
      console.log('🔧 ダイレクトチャット自動開始:', {
        activeTab,
        chatType,
        hasUser: !!user,
        hasActiveChildId: !!activeChildId,
        currentDirectSession
      });
      handleStartDirectChat();
    }
  }, [activeTab, chatType, user, activeChildId, currentDirectSession]);

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

    // AI応答を生成（Dify API使用）
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

  // チャットセッション削除機能
  const handleDeleteChatSession = (sessionId: string) => {
    // セッションリストから削除
    const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);

    // 削除したセッションが現在のセッションだった場合、セッションをクリア
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }

    // 履歴表示を閉じる
    setShowChatHistory(false);
  };

  // Google Gemini AI インスタンス
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBW0cLo-OZbPYqNVBFXMbB41-0qC5Q2nuk'
  });

  // AI応答を生成（Dify API使用）
  const generateAiResponse = async (userMessage: string, conversationHistory: ChatMessage[]): Promise<string> => {
    try {
      console.log('🔌 Dify API接続開始...');
      console.log('📝 ユーザーメッセージ:', userMessage);
      console.log('🆔 会話ID:', difyConversationId);
      
      // 子供の情報を準備
      const childName = childInfo?.name || 'お子さま';
      const childAge = childInfo?.age || '';
      const childGender = childInfo?.gender || '';
      const childBirthdate = childInfo?.birthdate || '';

      // Dify APIに送信する追加の入力情報
      const additionalInputs = {
        child_name: childName,
        child_age: childAge.toString(),
        child_gender: childGender,
        child_birthdate: childBirthdate
      };

      console.log('👶 子供情報:', additionalInputs);

      // Dify APIを呼び出し
      const { answer, conversationId } = await sendMessageToDify(
        userMessage,
        difyConversationId,
        user?.id || 'anonymous',
        additionalInputs
      );

      console.log('✅ Dify APIから応答受信:', answer);
      console.log('🆔 新しい会話ID:', conversationId);

      // 会話IDを保存（次回の会話で使用）
      setDifyConversationId(conversationId);

      return answer;

    } catch (error) {
      console.error('❌ AI応答生成エラー:', error);

      // レート制限エラーの特別対応
      if (error && (error.toString().includes('Quota exceeded') || error.toString().includes('RATE_LIMIT_EXCEEDED') || error.toString().includes('429'))) {
        return `🤖 AI先生は今、他の保護者さまとお話し中です。

📞 **お急ぎの場合は「園と連絡」から直接先生へご相談ください**

⏰ AI相談は少し時間をおいてから再度お試しください。大切なお話、必ずお聞かせいただきたいと思います。`;
      }

      // 通常のエラー時フォールバック応答
      return 'お話を聞かせていただき、ありがとうございます。もう少し詳しく教えていただけますか？';
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
            {/* 園からのお知らせバナー */}
            {unreadAnnouncementsCount > 0 && (
              <div className="w-full bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl shadow-sm border border-orange-200 p-4 cursor-pointer"
                onClick={() => {
                  if (announcements.length > 0) {
                    showAnnouncementDetail(announcements[0]);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        園からお知らせが届いています
                      </p>
                      <p className="text-xs text-orange-600">
                        未読 {unreadAnnouncementsCount}件
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            )}

            {/* 今日のできたことヘッダー - シンプル版 */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              {childInfo && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mr-3 overflow-hidden">
                        {childInfo.avatarImage ? (
                          <img
                            src={childInfo.avatarImage}
                            alt={`${childInfo.name}のアイコン`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{childInfo.gender === 'male' ? '👦' : '👧'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-gray-700">
                            {childInfo.name}{getChildSuffix(childInfo.gender)}
                          </p>
                        </div>
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
                        className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium focus:outline-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        title="お子さまの情報を編集"
                      >
                        <Settings size={14} />
                        <span>編集</span>
                      </button>
                      {children.length > 1 && (
                        <button
                          onClick={() => setShowChildSelector(true)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium focus:outline-none"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          title="お子さまを切り替え"
                        >
                          <Users size={14} />
                          <span>切り替え</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 年齢表示 */}
              {childInfo && childInfo.birthdate && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🎂</span>
                    <span>{calculateAge(childInfo.birthdate)}歳</span>
                    <span>•</span>
                    <span>{childInfo.birthdate}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formattedDate}
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
                  {/* 記録を始めるボタン - 常に表示 */}
                  <div className="text-center py-4">
                    <button
                      onClick={() => setActiveTab('record')}
                      className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none min-h-12"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <PlusCircle size={20} />
                      <span>記録を追加</span>
                    </button>
                  </div>

                  {/* カテゴリー別ボタン */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={() => setHomeActiveCategory(homeActiveCategory === 'achievement' ? null : 'achievement')}
                      className={`p-3 rounded-xl text-center transition-all ${homeActiveCategory === 'achievement'
                        ? 'bg-green-100 border-2 border-green-300'
                        : 'bg-green-50 border border-green-200 hover:bg-green-100'
                        }`}
                    >
                      <div className="text-xs text-gray-600 mb-1">できた</div>
                      <div className="text-lg font-bold text-green-600">
                        {todaysFilteredRecords.filter(r => r.category === 'achievement').length}
                      </div>
                    </button>
                    <button
                      onClick={() => setHomeActiveCategory(homeActiveCategory === 'happy' ? null : 'happy')}
                      className={`p-3 rounded-xl text-center transition-all ${homeActiveCategory === 'happy'
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                      <div className="text-xs text-gray-600 mb-1">嬉しい</div>
                      <div className="text-lg font-bold text-blue-600">
                        {todaysFilteredRecords.filter(r => r.category === 'happy').length}
                      </div>
                    </button>
                    <button
                      onClick={() => setHomeActiveCategory(homeActiveCategory === 'failure' ? null : 'failure')}
                      className={`p-3 rounded-xl text-center transition-all ${homeActiveCategory === 'failure'
                        ? 'bg-amber-100 border-2 border-amber-300'
                        : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                      <div className="text-xs text-gray-600 mb-1">気になる</div>
                      <div className="text-lg font-bold text-amber-600">
                        {todaysFilteredRecords.filter(r => r.category === 'failure').length}
                      </div>
                    </button>
                    <button
                      onClick={() => setHomeActiveCategory(homeActiveCategory === 'trouble' ? null : 'trouble')}
                      className={`p-3 rounded-xl text-center transition-all ${homeActiveCategory === 'trouble'
                        ? 'bg-red-100 border-2 border-red-300'
                        : 'bg-red-50 border border-red-200 hover:bg-red-100'
                        }`}
                    >
                      <div className="text-xs text-gray-600 mb-1">困った</div>
                      <div className="text-lg font-bold text-red-600">
                        {todaysFilteredRecords.filter(r => r.category === 'trouble').length}
                      </div>
                    </button>
                  </div>

                  {/* カテゴリー別記録一覧 */}
                  {homeActiveCategory && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {getCategoryName(homeActiveCategory)} ({todaysFilteredRecords.filter(r => r.category === homeActiveCategory).length}件)
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {todaysFilteredRecords
                          .filter(record => record.category === homeActiveCategory)
                          .map(record => {
                            const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                            return (
                              <div key={record.id} className={`p-4 rounded-xl ${bgColor} border-l-4 ${borderColor}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full ${bgColor.replace('bg-', 'bg-').replace('-50', '-100')} flex items-center justify-center`}>
                                      <span className={textColor}>{icon}</span>
                                    </div>
                                    <div>
                                      <span className={`text-sm font-semibold ${textColor}`}>
                                        {getCategoryName(record.category)}
                                      </span>
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Clock size={12} />
                                        {formatTime(new Date(record.timestamp))}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteClick(record.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="削除"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed pl-10">{record.note}</p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* 全記録一覧（カテゴリーが選択されていない場合） */}
                  {!homeActiveCategory && (
                    <div className="space-y-3">
                      {todaysFilteredRecords.map(record => {
                        const { icon, bgColor, borderColor, textColor } = getCategoryIconAndColor(record.category);
                        return (
                          <div key={record.id} className={`p-4 rounded-xl ${bgColor} border-l-4 ${borderColor}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full ${bgColor.replace('bg-', 'bg-').replace('-50', '-100')} flex items-center justify-center`}>
                                  <span className={textColor}>{icon}</span>
                                </div>
                                <div>
                                  <span className={`text-sm font-semibold ${textColor}`}>
                                    {getCategoryName(record.category)}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Clock size={12} />
                                    {formatTime(new Date(record.timestamp))}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteClick(record.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="削除"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed pl-10">{record.note}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

              {/* 子供情報がなければ管理者に連絡を促す - スマホ対応 */}
              {!childInfo && (
                <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">📞</span>
                    <p className="text-base text-orange-700 font-medium">お子さまの情報が見つかりません</p>
                  </div>
                  <p className="text-sm text-orange-600 mb-4">
                    管理者がお子さまの情報を登録する必要があります。<br />
                    施設の管理者にお問い合わせください。
                  </p>
                  <div className="text-xs text-orange-500 bg-orange-100 p-3 rounded-lg">
                    <p><strong>💡 利用可能になると：</strong></p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>お子さまの成長記録を作成できます</li>
                      <li>写真を追加・変更できます</li>
                      <li>AI先生に相談できます</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-full">
            {/* チャットタイプ選択タブ */}


            {/* チャット切り替えタブ */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-4">
              <div className="flex">
                <button
                  onClick={() => setChatType('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors ${chatType === 'ai'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium text-sm">AI先生に相談</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full ml-1">無料</span>
                </button>
                <button
                  onClick={() => setChatType('direct')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors ${chatType === 'direct'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium text-sm">園と連絡</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full ml-1">無料</span>
                </button>
              </div>
            </div>

            {/* AI相談機能 - 園との連絡と同じUI構造 */}
            {chatType === 'ai' && (
              <div className="flex flex-col flex-1 min-h-0 pb-20">
                {/* AIチャットヘッダー - 固定 */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mr-3">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">
                        AI先生に相談
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {childInfo && (
                        <div className="text-xs text-gray-400 mr-2">
                          {childInfo.name}{getChildSuffix(childInfo.gender)}について
                        </div>
                      )}
                      <button
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium focus:outline-none hover:bg-purple-100 transition-colors"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <History size={14} />
                        <span>履歴</span>
                      </button>
                      {getCurrentSession() && (
                        <button
                          onClick={() => {
                            setCurrentSessionId(null);
                            setShowChatHistory(false);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium focus:outline-none hover:bg-blue-100 transition-colors"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Plus size={14} />
                          <span>新規</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* チャット履歴表示 */}
                {showChatHistory && (
                  <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-800">チャット履歴</h3>
                      <button
                        onClick={() => setShowChatHistory(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {chatSessions.filter(session => session.childId === activeChildId).map((session) => (
                        <div key={session.id} className="group relative">
                          <button
                            onClick={() => {
                              setCurrentSessionId(session.id);
                              setShowChatHistory(false);
                            }}
                            className="w-full text-left p-3 pr-12 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-800 truncate">{session.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(new Date(session.updatedAt))}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(session.id);
                              setShowDeleteSessionConfirm(true);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                            title="この履歴を削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {chatSessions.filter(session => session.childId === activeChildId).length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">まだチャット履歴がありません</p>
                      )}
                    </div>
                  </div>
                )}

                {/* チャット表示エリア - スクロール可能 */}
                <div className="flex-1 min-h-0 mb-4">
                  <div className="h-full bg-gradient-to-b from-purple-50/50 to-white overflow-hidden rounded-2xl border border-gray-100">
                    <div className="h-full overflow-y-auto px-4 py-4 space-y-6 pb-20" ref={chatScrollContainerRef}>
                      {getCurrentSession()?.messages.map(message => (
                        <div key={message.id} className={`w-full ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                          <div className={`max-w-3xl w-full ${message.sender === 'user' ? 'pl-8' : 'pr-8'}`}>
                            <div className={`group relative ${message.sender === 'user' ? 'ml-auto' : ''}`}>
                              <div className="flex items-start space-x-3">
                                {message.sender === 'ai' && (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <MessageSquare className="w-4 h-4 text-white" />
                                  </div>
                                )}

                                <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                                  <div className={`${message.sender === 'ai'
                                    ? 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'
                                    : 'bg-purple-500 text-white rounded-2xl rounded-tr-sm shadow-sm ml-auto max-w-2xl'
                                    } px-4 py-3 inline-block`}>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {message.content}
                                    </div>
                                  </div>
                                  <p className={`text-xs text-gray-400 mt-2 ${message.sender === 'user' ? 'text-right mr-2' : 'ml-2'}`}>
                                    {formatTime(new Date(message.timestamp))}
                                  </p>
                                </div>

                                {message.sender === 'user' && (
                                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <User size={14} className="text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* AI思考中の表示 */}
                      {isAiThinking && (
                        <div className="w-full">
                          <div className="max-w-3xl w-full pr-8">
                            <div className="group relative">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <MessageSquare className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 初回案内とカテゴリーボタン */}
                      {!getCurrentSession() && (
                        <div className="w-full space-y-6">
                          {/* 相談開始ボタン */}
                          <div className="w-full px-4">
                            <div className="flex justify-center max-w-2xl mx-auto">
                              <button
                                onClick={() => createSimpleChatSession()}
                                className="w-full max-w-md flex items-center justify-center p-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mr-4 flex-shrink-0">
                                  <span className="text-3xl">💬</span>
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white text-lg">相談を始める</div>
                                  <div className="text-sm text-white/90 mt-1">AI先生に何でもお気軽にご相談ください</div>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AIチャット用入力エリア - 固定 */}
                <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder={getCurrentSession() ? "メッセージを入力..." : "AI先生に相談してみましょう..."}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 text-sm transition-all duration-200"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isAiThinking}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isAiThinking}
                      className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 削除確認ダイアログ */}
                {showDeleteSessionConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">履歴を削除しますか？</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        この相談履歴を削除します。削除した履歴は元に戻せません。
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeleteSessionConfirm(false);
                            setSessionToDelete(null);
                          }}
                          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => {
                            if (sessionToDelete) {
                              handleDeleteChatSession(sessionToDelete);
                            }
                            setShowDeleteSessionConfirm(false);
                            setSessionToDelete(null);
                          }}
                          className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* 直接チャット機能 */}
            {chatType === 'direct' && (
              <div className="flex flex-col flex-1 min-h-0 pb-20">
                {/* 直接チャットヘッダー - 固定 */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center mr-3">
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">
                        園の先生と連絡
                      </h2>
                    </div>
                    {childInfo && (
                      <div className="text-xs text-gray-400">
                        {childInfo.name}{getChildSuffix(childInfo.gender)}について
                      </div>
                    )}
                  </div>
                </div>

                {/* チャット表示エリア - スクロール可能 */}
                <div className="flex-1 min-h-0 mb-4">
                  {/* 常にチャット画面を表示 */}
                  <>
                    <div className="h-full bg-gradient-to-b from-orange-50/50 to-white overflow-hidden rounded-2xl border border-gray-100">
                      <div className="h-full overflow-y-auto px-4 py-4 space-y-6 pb-20" ref={chatScrollContainerRef}>
                        {currentDirectSession && directChatSessions.find(s => s.id === currentDirectSession)?.messages.map((msg, index) => (
                          <div key={index} className={`w-full ${msg.sender === 'parent' ? 'flex justify-end' : ''}`}>
                            <div className={`max-w-3xl w-full ${msg.sender === 'parent' ? 'pl-8' : 'pr-8'}`}>
                              <div className={`group relative ${msg.sender === 'parent' ? 'ml-auto' : ''}`}>
                                <div className={`flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex items-end space-x-2 max-w-[75%] ${msg.sender === 'parent' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    {/* アイコンは相手側のみ表示 (LINE風) */}
                                    {msg.sender !== 'parent' && (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-md mb-1">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                      </div>
                                    )}

                                    <div className="flex flex-col">
                                      <div className={`${msg.sender !== 'parent'
                                        ? 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200'
                                        : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl rounded-br-sm shadow-md'
                                        } px-4 py-2.5`}>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                          {msg.content}
                                        </div>
                                      </div>
                                      <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'parent' ? 'text-right' : 'text-left'} px-1`}>
                                        {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* メッセージがない場合の表示 */}
                        {(!currentDirectSession || !directChatSessions.find(s => s.id === currentDirectSession)?.messages.length) && (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-6 h-6 text-orange-600" />
                              </div>
                              <p className="text-gray-500 text-sm">
                                {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}について園の先生とメッセージをやり取りしましょう` : '園の先生とメッセージをやり取りしましょう'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* スクロール用の空白 */}
                        <div className="h-4"></div>
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                  </>
                </div>

                {/* メッセージ入力エリア - 常に固定表示 */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 mt-auto flex-shrink-0">
                  <div className="flex items-end space-x-3">
                    <textarea
                      value={directMessage}
                      onChange={(e) => setDirectMessage(e.target.value)}
                      placeholder="園の先生にメッセージを送信..."
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 text-sm resize-none transition-all duration-200 min-h-[60px] max-h-[200px]"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (directMessage.trim()) {
                            handleSendDirectMessage();
                          }
                        }
                      }}
                      disabled={!childInfo}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin'
                      }}
                    />
                    <button
                      onClick={handleSendDirectMessage}
                      disabled={!childInfo || !directMessage.trim()}
                      className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'record':
        return (
          <div className="flex flex-col items-center space-y-4 pb-20 record-content">
            {/* 記録ヘッダー - シンプル版 */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mr-3">
                    <span className="text-lg">📝</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {childInfo ? `${childInfo.name}${getChildSuffix(childInfo.gender)}の記録` : '今日の記録'}
                  </h2>
                </div>
                <div className="text-xs text-gray-400">
                  {formattedDate}
                </div>
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
                  <span className="text-sm font-bold text-gray-800">気になること</span>
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

            {/* 今日の記録一覧 - シンプル版 */}
            {hasRecords && (
              <RecordSummary
                records={todaysFilteredRecords}
                onDeleteRecord={handleDeleteClick}
                getCategoryName={getCategoryName}
                formatTime={formatTime}
              />
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
          <div className="flex flex-col h-full overflow-hidden">
            {/* ヘッダー部分 - 固定 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 mb-2 flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mr-3">
                      <span className="text-lg">📅</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                      記録カレンダー
                    </h2>
                  </div>
                </div>

                {/* 表示モード切り替えボタン */}
                <div className="flex justify-center">
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => setCalendarViewMode('month')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${calendarViewMode === 'month'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      カレンダー
                    </button>
                    <button
                      onClick={() => setCalendarViewMode('week')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${calendarViewMode === 'week'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      週間
                    </button>
                    <button
                      onClick={() => setCalendarViewMode('monthly')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${calendarViewMode === 'monthly'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      月間
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* カレンダーコンテンツ部分 - スクロール可能 */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
              <div className="space-y-4">
                {calendarViewMode === 'month' ? <CalendarView /> :
                  calendarViewMode === 'week' ? <WeeklyView /> :
                    <MonthlyView />}
              </div>
            </div>
          </div>
        );
      case 'growth':
        return <GrowthRecords />;
      case 'facility_records':
        return (
          <div className="flex flex-col h-screen">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shadow-lg flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">園からの記録</h1>
                  <p className="text-blue-100 text-sm">
                    {childInfo ? `${childInfo.name}${childInfo.gender === 'male' ? 'くん' : 'ちゃん'}の活動記録` : '活動記録'}
                  </p>
                </div>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-gray-50">
              {loadingFacilityRecords ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">読み込み中...</p>
                  </div>
                </div>
              ) : facilityRecords.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-gray-500 mb-2">まだ記録がありません</p>
                    <p className="text-sm text-gray-400">園から記録が追加されると、ここに表示されます</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {facilityRecords.map((record, index) => (
                    <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* シンプルなリストアイテム */}
                      <button
                        onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">
                              {new Date(record.date).toLocaleDateString('ja-JP', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.actual_arrival_time && `${record.actual_arrival_time.slice(0, 5)}登園`}
                              {record.actual_arrival_time && record.actual_departure_time && ' • '}
                              {record.actual_departure_time && `${record.actual_departure_time.slice(0, 5)}降園`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.attendance_status === 'present' ? 'bg-green-100 text-green-700' :
                            record.attendance_status === 'absent' ? 'bg-red-100 text-red-700' :
                              record.attendance_status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {record.attendance_status === 'present' ? '出席' :
                              record.attendance_status === 'absent' ? '欠席' :
                                record.attendance_status === 'late' ? '遅刻' :
                                  record.attendance_status === 'early_departure' ? '早退' :
                                    '予定'}
                          </span>
                          <ChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedRecordId === record.id ? 'rotate-90' : ''
                              }`}
                          />
                        </div>
                      </button>

                      {/* 詳細（展開時のみ表示） */}
                      {expandedRecordId === record.id && (
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                          {/* 時間詳細 */}
                          {(record.actual_arrival_time || record.actual_departure_time) && (
                            <div className="bg-white rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between text-sm">
                                {record.actual_arrival_time && (
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-600">登園</span>
                                    <span className="font-medium text-gray-900">{record.actual_arrival_time}</span>
                                  </div>
                                )}
                                {record.actual_departure_time && (
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="text-gray-600">降園</span>
                                    <span className="font-medium text-gray-900">{record.actual_departure_time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 記録内容 */}
                          {record.notes && (
                            <div className="bg-white rounded-lg p-3 mb-3">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {record.notes}
                              </div>
                            </div>
                          )}

                          {/* 気分・食事記録 */}
                          {(record.mood_rating || record.lunch_status || record.snack_status) && (
                            <div className="bg-white rounded-lg p-3">
                              <div className="flex flex-wrap gap-2">
                                {record.mood_rating && (
                                  <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <span className="text-yellow-600">😊</span>
                                    <span className="text-xs text-gray-700">
                                      機嫌: {record.mood_rating}/5
                                    </span>
                                  </div>
                                )}
                                {record.lunch_status && (
                                  <div className="flex items-center space-x-1 bg-orange-50 px-2 py-1 rounded-lg">
                                    <span className="text-orange-600">🍱</span>
                                    <span className="text-xs text-gray-700">
                                      給食: {record.lunch_status}
                                    </span>
                                  </div>
                                )}
                                {record.snack_status && (
                                  <div className="flex items-center space-x-1 bg-pink-50 px-2 py-1 rounded-lg">
                                    <span className="text-pink-600">🍪</span>
                                    <span className="text-xs text-gray-700">
                                      おやつ: {record.snack_status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 記録者 */}
                          {record.created_by_name && (
                            <div className="mt-2 text-xs text-gray-400 text-right">
                              記録者: {record.created_by_name}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="full-screen-container bg-gray-50 flex flex-col">
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
      <div className="container mx-auto max-w-md mobile-safe-padding pt-6 pb-24 flex-1 scroll-container">
        {activeTab === 'chat' ? (
          <div className="h-full">
            {renderContent()}
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* 下部ナビゲーション */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chatUnreadCount={directChatUnreadCount}
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
                <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-orange-700 mb-2 font-medium">お子さま情報の設定待ちです</p>
                  <p className="text-sm text-orange-600">管理者による設定が必要です</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">


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
              <span className="text-pink-500 mr-2">✏️</span>
              お子さま情報を編集
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-6">
              お子さまの基本情報を編集できます（管理者により設定されています）
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="例: 山田太郎"
                  required
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
                    年齢 <span className="text-xs text-gray-500">(生年月日から自動計算)</span>
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-blue-50 text-blue-800 font-medium">
                    {calculateAge(childBirthdate)}歳
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  誕生日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={childBirthdate}
                  onChange={(e) => setChildBirthdate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  性別 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChildGender('male')}
                    className={`px-4 py-4 rounded-xl border-2 transition-colors ${childGender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className="text-2xl block mb-1">👦</span>
                    <span className="font-medium text-sm">男の子</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChildGender('female')}
                    className={`px-4 py-4 rounded-xl border-2 transition-colors ${childGender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className="text-2xl block mb-1">👧</span>
                    <span className="font-medium text-sm">女の子</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => setIsChildSettingsOpen(false)}
                >
                  閉じる
                </button>

                {editChildId && (
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-sm focus:outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    onClick={saveChildInfo}
                  >
                    📷 写真を保存
                  </button>
                )}
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

      {/* お知らせ詳細モーダル */}
      <Dialog open={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center">
                <Megaphone className="w-5 h-5 text-orange-500 mr-2" />
                園からのお知らせ
              </Dialog.Title>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedAnnouncement && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedAnnouncement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    selectedAnnouncement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {selectedAnnouncement.priority === 'urgent' ? '緊急' :
                      selectedAnnouncement.priority === 'high' ? '重要' : '通常'}
                  </span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-medium">
                    {selectedAnnouncement.category === 'general' ? '一般' :
                      selectedAnnouncement.category === 'event' ? 'イベント' :
                        selectedAnnouncement.category === 'notice' ? 'お知らせ' :
                          selectedAnnouncement.category === 'schedule' ? 'スケジュール' :
                            selectedAnnouncement.category === 'emergency' ? '緊急' : selectedAnnouncement.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedAnnouncement.title}</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedAnnouncement.content}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    📅 送信日時: {new Date(selectedAnnouncement.created_at).toLocaleString('ja-JP')}
                  </p>
                  {selectedAnnouncement.sender_facility_user?.display_name && (
                    <p className="text-sm text-gray-500">
                      👨‍🏫 送信者: {selectedAnnouncement.sender_facility_user.display_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                閉じる
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
        hasAvatar: !!childAvatarImage,
        avatarSize: childAvatarImage ? childAvatarImage.length : 0
      });

      const newChildId = await addChild(
        childName.trim(),
        age,
        childBirthdate,
        childGender,
        childAvatarImage || undefined
      );

      console.log('👶 子供登録完了:', {
        id: newChildId,
        name: childName.trim(),
        withPhoto: !!childAvatarImage
      });

      setActiveChildId(newChildId);
    } catch (error) {
      console.error('子供情報の登録エラー:', error);

      let errorMessage = '子供の登録に失敗しました。';
      if (error instanceof Error) {
        if (error.message.includes('avatar_image')) {
          errorMessage = '写真のアップロードに失敗しました。写真のサイズを確認して再度お試しください。';
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = childName.trim() && childBirthdate && childGender;

  return (
    <div className="full-screen-container bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center mobile-safe-padding">
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

// お子さま情報待機画面（管理者による設定待ち）
function WaitingForChildSetup() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="full-screen-container bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center mobile-safe-padding">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100 text-center relative">
          {/* ログアウトボタン（右上） */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="ログアウト"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-full mb-6">
            <UserCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            お子さまの情報を<br />確認しています
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">設定待ちです</span>
            </div>
            <p className="text-sm text-orange-700">
              管理者がお子さまの情報を登録する必要があります。<br />
              施設の管理者にお問い合わせください。
            </p>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
            <p><strong>ログイン中:</strong> {user?.display_name || user?.username}</p>
          </div>

          <div className="text-xs text-orange-500 bg-orange-100 p-3 rounded-lg mb-4">
            <p><strong>💡 設定完了後にご利用いただけます：</strong></p>
            <ul className="mt-1 space-y-1 text-left list-disc list-inside">
              <li>お子さまの成長記録を作成</li>
              <li>写真の追加・変更</li>
              <li>AI先生への相談</li>
              <li>園の先生との連絡</li>
            </ul>
          </div>

          {/* ログアウトボタン（下部） */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </div>

      {/* ログアウト確認ダイアログ */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
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
    <div className="full-screen-container flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 mobile-safe-padding">
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
  const { children, isDataMigrated, isLoadingChildren } = useRecord();
  const hasChildren = children.length > 0;

  // データ読み込み中の場合はローディング表示
  if (isLoadingChildren) {
    return (
      <div className="full-screen-container flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 mb-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-medium text-gray-600">お子さま情報を確認中...</p>
        </div>
      </div>
    );
  }

  // LocalStorageに既存データがあり、まだ移行していない場合は移行画面を表示
  const hasLocalData = localStorage.getItem('children') || localStorage.getItem('recordEvents');
  if (hasLocalData && !isDataMigrated) {
    return <DataMigrationPrompt />;
  }

  // 子供情報が未登録の場合は待機画面を表示
  if (!hasChildren) {
    return <WaitingForChildSetup />;
  }

  // 子供情報がある場合は通常のアプリ画面を表示
  return <AppContent />;
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="full-screen-container flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
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
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;