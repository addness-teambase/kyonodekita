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
  UserPlus,
  Clock,
  BookOpen,
  Heart,
  Trash2
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CalendarView from './components/CalendarView';
import { supabase } from './lib/supabase';

// 初回設定モーダルコンポーネント
interface FirstTimeSetupModalProps {
  user: { id: string; username: string };
  onComplete: () => void;
}

const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({ user, onComplete }) => {
  const { updateUserInfo } = useAuth();
  const [setupData, setSetupData] = useState({
    facilityName: '',
    adminName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSaveSetup = async () => {
    if (!setupData.facilityName.trim() || !setupData.adminName.trim()) {
      alert('園の名前と管理者名は必須です');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          facility_name: setupData.facilityName,
          display_name: setupData.adminName,
          facility_address: setupData.address || null,
          facility_phone: setupData.phone || null,
          facility_email: setupData.email || null
        })
        .eq('id', user.id);

      if (error) {
        console.error('初回設定保存エラー:', error);
        alert('設定の保存に失敗しました');
        return;
      }

      // AuthContext のユーザー情報を更新
      await updateUserInfo({
        name: setupData.facilityName,
        adminName: setupData.adminName,
        address: setupData.address || undefined,
        phone: setupData.phone || undefined,
        email: setupData.email || undefined
      });

      alert('初回設定が完了しました！');
      onComplete();
    } catch (error) {
      console.error('初回設定エラー:', error);
      alert('設定に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">初回設定</h2>
          <p className="text-gray-600 text-sm mt-2">
            管理画面をご利用いただくために、<br />
            基本情報をご入力ください
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              園・施設名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={setupData.facilityName}
              onChange={(e) => setSetupData({ ...setupData, facilityName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: きょうのできた保育園"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              管理者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={setupData.adminName}
              onChange={(e) => setSetupData({ ...setupData, adminName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 山田太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              住所
            </label>
            <input
              type="text"
              value={setupData.address}
              onChange={(e) => setSetupData({ ...setupData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 東京都渋谷区..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input
              type="tel"
              value={setupData.phone}
              onChange={(e) => setSetupData({ ...setupData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 03-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={setupData.email}
              onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: admin@facility.jp"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSetup}
          disabled={saving || !setupData.facilityName.trim() || !setupData.adminName.trim()}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {saving ? '保存中...' : '設定を完了する'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          この設定は後からでも変更できます
        </p>
      </div>
    </div>
  );
};

interface ChildData {
  id: string;
  name: string;
  age: number;
  parentName: string;
  parentEmail: string;
  lastActivity: string;
  unreadMessages: number;
  todayRecords: number;
  status: 'active' | 'inactive';
  avatar: string;
  birthdate: string;
  gender: 'male' | 'female';
  // 発達障害関連の詳細項目
  hasSupportLimitManagement?: boolean;
  supportCertificateExpiry?: string;
  contractedSupportHours?: number;
  consultationSupportOffice?: string;
  consultationSupportStaffName?: string;
  consultationSupportStaffPhone?: string;
  diagnosis?: string;
  supportLevel?: string;
  therapyTypes?: string[];
  medicationInfo?: string;
  allergyInfo?: string;
  dietaryRestrictions?: string;
  specialNotes?: string;
}

interface StatsData {
  totalChildren: number;
  activeToday: number;
  totalRecords: number;
  unreadMessages: number;
}

const App: React.FC = () => {
  const { user, logout, updateUserInfo } = useAuth();
  const [currentView, setCurrentView] = useState('management');
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatChild, setChatChild] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [children, setChildren] = useState<ChildData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalChildren: 0,
    activeToday: 0,
    totalRecords: 0,
    unreadMessages: 0
  });
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    birthdate: '',
    gender: 'female' as 'male' | 'female',
    parentName: '',
    parentEmail: '',
    // 保護者アカウント情報
    parentUsername: '',
    parentPassword: '',
    // 発達障害関連の詳細項目
    hasSupportLimitManagement: false,
    supportCertificateExpiry: '',
    contractedSupportHours: 0,
    consultationSupportOffice: '',
    consultationSupportStaffName: '',
    consultationSupportStaffPhone: '',
    diagnosis: '',
    supportLevel: '',
    therapyTypes: [] as string[],
    medicationInfo: '',
    allergyInfo: '',
    dietaryRestrictions: '',
    specialNotes: ''
  });
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string | null>(null);
  const [newAttendanceRecord, setNewAttendanceRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    usageStartTime: '',
    usageEndTime: '',
    childCondition: '',
    activities: '',
    recordedBy: '管理者'
  });
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildData | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingChild, setDeletingChild] = useState<ChildData | null>(null);

  // 設定関連の状態
  const [facilityInfo, setFacilityInfo] = useState({
    name: user?.facility?.name || '',
    adminName: user?.facility?.adminName || '',
    address: '',
    phone: '',
    email: ''
  });
  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [tempFacilityInfo, setTempFacilityInfo] = useState(facilityInfo);

  // 設定情報を初期化
  useEffect(() => {
    if (user?.facility) {
      const newFacilityInfo = {
        name: user.facility.name || '',
        adminName: user.facility.adminName || '',
        address: '',
        phone: '',
        email: ''
      };
      setFacilityInfo(newFacilityInfo);
      setTempFacilityInfo(newFacilityInfo);
    }
  }, [user]);

  // 設定情報を保存
  const saveFacilityInfo = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Supabaseのusersテーブルを更新
      const { error } = await supabase
        .from('users')
        .update({
          username: tempFacilityInfo.adminName,
          facility_name: tempFacilityInfo.name,
          facility_address: tempFacilityInfo.address,
          facility_phone: tempFacilityInfo.phone,
          facility_email: tempFacilityInfo.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('設定更新エラー:', error);
        alert('設定の更新に失敗しました。');
        return;
      }

      // ローカル状態を更新
      setFacilityInfo(tempFacilityInfo);

      // AuthContextのユーザー情報を更新
      await updateUserInfo({
        name: tempFacilityInfo.name,
        adminName: tempFacilityInfo.adminName,
        address: tempFacilityInfo.address,
        phone: tempFacilityInfo.phone,
        email: tempFacilityInfo.email
      });

      setIsEditingFacility(false);
      alert('設定を更新しました！');
    } catch (error) {
      console.error('設定更新エラー:', error);
      alert('設定の更新中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 設定編集をキャンセル
  const cancelFacilityEdit = () => {
    setTempFacilityInfo(facilityInfo);
    setIsEditingFacility(false);
  };

  // データ取得関数
  const fetchChildren = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: childrenData, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id) // 現在ログインしている管理者の子供のみ取得
        .order('created_at', { ascending: false });

      if (error) {
        console.error('子供データの取得エラー:', error);
        return;
      }

      // 子供データを変換
      const processedChildren: ChildData[] = (childrenData || []).map(child => ({
        id: child.id,
        name: child.name,
        age: child.age,
        parentName: '', // 現在のスキーマには保護者情報が含まれていない
        parentEmail: '',
        lastActivity: child.updated_at,
        unreadMessages: 0, // 実際の未読メッセージ数は別途取得が必要
        todayRecords: 0, // 今日の記録数は別途計算が必要
        status: 'active' as const,
        avatar: child.name?.charAt(0)?.toUpperCase() || '?',
        birthdate: child.birthdate || '',
        gender: child.gender || 'female'
      }));

      setChildren(processedChildren);

      // 統計データも更新
      setStats({
        totalChildren: processedChildren.length,
        activeToday: processedChildren.length, // 簡易実装
        totalRecords: 0, // 実際のレコード数は別途計算が必要
        unreadMessages: 0 // 実際の未読数は別途計算が必要
      });

    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回設定チェック
  const checkFirstTimeSetup = async () => {
    if (!user) return;

    try {
      // データベースから管理者の詳細情報を取得
      const { data: adminData, error } = await supabase
        .from('users')
        .select('facility_name, display_name, facility_address, facility_phone, facility_email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('管理者情報取得エラー:', error);
        return;
      }

      // 初回設定が必要かチェック
      const needsSetup = !adminData.facility_name || !adminData.display_name;
      setShowFirstTimeSetup(needsSetup);

      if (needsSetup) {
        console.log('初回設定が必要です');
      } else {
        console.log('設定済みの管理者です');
      }
    } catch (error) {
      console.error('初回設定チェックエラー:', error);
    }
  };

  // ユーザーがログインしたときにデータを取得
  useEffect(() => {
    if (user) {
      checkFirstTimeSetup();
    }
  }, [user]);

  // 初回設定が完了したらデータを取得
  useEffect(() => {
    if (user && !showFirstTimeSetup) {
      fetchChildren();
    }
  }, [user, showFirstTimeSetup]);

  // ログインしていない場合はLoginPageを表示
  if (!user) {
    return <LoginPage />;
  }

  // 初回設定が必要な場合は設定画面を表示
  if (showFirstTimeSetup) {
    return <FirstTimeSetupModal
      user={user}
      onComplete={() => {
        setShowFirstTimeSetup(false);
        fetchChildren();
      }}
    />;
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
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
  const startChat = async (childId: string) => {
    setChatChild(childId);
    // チャット開始時にメッセージをロード
    await loadChatMessages(childId);
  };

  // チャットメッセージをロード
  const loadChatMessages = async (childId: string) => {
    if (!user) return;

    try {
      // 園児の保護者IDを取得
      const { data: child } = await supabase
        .from('children')
        .select('user_id')
        .eq('id', childId)
        .single();

      if (!child) return;

      // 会話を取得または作成
      const { data: conversation, error: convError } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', childId)
        .eq('parent_user_id', child.user_id)
        .single();

      let conversationId = conversation?.id;

      if (!conversation || convError) {
        // 会話が存在しない場合は新規作成
        const { data: newConversation, error: createError } = await supabase
          .from('direct_chat_conversations')
          .insert({
            child_id: childId,
            parent_user_id: child.user_id,
            facility_id: '00000000-0000-0000-0000-000000000001', // 仮の facility_id（本来は admin の所属施設ID）
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('会話作成エラー:', createError);
          return;
        }
        conversationId = newConversation.id;
      }

      // メッセージを取得
      const { data: messages, error: msgError } = await supabase
        .from('direct_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('メッセージ取得エラー:', msgError);
        return;
      }

      // ローカルのchatMessages形式に変換
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        childId: childId,
        sender: msg.sender_type === 'parent' ? 'parent' : 'admin',
        senderName: msg.sender_type === 'parent' ? '保護者' : '管理者',
        message: msg.content,
        timestamp: msg.created_at
      }));

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('チャットメッセージ取得エラー:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatChild || !user) return;

    try {
      // 園児の保護者IDを取得
      const { data: child } = await supabase
        .from('children')
        .select('user_id')
        .eq('id', chatChild)
        .single();

      if (!child) return;

      // 会話IDを取得
      const { data: conversation } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', chatChild)
        .eq('parent_user_id', child.user_id)
        .single();

      if (!conversation) return;

      // メッセージを保存
      const { data: savedMessage, error } = await supabase
        .from('direct_chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_user_id: user.id,
          sender_type: 'facility_admin',
          content: newMessage,
          is_read: false
        })
        .select('*')
        .single();

      if (error) {
        console.error('メッセージ送信エラー:', error);
        alert('メッセージの送信に失敗しました。');
        return;
      }

      // 会話の最終メッセージ時刻を更新
      await supabase
        .from('direct_chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);

      // ローカルのメッセージリストを更新
      const newMessageObj = {
        id: savedMessage.id,
        childId: chatChild,
        sender: 'admin' as const,
        senderName: '管理者',
        message: newMessage,
        timestamp: savedMessage.created_at
      };

      setChatMessages([...chatMessages, newMessageObj]);
      setNewMessage('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました。');
    }
  };

  // 簡単なパスワードハッシュ関数（parent-appと同じ）
  const hashPassword = (password: string): string => {
    return btoa(password + 'kyou-no-dekita-salt');
  };

  // 園児編集を開始
  const startEditChild = (child: ChildData) => {
    setEditingChild(child);
    setShowEditChildModal(true);
  };

  // 園児削除確認を開始
  const startDeleteChild = (child: ChildData) => {
    setDeletingChild(child);
    setShowDeleteConfirmModal(true);
  };

  // 園児削除を実行
  const handleDeleteChild = async () => {
    if (!deletingChild || !user) return;

    try {
      setLoading(true);

      console.log('園児削除開始:', deletingChild.id, deletingChild.name);

      // 1. 園児に関連する記録データを削除
      const { error: recordsError } = await supabase
        .from('records')
        .delete()
        .eq('child_id', deletingChild.id);

      if (recordsError) {
        console.warn('記録データ削除エラー:', recordsError);
      }

      // 2. カレンダーイベントを削除
      const { error: eventsError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('child_id', deletingChild.id);

      if (eventsError) {
        console.warn('カレンダーイベント削除エラー:', eventsError);
      }

      // 3. 出席記録を削除
      const { error: attendanceError } = await supabase
        .from('attendance_schedules')
        .delete()
        .eq('child_id', deletingChild.id);

      if (attendanceError) {
        console.warn('出席記録削除エラー:', attendanceError);
      }

      // 4. チャット関連データを削除
      // 直接チャットの会話を削除
      const { data: conversations } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', deletingChild.id);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(conv => conv.id);

        // チャットメッセージを削除
        const { error: messagesError } = await supabase
          .from('direct_chat_messages')
          .delete()
          .in('conversation_id', conversationIds);

        if (messagesError) {
          console.warn('チャットメッセージ削除エラー:', messagesError);
        }

        // 会話を削除
        const { error: conversationsError } = await supabase
          .from('direct_chat_conversations')
          .delete()
          .in('id', conversationIds);

        if (conversationsError) {
          console.warn('チャット会話削除エラー:', conversationsError);
        }
      }

      // 5. 園児データを削除
      const { error: childError } = await supabase
        .from('children')
        .delete()
        .eq('id', deletingChild.id);

      if (childError) {
        console.error('園児データ削除エラー:', childError);
        alert('園児データの削除に失敗しました。');
        return;
      }

      // TODO: 6. 関連する保護者アカウントを削除
      // 現在はparent_user_idフィールドがないため実装待ち
      // 将来的にはここで保護者アカウントも削除する

      console.log('園児削除完了:', deletingChild.name);

      // データを再取得
      await fetchChildren();

      // モーダルを閉じる
      setShowDeleteConfirmModal(false);
      setDeletingChild(null);

      alert(`${deletingChild.name}さんの情報を削除しました。`);
    } catch (error) {
      console.error('園児削除エラー:', error);
      alert('削除処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 園児編集を保存
  const handleUpdateChild = async () => {
    if (!editingChild || !user) return;

    try {
      setLoading(true);

      const { data: updatedChild, error } = await supabase
        .from('children')
        .update({
          name: editingChild.name,
          age: calculateAge(editingChild.birthdate),
          birthdate: editingChild.birthdate || null,
          gender: editingChild.gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingChild.id)
        .select()
        .single();

      if (error) {
        console.error('園児更新エラー:', error);
        alert('園児情報の更新に失敗しました。');
        return;
      }

      console.log('園児更新成功:', updatedChild);

      // 子供リストを再取得
      await fetchChildren();

      setShowEditChildModal(false);
      setEditingChild(null);

      alert('園児情報を更新しました！');
    } catch (error) {
      console.error('園児更新エラー:', error);
      alert('園児情報の更新中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 園児追加
  const handleAddChild = async () => {
    if (!newChild.name.trim() || !newChild.parentName.trim() || !newChild.parentUsername.trim() || !newChild.parentPassword.trim() || !user) {
      alert('必須項目をすべて入力してください');
      return;
    }

    try {
      setLoading(true);

      // まず、ユーザー名の重複チェック
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', newChild.parentUsername)
        .single();

      if (existingUser) {
        alert('このユーザー名は既に使用されています。別のユーザー名を入力してください。');
        setLoading(false);
        return;
      }

      // 保護者アカウントを作成
      const { data: parentUser, error: parentError } = await supabase
        .from('users')
        .insert({
          username: newChild.parentUsername,
          password: hashPassword(newChild.parentPassword),
          user_type: 'parent', // 明示的に保護者として設定
          display_name: newChild.parentName,
          email: newChild.parentEmail || null
        })
        .select('id, username, user_type, display_name')
        .single();

      if (parentError) {
        console.error('保護者アカウント作成エラー:', parentError);
        alert('保護者アカウントの作成に失敗しました。');
        return;
      }

      // 次に園児データを保存（parent_user_idを設定）
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          user_id: user.id, // 管理者ID
          name: newChild.name,
          age: calculateAge(newChild.birthdate),
          birthdate: newChild.birthdate || null,
          gender: newChild.gender
          // TODO: parent_user_idフィールドが追加されたらここに設定
          // parent_user_id: parentUser.id
        })
        .select()
        .single();

      if (childError) {
        console.error('園児追加エラー:', childError);
        // 園児作成に失敗した場合、保護者アカウントを削除
        await supabase.from('users').delete().eq('id', parentUser.id);
        alert('園児の追加に失敗しました。');
        return;
      }

      console.log('園児と保護者アカウント作成成功:', {
        child: childData,
        parent: parentUser
      });

      // 子供リストを再取得
      await fetchChildren();

      setShowAddChildModal(false);
      setNewChild({
        name: '',
        birthdate: '',
        gender: 'female',
        parentName: '',
        parentEmail: '',
        parentUsername: '',
        parentPassword: '',
        hasSupportLimitManagement: false,
        supportCertificateExpiry: '',
        contractedSupportHours: 0,
        consultationSupportOffice: '',
        consultationSupportStaffName: '',
        consultationSupportStaffPhone: '',
        diagnosis: '',
        supportLevel: '',
        therapyTypes: [],
        medicationInfo: '',
        allergyInfo: '',
        dietaryRestrictions: '',
        specialNotes: ''
      });

      alert(`園児を追加しました！\n\n保護者用ログイン情報:\nユーザー名: ${newChild.parentUsername}\nパスワード: ${newChild.parentPassword}\n\n※この情報を保護者の方にお伝えください`);
    } catch (error) {
      console.error('園児追加エラー:', error);
      alert('園児の追加中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 出席記録開始
  const startAttendanceRecord = (childId: string) => {
    setSelectedChildForAttendance(childId);
    setShowAttendanceModal(true);
  };

  // 出席記録保存
  const handleSaveAttendanceRecord = async () => {
    if (!selectedChildForAttendance || !newAttendanceRecord.childCondition.trim() || !newAttendanceRecord.activities.trim()) return;

    try {
      // 詳細記録を notes フィールドに結合して保存
      const notes = `【本人の様子】\n${newAttendanceRecord.childCondition}\n\n【活動内容】\n${newAttendanceRecord.activities}`;

      // Supabaseに出席記録を保存
      const { data, error } = await supabase
        .from('attendance_schedules')
        .insert({
          child_id: selectedChildForAttendance,
          date: newAttendanceRecord.date,
          actual_arrival_time: newAttendanceRecord.usageStartTime || null,
          actual_departure_time: newAttendanceRecord.usageEndTime || null,
          attendance_status: 'present',
          notes: notes,
          created_by: newAttendanceRecord.recordedBy
        })
        .select()
        .single();

      if (error) {
        console.log('Supabaseエラー:', error);
        console.log('ローカルモードで記録を保存します...');

        // ローカルストレージに保存
        const localRecord = {
          id: `attendance_${Date.now()}`,
          child_id: selectedChildForAttendance,
          date: newAttendanceRecord.date,
          actual_arrival_time: newAttendanceRecord.usageStartTime,
          actual_departure_time: newAttendanceRecord.usageEndTime,
          notes: notes,
          created_by: newAttendanceRecord.recordedBy,
          created_at: new Date().toISOString()
        };

        const existingRecords = JSON.parse(localStorage.getItem('admin-attendance-records') || '[]');
        existingRecords.push(localRecord);
        localStorage.setItem('admin-attendance-records', JSON.stringify(existingRecords));

        console.log('✅ ローカル出席記録保存成功:', localRecord);
        alert('出席記録をローカルに保存しました！');
      } else {
        console.log('✅ Supabase出席記録保存成功:', data);
        alert('出席記録を保存しました！');
      }

      setShowAttendanceModal(false);
      setSelectedChildForAttendance(null);
      setNewAttendanceRecord({
        date: new Date().toISOString().split('T')[0],
        usageStartTime: '',
        usageEndTime: '',
        childCondition: '',
        activities: '',
        recordedBy: '管理者'
      });
    } catch (error) {
      console.error('出席記録保存エラー:', error);
      alert('出席記録の保存中にエラーが発生しました。');
    }
  };

  // サイドバーメニュー
  const sidebarItems = [
    { id: 'management', label: '園児管理', icon: Users },
    { id: 'attendance', label: '出席記録', icon: BookOpen },
    { id: 'records', label: '成長記録', icon: Heart },
    { id: 'messages', label: 'メッセージ', icon: MessageSquare, badge: stats.unreadMessages },
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'settings', label: '設定', icon: Settings }
  ];

  // フィルタリングされた園児リスト
  const filteredChildren = children.filter(child =>
    child.name.includes(searchQuery) || child.parentName.includes(searchQuery)
  );

  // メインコンテンツのレンダリング
  const renderMainContent = () => {
    switch (currentView) {


      case 'attendance':
        return (
          <div className="space-y-6">
            {/* 今日の出席記録 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">本日の出席記録</h2>
                <p className="text-sm text-gray-500 mt-1">子供たちの出席・活動記録を管理できます</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-400 rounded-2xl flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">{child.avatar}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{child.name}</h3>
                            <p className="text-sm text-gray-500">{child.age}歳</p>
                          </div>
                        </div>
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">保護者:</span> {child.parentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">今日の記録:</span> {child.todayRecords}件
                        </p>
                      </div>

                      <button
                        onClick={() => startAttendanceRecord(child.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        出席・活動記録を追加
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'management':
        return (
          <div className="space-y-6">
            {/* 園児管理ヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">園児管理</h2>
                    <p className="text-sm text-gray-500 mt-1">園児の情報管理と日常のやりとりができます</p>
                  </div>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    園児追加
                  </button>
                </div>

                {/* 検索バー */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="園児名または保護者名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* 園児リスト表示 */}
              <div className="divide-y divide-gray-100">
                {filteredChildren.map((child, index) => (
                  <div key={child.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                    {/* 基本情報行 */}
                    <div
                      onClick={() => setExpandedChild(expandedChild === child.id ? null : child.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">{child.avatar}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-500">{child.age}歳 • {child.parentName}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {child.unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {child.unreadMessages}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          今日: {child.todayRecords}件
                        </span>
                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedChild === child.id ? 'rotate-90' : ''
                            }`}
                        />
                      </div>
                    </div>

                    {/* 展開可能な詳細情報 */}
                    {expandedChild === child.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100 animate-slideDown">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* 基本情報 */}
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-800 mb-3">基本情報</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">性別:</span>
                                  <span className="text-gray-900">{child.gender === 'male' ? '男の子' : '女の子'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">生年月日:</span>
                                  <span className="text-gray-900">{child.birthdate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">年齢:</span>
                                  <span className="text-gray-900">{child.age}歳</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-800 mb-3">保護者情報</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">保護者名:</span>
                                  <span className="text-gray-900">{child.parentName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">メール:</span>
                                  <span className="text-gray-900 truncate">{child.parentEmail}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 管理情報 */}
                          <div className="space-y-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                              <h4 className="text-base font-semibold text-gray-800 mb-4">管理情報</h4>
                              <div className="grid grid-cols-1 gap-3 mb-4">
                                <div className="bg-indigo-50 rounded-lg p-3">
                                  <div className="text-xs text-indigo-600 mb-1">管理者</div>
                                  <div className="text-sm font-medium text-indigo-900">{user.facility.adminName}</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <div className="text-xs text-purple-600 mb-1">施設</div>
                                  <div className="text-sm font-medium text-purple-900">{user.facility.name}</div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3">
                                  <div className="text-xs text-orange-600 mb-1">園児ID</div>
                                  <div className="text-sm font-medium text-orange-900 font-mono">{child.id}</div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                              <h4 className="text-base font-semibold text-gray-800 mb-4">支援情報</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs text-gray-500 mb-1">上限管理事業所</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {child.hasSupportLimitManagement ? 'あり' : 'なし'}
                                  </div>
                                </div>

                                {child.supportCertificateExpiry && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">受給者証期限</div>
                                    <div className="text-sm font-medium text-gray-900">{child.supportCertificateExpiry}</div>
                                  </div>
                                )}

                                {child.contractedSupportHours && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">契約支給量</div>
                                    <div className="text-sm font-medium text-gray-900">{child.contractedSupportHours}時間/月</div>
                                  </div>
                                )}

                                {child.consultationSupportOffice && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">相談支援事業所</div>
                                    <div className="text-sm font-medium text-gray-900">{child.consultationSupportOffice}</div>
                                  </div>
                                )}

                                {child.consultationSupportStaffName && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">相談支援員</div>
                                    <div className="text-sm font-medium text-gray-900">{child.consultationSupportStaffName}</div>
                                  </div>
                                )}

                                {child.diagnosis && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">診断名</div>
                                    <div className="text-sm font-medium text-gray-900">{child.diagnosis}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* アクションボタン */}
                          <div className="grid grid-cols-4 gap-3">
                            <button
                              onClick={() => startAttendanceRecord(child.id)}
                              className="bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              記録
                            </button>
                            <button
                              onClick={() => startChat(child.id)}
                              className="bg-pink-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-pink-600 transition-all duration-200 flex items-center justify-center"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              チャット
                            </button>
                            <button
                              onClick={() => startEditChild(child)}
                              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all duration-200 flex items-center justify-center"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              編集
                            </button>
                            <button
                              onClick={() => startDeleteChild(child)}
                              className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 検索結果がない場合 */}
                {filteredChildren.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">検索結果がありません</h3>
                    <p className="text-gray-500">
                      「{searchQuery}」に一致する園児が見つかりませんでした
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div >
        );

      case 'records':
        return (
          <div className="space-y-6">
            {/* 成長記録ヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">成長記録</h2>
                <p className="text-sm text-gray-500 mt-1">保護者が記録した子供たちの日々の成長記録を確認できます</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {children.map((child) => (
                    <div key={child.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">{child.avatar}</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-500">{child.age}歳 • 保護者: {child.parentName || '未設定'}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">最近の記録</h4>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            記録データの取得機能は準備中です。<br />
                            保護者アカウントとの連携が完了次第、ここに成長記録が表示されます。
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-600 transition-all duration-200 flex items-center justify-center">
                          <Heart className="w-4 h-4 mr-1" />
                          詳細を見る
                        </button>
                        <button
                          onClick={() => startChat(child.id)}
                          className="flex-1 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-all duration-200 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          保護者に連絡
                        </button>
                      </div>
                    </div>
                  ))}

                  {children.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">まだ園児が登録されていません</h3>
                      <p className="text-gray-500 text-sm">
                        園児を登録すると、保護者の成長記録を確認できるようになります
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                    未読 {stats.unreadMessages}件
                  </span>
                </div>
              </div>
            </div>

            {/* メッセージ一覧 */}
            <div className="space-y-4">
              {children.map((child) => {
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

      case 'settings':
        return (
          <div className="space-y-6">
            {/* 設定ヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">設定</h2>
                    <p className="text-sm text-gray-500 mt-1">園・管理者情報を設定できます</p>
                  </div>
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              {/* 園・管理者情報 */}
              <div className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">園・施設情報</h3>
                        <p className="text-sm text-gray-600">基本的な施設情報を管理します</p>
                      </div>
                    </div>
                    {!isEditingFacility && (
                      <button
                        onClick={() => setIsEditingFacility(true)}
                        className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all duration-200 border border-blue-200"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        編集
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 園名 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        園・施設名
                      </label>
                      {isEditingFacility ? (
                        <input
                          type="text"
                          value={tempFacilityInfo.name}
                          onChange={(e) => setTempFacilityInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="施設名を入力"
                        />
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <span className="text-gray-900">{facilityInfo.name || '未設定'}</span>
                        </div>
                      )}
                    </div>

                    {/* 管理者名 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        管理者名
                      </label>
                      {isEditingFacility ? (
                        <input
                          type="text"
                          value={tempFacilityInfo.adminName}
                          onChange={(e) => setTempFacilityInfo(prev => ({ ...prev, adminName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="管理者名を入力"
                        />
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <span className="text-gray-900">{facilityInfo.adminName || '未設定'}</span>
                        </div>
                      )}
                    </div>

                    {/* 住所 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        住所
                      </label>
                      {isEditingFacility ? (
                        <input
                          type="text"
                          value={tempFacilityInfo.address}
                          onChange={(e) => setTempFacilityInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="住所を入力"
                        />
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <span className="text-gray-900">{facilityInfo.address || '未設定'}</span>
                        </div>
                      )}
                    </div>

                    {/* 電話番号 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号
                      </label>
                      {isEditingFacility ? (
                        <input
                          type="tel"
                          value={tempFacilityInfo.phone}
                          onChange={(e) => setTempFacilityInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="電話番号を入力"
                        />
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <span className="text-gray-900">{facilityInfo.phone || '未設定'}</span>
                        </div>
                      )}
                    </div>

                    {/* メールアドレス */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      {isEditingFacility ? (
                        <input
                          type="email"
                          value={tempFacilityInfo.email}
                          onChange={(e) => setTempFacilityInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="メールアドレスを入力"
                        />
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <span className="text-gray-900">{facilityInfo.email || '未設定'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 編集時のアクションボタン */}
                  {isEditingFacility && (
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={cancelFacilityEdit}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all duration-200"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={saveFacilityInfo}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            保存中...
                          </div>
                        ) : (
                          '保存する'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* システム情報 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">システム情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">登録園児数</div>
                    <div className="text-2xl font-bold text-gray-900">{children.length}人</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">今月の記録</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalRecords}件</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">未読メッセージ</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.unreadMessages}件</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

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
            {/* 通知ベル */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <Bell className="w-5 h-5" />
              {stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.unreadMessages}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
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
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <div className="p-6 space-y-8">
                {/* 基本情報セクション */}
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    基本情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">お名前 *</label>
                      <input
                        type="text"
                        value={newChild.name}
                        onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="山田花子"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">生年月日 *</label>
                      <input
                        type="date"
                        value={newChild.birthdate}
                        onChange={(e) => setNewChild({ ...newChild, birthdate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                      <select
                        value={newChild.gender}
                        onChange={(e) => setNewChild({ ...newChild, gender: e.target.value as 'male' | 'female' })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="female">女の子</option>
                        <option value="male">男の子</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 保護者情報セクション */}
                <div className="bg-green-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    保護者情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者名 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newChild.parentName}
                        onChange={(e) => setNewChild({ ...newChild, parentName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="山田一郎"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">※この保護者用のアカウントが自動作成されます</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                      <input
                        type="email"
                        value={newChild.parentEmail}
                        onChange={(e) => setNewChild({ ...newChild, parentEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="yamada@example.com（任意）"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者用ユーザー名 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newChild.parentUsername}
                        onChange={(e) => setNewChild({ ...newChild, parentUsername: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="yamada_taro"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">※保護者がログインに使用するユーザー名</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者用パスワード <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newChild.parentPassword}
                        onChange={(e) => setNewChild({ ...newChild, parentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="例: password123"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">※保護者がログインに使用するパスワード（6文字以上推奨）</p>
                    </div>
                  </div>
                </div>

                {/* 発達障害支援情報セクション */}
                <div className="bg-purple-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    支援情報
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="hasSupportLimitManagement"
                        checked={newChild.hasSupportLimitManagement}
                        onChange={(e) => setNewChild({ ...newChild, hasSupportLimitManagement: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label htmlFor="hasSupportLimitManagement" className="text-sm font-medium text-gray-700">
                        上限管理事業所を利用している
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">受給者証の期限</label>
                        <input
                          type="date"
                          value={newChild.supportCertificateExpiry}
                          onChange={(e) => setNewChild({ ...newChild, supportCertificateExpiry: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">契約支給量（時間/月）</label>
                        <input
                          type="number"
                          value={newChild.contractedSupportHours || ''}
                          onChange={(e) => setNewChild({ ...newChild, contractedSupportHours: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="例: 40"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">相談支援事業所</label>
                        <input
                          type="text"
                          value={newChild.consultationSupportOffice}
                          onChange={(e) => setNewChild({ ...newChild, consultationSupportOffice: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="○○相談支援センター"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">相談支援員の名前</label>
                        <input
                          type="text"
                          value={newChild.consultationSupportStaffName}
                          onChange={(e) => setNewChild({ ...newChild, consultationSupportStaffName: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="田中太郎"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">相談支援員の電話番号</label>
                        <input
                          type="tel"
                          value={newChild.consultationSupportStaffPhone}
                          onChange={(e) => setNewChild({ ...newChild, consultationSupportStaffPhone: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="090-1234-5678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">診断名</label>
                        <input
                          type="text"
                          value={newChild.diagnosis}
                          onChange={(e) => setNewChild({ ...newChild, diagnosis: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="自閉スペクトラム症、ADHD など"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* その他の情報セクション */}
                <div className="bg-orange-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    その他の重要な情報
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">アレルギー情報</label>
                      <textarea
                        value={newChild.allergyInfo}
                        onChange={(e) => setNewChild({ ...newChild, allergyInfo: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        rows={2}
                        placeholder="卵、乳製品、ピーナッツなど"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">食事制限</label>
                      <textarea
                        value={newChild.dietaryRestrictions}
                        onChange={(e) => setNewChild({ ...newChild, dietaryRestrictions: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        rows={2}
                        placeholder="宗教的理由、体質的理由など"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">服薬情報</label>
                      <textarea
                        value={newChild.medicationInfo}
                        onChange={(e) => setNewChild({ ...newChild, medicationInfo: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        rows={2}
                        placeholder="服薬している薬剤名、服薬時間など"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">特記事項</label>
                      <textarea
                        value={newChild.specialNotes}
                        onChange={(e) => setNewChild({ ...newChild, specialNotes: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        rows={3}
                        placeholder="特別な配慮が必要な事項、連絡事項など"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 shadow-lg">
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
                  園児を追加
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
                  {children.find(c => c.id === chatChild)?.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {children.find(c => c.id === chatChild)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    保護者: {children.find(c => c.id === chatChild)?.parentName || '未設定'}
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
                  placeholder={`${children.find(c => c.id === chatChild)?.parentName || 'ご家族'}にメッセージを送信...`}
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

      {/* 出席記録モーダル */}
      {showAttendanceModal && selectedChildForAttendance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">出席・活動記録</h3>
                    <p className="text-sm text-gray-500">
                      {children.find(c => c.id === selectedChildForAttendance)?.name}さんの記録
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                  <input
                    type="date"
                    value={newAttendanceRecord.date}
                    onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">記録者</label>
                  <input
                    type="text"
                    value={newAttendanceRecord.recordedBy}
                    onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, recordedBy: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    placeholder="管理者"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    利用開始時間
                  </label>
                  <input
                    type="time"
                    value={newAttendanceRecord.usageStartTime}
                    onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, usageStartTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    利用終了時間
                  </label>
                  <input
                    type="time"
                    value={newAttendanceRecord.usageEndTime}
                    onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, usageEndTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">本人の様子</label>
                <textarea
                  value={newAttendanceRecord.childCondition}
                  onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, childCondition: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 min-h-[120px] resize-none"
                  placeholder="今日の○○ちゃんの様子や体調、気になったことなどを記録してください..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">活動内容</label>
                <textarea
                  value={newAttendanceRecord.activities}
                  onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord, activities: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 min-h-[120px] resize-none"
                  placeholder="今日行った活動や遊び、学習内容などを記録してください..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveAttendanceRecord}
                  disabled={!newAttendanceRecord.childCondition.trim() || !newAttendanceRecord.activities.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-2xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  記録を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 園児編集モーダル */}
      {showEditChildModal && editingChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">園児情報編集</h3>
                <button
                  onClick={() => {
                    setShowEditChildModal(false);
                    setEditingChild(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <div className="p-6 space-y-6">
                {/* 基本情報セクション */}
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    基本情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">お名前 *</label>
                      <input
                        type="text"
                        value={editingChild.name}
                        onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="山田花子"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">生年月日 *</label>
                      <input
                        type="date"
                        value={editingChild.birthdate}
                        onChange={(e) => setEditingChild({ ...editingChild, birthdate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                      <select
                        value={editingChild.gender}
                        onChange={(e) => setEditingChild({ ...editingChild, gender: e.target.value as 'male' | 'female' })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="female">女の子</option>
                        <option value="male">男の子</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 保護者情報セクション */}
                <div className="bg-green-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    保護者情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者名 *</label>
                      <input
                        type="text"
                        value={editingChild.parentName}
                        onChange={(e) => setEditingChild({ ...editingChild, parentName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="山田一郎"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                      <input
                        type="email"
                        value={editingChild.parentEmail}
                        onChange={(e) => setEditingChild({ ...editingChild, parentEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="yamada@example.com（任意）"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      <strong>注意:</strong> 保護者のログイン情報（ユーザー名・パスワード）の変更は、現在対応していません。必要な場合は別途お問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 shadow-lg">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditChildModal(false);
                    setEditingChild(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdateChild}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 rounded-2xl font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200"
                >
                  更新する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirmModal && deletingChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">園児情報の削除</h3>
                    <p className="text-sm text-gray-500">
                      {deletingChild.name}さんの情報を削除します
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-red-500 text-xl mr-2">⚠️</span>
                    <p className="text-sm font-medium text-red-800">重要：この操作は取り消せません</p>
                  </div>
                  <p className="text-sm text-red-700">
                    以下のデータがすべて削除されます：
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">削除される情報</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      園児の基本情報（名前、年齢、性別など）
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      出席記録・活動記録
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      保護者が作成した成長記録
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      チャット・メッセージ履歴
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      カレンダー・イベント情報
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 text-center mb-4">
                  <strong>{deletingChild.name}</strong>さんの情報を本当に削除しますか？
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeletingChild(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteChild}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-2xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      削除中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除する
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;