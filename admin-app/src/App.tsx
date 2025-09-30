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
  Trash2,
  Megaphone,
  ChevronLeft
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CalendarView from './components/CalendarView';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
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
  // 保護者ログイン情報
  parentUsername?: string;
  parentPassword?: string;
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
  const [allMessages, setAllMessages] = useState<any[]>([]); // 全てのメッセージ
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'today'>('all');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // 成長記録関連
  const [growthRecords, setGrowthRecords] = useState<any[]>([]);
  const [selectedChildForRecords, setSelectedChildForRecords] = useState<string | null>(null);
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'achievement' | 'happy' | 'failure' | 'trouble'>('all');
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [recordsViewMode, setRecordsViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily'); // デフォルト：日次
  const [recordsSelectedDate, setRecordsSelectedDate] = useState<Date>(new Date()); // 選択された日付

  // 一斉メッセージ関連
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [announcementCategory, setAnnouncementCategory] = useState<'general' | 'event' | 'emergency' | 'notice' | 'schedule'>('general');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

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
    therapyTypes: [] as string[]
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // データ取得関数（管理者が管理する子供データを取得）
  const fetchChildren = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 管理者の施設IDを取得
      const targetFacilityId = await getOrCreateAdminFacilityId();
      if (!targetFacilityId) {
        alert('施設情報の取得に失敗しました。');
        return;
      }

      console.log('🔧 園児データ取得開始:', {
        targetFacilityId,
        adminId: user.id
      });

      // 管理者の施設に関連する子供データのみを取得（JOINエラーを避ける）
      const { data: facilityChildrenData, error } = await supabase
        .from('facility_children')
        .select('*')
        .eq('facility_id', targetFacilityId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      console.log('🔧 園児データ取得結果:', {
        count: facilityChildrenData?.length || 0,
        data: facilityChildrenData,
        error: error?.message
      });

      if (error) {
        console.error('❌ facility_children取得エラー:', error);
        // エラーでも空配列を設定して処理を続行
        setChildren([]);
        setStats({
          totalChildren: 0,
          activeToday: 0,
          totalRecords: 0,
          unreadMessages: 0
        });
        return;
      }

      // facility_childrenデータが空の場合
      if (!facilityChildrenData || facilityChildrenData.length === 0) {
        console.log('⚠️ この施設には園児データがまだありません');
        setChildren([]);
        setStats({
          totalChildren: 0,
          activeToday: 0,
          totalRecords: 0,
          unreadMessages: 0
        });
        return;
      }

      // 子供データを個別に取得・変換
      const processedChildren: ChildData[] = [];

      for (const facilityChild of facilityChildrenData || []) {
        try {
          // 子供の基本情報を取得
          const { data: childData, error: childError } = await supabase
            .from('children')
            .select('*')
            .eq('id', facilityChild.child_id)
            .single();

          if (childError || !childData) {
            console.warn('子供データ取得スキップ:', facilityChild.child_id);
            continue;
          }

          // 保護者情報を取得（ログイン情報を含む）
          let parentName = '保護者';
          let parentEmail = '';
          let parentUsername = '';
          let parentPassword = '';

          if (facilityChild.parent_user_id) {
            try {
              // 基本情報のみを取得（plain_passwordは取得しない）
              const { data: parentData, error: parentError } = await supabase
                .from('users')
                .select('display_name, username, email')
                .eq('id', facilityChild.parent_user_id)
                .maybeSingle();

              if (parentError) {
                console.warn('⚠️ 保護者情報取得エラー:', parentError.message);
              } else if (parentData) {
                parentName = parentData.display_name || parentData.username || '保護者';
                parentEmail = parentData.email || '';
                parentUsername = parentData.username || '';
                // パスワードは暗号化されているため表示しない
                parentPassword = '（パスワードは暗号化されています）';
              }
            } catch (parentFetchError) {
              console.warn('⚠️ 保護者情報取得エラー（例外）:', parentFetchError);
            }
          }

          processedChildren.push({
            id: childData.id,
            name: childData.name,
            age: childData.age,
            parentName,
            parentEmail,
            parentUsername,
            parentPassword,
            lastActivity: childData.updated_at,
            unreadMessages: 0,
            todayRecords: 0,
            status: 'active' as const,
            avatar: childData.name?.charAt(0)?.toUpperCase() || '?',
            birthdate: childData.birthdate || '',
            gender: childData.gender || 'female'
          });
        } catch (childProcessError) {
          console.warn('子供データ処理エラー:', facilityChild.child_id, childProcessError);
        }
      }

      setChildren(processedChildren);

      console.log('✅ 子供データ設定完了:', {
        count: processedChildren.length,
        childIds: processedChildren.map(c => ({ id: c.id, name: c.name }))
      });

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

  // 全メッセージを取得
  const fetchAllMessages = async () => {
    if (!user) return;

    try {
      // 管理者の施設IDを取得
      const facilityId = user.facility_id || await getOrCreateAdminFacilityId();
      if (!facilityId) {
        console.warn('施設IDが見つかりません - 全メッセージ取得をスキップ');
        return;
      }

      // 該当施設の全ての会話を取得
      const { data: conversations, error: convError } = await supabase
        .from('direct_chat_conversations')
        .select('id, child_id, parent_user_id')
        .eq('facility_id', facilityId);

      if (convError) {
        console.warn('会話取得エラー:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('会話が存在しません');
        setAllMessages([]);
        return;
      }

      const conversationIds = conversations.map(conv => conv.id);

      // 全てのメッセージを取得
      const { data: messages, error: msgError } = await supabase
        .from('direct_chat_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (msgError) {
        console.warn('メッセージ取得エラー:', msgError);
        return;
      }

      // メッセージをフォーマットして保存
      const formattedMessages = messages?.map(msg => {
        const conversation = conversations.find(conv => conv.id === msg.conversation_id);
        return {
          id: msg.id,
          childId: conversation?.child_id || '',
          conversationId: msg.conversation_id,
          sender: msg.sender_type === 'parent' ? 'parent' : 'admin',
          senderName: msg.sender_type === 'parent' ? '保護者' : '園の先生',
          message: msg.content,
          timestamp: msg.created_at,
          isRead: msg.is_read,
          senderUserId: msg.sender_user_id
        };
      }) || [];

      setAllMessages(formattedMessages);
      console.log(`📨 全メッセージ取得完了: ${formattedMessages.length}件`);
    } catch (error) {
      console.warn('全メッセージ取得エラー:', error);
    }
  };

  // 成長記録を取得（保護者が記録した「できた、嬉しい、気になる、困った」）
  const fetchGrowthRecords = async () => {
    if (!user) return;

    try {
      console.log('🔍 成長記録の取得を開始します...');

      // 管理者の施設IDを取得
      const facilityId = user.facility_id || await getOrCreateAdminFacilityId();
      if (!facilityId) {
        console.warn('施設IDが見つかりません - 成長記録取得をスキップ');
        return;
      }
      console.log('✅ 施設ID:', facilityId);

      // この施設に関連する子供のIDを取得
      console.log('🔍 施設に関連する子供を取得中...');
      const { data: facilityChildrenData, error: facilityChildrenError } = await supabase
        .from('facility_children')
        .select('child_id')
        .eq('facility_id', facilityId)
        .eq('status', 'active');

      if (facilityChildrenError) {
        console.error('❌ facility_children取得エラー:', facilityChildrenError.message);
        return;
      }

      const childIds = facilityChildrenData?.map(fc => fc.child_id) || [];
      console.log(`✅ 施設に関連する子供: ${childIds.length}人`, childIds);

      if (childIds.length === 0) {
        console.warn('⚠️ この施設にはまだ子供が登録されていません');
        setGrowthRecords([]);
        return;
      }

      // 1. recordsテーブルから「できた・嬉しい・できなかった・困った」を取得
      // facility_idでフィルタ OR child_idでフィルタ（過去のデータも取得）
      console.log('🔍 recordsテーブルから取得中...');
      const { data: records, error: recordsError } = await supabase
        .from('records')
        .select('id, child_id, user_id, category, note, timestamp, created_at, facility_id')
        .in('child_id', childIds)
        .order('created_at', { ascending: false });

      if (recordsError) {
        console.error('❌ records取得エラー:', recordsError.message);
      }

      console.log('✅ 取得したrecords数:', records?.length || 0);
      if (records && records.length > 0) {
        console.log('📋 recordsサンプル（最初の3件）:', records.slice(0, 3).map(r => ({
          id: r.id,
          child_id: r.child_id,
          category: r.category,
          note: r.note?.substring(0, 30),
          facility_id: r.facility_id,
          created_at: r.created_at
        })));
      }

      // 2. growth_recordsテーブルから写真付き成長記録を取得
      // child_idでフィルタ（過去のデータも取得）
      console.log('🔍 growth_recordsテーブルから取得中...');
      const { data: growthRecordsData, error: growthRecordsError } = await supabase
        .from('growth_records')
        .select('id, child_id, user_id, title, description, category, date, created_at, media_type, media_data, facility_id')
        .in('child_id', childIds)
        .order('created_at', { ascending: false });

      if (growthRecordsError) {
        console.error('❌ growth_records取得エラー:', growthRecordsError.message);
      }

      console.log('✅ 取得したgrowth_records数:', growthRecordsData?.length || 0);
      if (growthRecordsData && growthRecordsData.length > 0) {
        console.log('📋 growth_recordsサンプル（最初の3件）:', growthRecordsData.slice(0, 3).map(gr => ({
          id: gr.id,
          child_id: gr.child_id,
          title: gr.title,
          category: gr.category,
          facility_id: gr.facility_id,
          created_at: gr.created_at
        })));
      }

      // データを整形（子供情報は既存のchildrenから取得）
      const formattedRecords = [];

      // recordsテーブルのデータを整形
      for (const record of records || []) {
        try {
          // 子供情報を取得（メモリ内のchildrenまたはDBから）
          let childName = '不明';
          let childAge = 0;
          let parentName = '保護者';

          const child = children.find(c => c.id === record.child_id);
          if (child) {
            childName = child.name;
            childAge = child.age;
            parentName = child.parentName;
          } else {
            // メモリにない場合はDBから取得
            const { data: childData } = await supabase
              .from('children')
              .select('name, age')
              .eq('id', record.child_id)
              .maybeSingle();

            if (childData) {
              childName = childData.name || '不明';
              childAge = childData.age || 0;
            }
          }

          formattedRecords.push({
            id: record.id,
            childId: record.child_id,
            childName,
            childAge,
            parentName,
            category: record.category,
            note: record.note,
            timestamp: record.timestamp || record.created_at,
            createdAt: record.created_at,
            source: 'records'
          });
        } catch (recordProcessError) {
          console.warn('⚠️ 記録処理エラー:', record.id, recordProcessError);
        }
      }

      // growth_recordsテーブルのデータを整形して追加
      for (const growthRecord of growthRecordsData || []) {
        try {
          // 子供情報を取得（メモリ内のchildrenまたはDBから）
          let childName = '不明';
          let childAge = 0;
          let parentName = '保護者';

          const child = children.find(c => c.id === growthRecord.child_id);
          if (child) {
            childName = child.name;
            childAge = child.age;
            parentName = child.parentName;
          } else {
            // メモリにない場合はDBから取得
            const { data: childData } = await supabase
              .from('children')
              .select('name, age')
              .eq('id', growthRecord.child_id)
              .maybeSingle();

            if (childData) {
              childName = childData.name || '不明';
              childAge = childData.age || 0;
            }
          }

          // growth_recordsのカテゴリをrecordsのカテゴリにマッピング
          const mappedCategory = growthRecord.category === 'achievement' ? 'achievement' : 'happy';

          formattedRecords.push({
            id: growthRecord.id,
            childId: growthRecord.child_id,
            childName,
            childAge,
            parentName,
            category: mappedCategory,
            note: `${growthRecord.title}${growthRecord.description ? '\n' + growthRecord.description : ''}${growthRecord.media_type ? '\n📷 写真付き' : ''}`,
            timestamp: growthRecord.created_at,
            createdAt: growthRecord.created_at,
            source: 'growth_records',
            hasMedia: !!growthRecord.media_type
          });
        } catch (growthRecordProcessError) {
          console.warn('⚠️ 成長記録処理エラー:', growthRecord.id, growthRecordProcessError);
        }
      }

      // 作成日時でソート（新しい順）
      formattedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setGrowthRecords(formattedRecords);
      console.log(`📊 成長記録取得完了: ${formattedRecords.length}件 (records: ${records?.length || 0}件 + growth_records: ${growthRecordsData?.length || 0}件)`);

      if (formattedRecords.length > 0) {
        console.log('📋 成長記録サンプル:', formattedRecords.slice(0, 2));
      }
    } catch (error) {
      console.error('成長記録取得エラー:', error);
      setGrowthRecords([]);
    }
  };

  // 未読メッセージ数を取得
  const fetchUnreadMessagesCount = async () => {
    if (!user) return;

    try {
      // 管理者の施設IDを取得
      const facilityId = user.facility_id || await getOrCreateAdminFacilityId();
      if (!facilityId) {
        console.warn('施設IDが見つかりません - 未読数を0に設定');
        setUnreadMessagesCount(0);
        setStats(prevStats => ({
          ...prevStats,
          unreadMessages: 0
        }));
        return;
      }

      // まず該当施設の会話IDを取得
      const { data: conversations, error: convError } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('facility_id', facilityId);

      if (convError) {
        console.warn('会話取得エラー - 未読数を0に設定:', convError);
        setUnreadMessagesCount(0);
        setStats(prevStats => ({
          ...prevStats,
          unreadMessages: 0
        }));
        return;
      }

      if (!conversations || conversations.length === 0) {
        // 会話が存在しない場合は未読数0
        setUnreadMessagesCount(0);
        setStats(prevStats => ({
          ...prevStats,
          unreadMessages: 0
        }));
        console.log('🔔 会話が存在しないため未読数: 0');
        return;
      }

      const conversationIds = conversations.map(conv => conv.id);

      // 未読メッセージを取得
      const { data: unreadMessages, error: msgError } = await supabase
        .from('direct_chat_messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .eq('sender_type', 'parent')
        .eq('is_read', false);

      if (msgError) {
        console.warn('未読メッセージ取得エラー - 未読数を0に設定:', msgError);
        setUnreadMessagesCount(0);
        setStats(prevStats => ({
          ...prevStats,
          unreadMessages: 0
        }));
        return;
      }

      const count = unreadMessages?.length || 0;
      setUnreadMessagesCount(count);

      // statsの未読メッセージ数も更新
      setStats(prevStats => ({
        ...prevStats,
        unreadMessages: count
      }));

      console.log('🔔 未読メッセージ数更新:', count);
    } catch (error) {
      console.warn('未読メッセージ数取得エラー - 未読数を0に設定:', error);
      setUnreadMessagesCount(0);
      setStats(prevStats => ({
        ...prevStats,
        unreadMessages: 0
      }));
    }
  };

  // チャットを開いたときにメッセージを既読にする
  const markMessagesAsRead = async (childId: string) => {
    if (!user) return;

    try {
      // 管理者の施設IDを取得
      const facilityId = user.facility_id || await getOrCreateAdminFacilityId();
      if (!facilityId) {
        console.error('施設IDが見つかりません');
        return;
      }

      // 指定された子供に関する保護者からのメッセージを既読にする
      const { data: conversation } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', childId)
        .eq('facility_id', facilityId)
        .maybeSingle();

      if (conversation) {
        const { error } = await supabase
          .from('direct_chat_messages')
          .update({ is_read: true })
          .eq('conversation_id', conversation.id)
          .eq('sender_type', 'parent')
          .eq('is_read', false);

        if (error) {
          console.error('既読更新エラー:', error);
        } else {
          console.log('📖 メッセージを既読に更新');
          // 未読数を再取得
          fetchUnreadMessagesCount().catch(error => {
            console.warn('既読後未読数更新失敗:', error);
          });
        }
      }
    } catch (error) {
      console.error('既読更新エラー:', error);
    }
  };

  // 送信済み一斉メッセージを取得
  const loadAnnouncements = async () => {
    try {
      // 施設IDを取得
      const facilityId = await getOrCreateAdminFacilityId();
      if (!facilityId) {
        console.warn('施設IDが見つかりません');
        return;
      }

      const { data, error } = await supabase
        .from('announcement_messages')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ お知らせ取得エラー:', error);
        return;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error('❌ お知らせ取得エラー:', error);
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
      const loadData = async () => {
        // まず子供データを取得
        await fetchChildren();

        // 子供データ取得後に依存する処理を実行
        fetchAllMessages().catch(error => {
          console.warn('全メッセージ取得失敗:', error);
        });

        // 成長記録を取得（子供データに依存）
        await fetchGrowthRecords().catch(error => {
          console.warn('成長記録取得失敗:', error);
        });

        fetchUnreadMessagesCount().catch(error => {
          console.warn('初期未読数取得失敗:', error);
        });

        loadAnnouncements().catch(error => {
          console.warn('お知らせ取得失敗:', error);
        });
      };

      loadData();
    }
  }, [user, showFirstTimeSetup]);

  // リアルタイム連動：成長記録の自動更新（Supabase Realtime）
  useEffect(() => {
    if (!user || showFirstTimeSetup) return;

    console.log('🔄 成長記録リアルタイム連動を開始');

    // recordsテーブルの変更を監視（保護者の記録）- すべてのイベントを監視
    const recordsSubscription = supabase
      .channel('admin-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべてを監視
          schema: 'public',
          table: 'records'
        },
        (payload) => {
          console.log('✨✨✨ 記録が変更されました（リアルタイム）:', payload.eventType, payload.new || payload.old);
          // 成長記録を即座に再取得
          fetchGrowthRecords().catch(error => {
            console.warn('記録自動更新エラー:', error);
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 recordsテーブル接続状態:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ recordsテーブルのリアルタイム連動が正常に開始されました');
          // 接続成功後、すぐに過去のデータを取得
          console.log('🔄 過去のデータを含めて成長記録を取得中...');
          fetchGrowthRecords().catch(error => {
            console.warn('初回データ取得エラー:', error);
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ recordsテーブルのリアルタイム連動でエラーが発生しました');
        }
      });

    // growth_recordsテーブルの変更を監視（写真付き成長記録）- すべてのイベントを監視
    const growthRecordsSubscription = supabase
      .channel('admin-growth-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべてを監視
          schema: 'public',
          table: 'growth_records'
        },
        (payload) => {
          console.log('✨✨✨ 成長記録（写真付き）が変更されました（リアルタイム）:', payload.eventType, payload.new || payload.old);
          // 成長記録を即座に再取得
          fetchGrowthRecords().catch(error => {
            console.warn('成長記録自動更新エラー:', error);
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 growth_recordsテーブル接続状態:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ growth_recordsテーブルのリアルタイム連動が正常に開始されました');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ growth_recordsテーブルのリアルタイム連動でエラーが発生しました');
        }
      });

    // 定期的にデータを再取得（バックアップ）
    const pollingInterval = setInterval(() => {
      console.log('🔄 定期更新: 成長記録を再取得');
      fetchGrowthRecords().catch(error => {
        console.warn('定期更新エラー:', error);
      });
    }, 30000); // 30秒ごと

    // クリーンアップ：コンポーネントのアンマウント時にサブスクリプションを解除
    return () => {
      console.log('🛑 リアルタイム連動を停止');
      recordsSubscription.unsubscribe();
      growthRecordsSubscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [user, showFirstTimeSetup]);

  // 定期的に未読メッセージ数を更新（バックアップとして30秒ごと）
  useEffect(() => {
    if (!user || showFirstTimeSetup) return;

    // 30秒ごとに未読数を確認
    const interval = setInterval(() => {
      fetchUnreadMessagesCount().catch(error => {
        console.warn('定期的未読数取得失敗:', error);
      });
    }, 30000); // 30秒間隔

    return () => clearInterval(interval);
  }, [user, showFirstTimeSetup]);

  // 管理者の施設IDを取得する共通関数
  const getOrCreateAdminFacilityId = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // まず、この管理者が管理する施設を取得
      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (!facilityError && facilityData) {
        return facilityData.id;
      }

      // 施設が存在しない場合は新しく作成
      console.log('管理者用施設が見つからないため、新規作成します...');

      const { data: newFacility, error: createError } = await supabase
        .from('facilities')
        .insert({
          name: user.facility?.name || '新しい施設',
          facility_code: `FAC-${user.id.slice(0, 8)}`,
          admin_user_id: user.id,
          address: user.facility?.address,
          phone: user.facility?.phone,
          email: user.facility?.email
        })
        .select('id')
        .single();

      if (createError || !newFacility) {
        console.error('施設作成エラー:', createError);
        return null;
      }

      return newFacility.id;
    } catch (error) {
      console.error('施設ID取得エラー:', error);
      return null;
    }
  };

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

  // LINEのような相対時間表示
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '今';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 24 * 60) {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}時間前`;
    } else if (diffInMinutes < 7 * 24 * 60) {
      const diffInDays = Math.floor(diffInMinutes / (24 * 60));
      return `${diffInDays}日前`;
    } else {
      // 1週間以上前は日付を表示
      return date.toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric'
      });
    }
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
    console.log('🔧 管理者チャット開始:', {
      childId,
      adminId: user?.id
    });

    setChatChild(childId);
    // チャット開始時にメッセージをロード
    await loadChatMessages(childId);
    // チャットを開いたときにメッセージを既読にする
    await markMessagesAsRead(childId);
  };

  // チャットメッセージをロード（管理者と保護者の会話）
  const loadChatMessages = async (childId: string) => {
    if (!user) return;

    try {
      // facility_childrenテーブルから正しい保護者IDと施設IDを取得
      const { data: facilityChild, error: facilityChildError } = await supabase
        .from('facility_children')
        .select('parent_user_id, facility_id')
        .eq('child_id', childId)
        .maybeSingle(); // singleではなくmaybeSingleを使用

      if (facilityChildError || !facilityChild) {
        console.error('facility_children情報が見つかりません:', facilityChildError, childId);
        return;
      }

      // 会話を取得または作成
      const { data: conversation, error: convError } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', childId)
        .eq('parent_user_id', facilityChild.parent_user_id)
        .eq('facility_id', facilityChild.facility_id)
        .maybeSingle(); // singleではなくmaybeSingleを使用

      let conversationId = conversation?.id;

      if (convError) {
        console.error('会話取得エラー:', convError);
        return;
      }

      if (!conversation) {
        // 会話が存在しない場合は新規作成
        const { data: newConversation, error: createError } = await supabase
          .from('direct_chat_conversations')
          .insert({
            child_id: childId,
            parent_user_id: facilityChild.parent_user_id,
            facility_id: facilityChild.facility_id,
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
        senderName: msg.sender_type === 'parent' ? '保護者' : '園の先生',
        message: msg.content,
        timestamp: msg.created_at
      }));

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('チャットメッセージ取得エラー:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatChild || !user) {
      console.error('🔧 チャット送信失敗: 必要な情報が不足', {
        hasMessage: !!newMessage.trim(),
        hasChatChild: !!chatChild,
        hasUser: !!user
      });
      return;
    }

    console.log('🔧 管理者チャット送信開始:', {
      message: newMessage.trim(),
      chatChild,
      adminId: user.id
    });

    try {
      // facility_children テーブルから保護者IDを正しく取得
      const { data: facilityChild, error: facilityChildError } = await supabase
        .from('facility_children')
        .select('parent_user_id, facility_id')
        .eq('child_id', chatChild)
        .eq('status', 'active')
        .maybeSingle();

      console.log('🔧 facility_children確認結果:', {
        facilityChild,
        error: facilityChildError?.message,
        childId: chatChild
      });

      if (facilityChildError || !facilityChild) {
        console.error('保護者情報取得エラー:', facilityChildError);
        alert(`保護者情報が見つかりませんでした。\n\nエラー詳細:\n${facilityChildError?.message || '不明なエラー'}\n\n対象園児ID: ${chatChild}`);
        return;
      }

      // 会話を取得または作成
      let conversation;
      const { data: existingConv, error: convFetchError } = await supabase
        .from('direct_chat_conversations')
        .select('id')
        .eq('child_id', chatChild)
        .eq('parent_user_id', facilityChild.parent_user_id)
        .eq('facility_id', facilityChild.facility_id)
        .maybeSingle();

      if (existingConv) {
        conversation = existingConv;
      } else {
        // 会話が存在しない場合は新しく作成
        const { data: newConv, error: convCreateError } = await supabase
          .from('direct_chat_conversations')
          .insert({
            child_id: chatChild,
            parent_user_id: facilityChild.parent_user_id,
            facility_id: facilityChild.facility_id,
            status: 'active'
          })
          .select('id')
          .single();

        if (convCreateError || !newConv) {
          console.error('会話作成エラー:', convCreateError);
          alert('チャットの開始に失敗しました。');
          return;
        }
        conversation = newConv;
      }

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
        senderName: '園の先生',
        message: newMessage,
        timestamp: savedMessage.created_at
      };

      setChatMessages([...chatMessages, newMessageObj]);
      setNewMessage('');

      // メッセージ送信後に未読数を更新（他の会話の未読数もある可能性があるため）
      fetchUnreadMessagesCount().catch(error => {
        console.warn('送信後未読数更新失敗:', error);
      });

      // 全メッセージも更新
      fetchAllMessages().catch(error => {
        console.warn('送信後全メッセージ更新失敗:', error);
      });
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

      // 5. facility_childrenテーブルから関連データを取得して削除
      const { data: facilityChild, error: facilityChildSelectError } = await supabase
        .from('facility_children')
        .select('parent_user_id')
        .eq('child_id', deletingChild.id)
        .single();

      if (facilityChildSelectError) {
        console.warn('facility_children情報取得エラー:', facilityChildSelectError);
      }

      // facility_childrenエントリを削除
      const { error: facilityChildError } = await supabase
        .from('facility_children')
        .delete()
        .eq('child_id', deletingChild.id);

      if (facilityChildError) {
        console.warn('facility_children削除エラー:', facilityChildError);
      }

      // 6. 関連する保護者アカウントを削除
      if (facilityChild && facilityChild.parent_user_id) {
        const { error: parentUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', facilityChild.parent_user_id)
          .eq('user_type', 'parent'); // 安全のため、親ユーザーのみ削除

        if (parentUserError) {
          console.warn('保護者アカウント削除エラー:', parentUserError);
        } else {
          console.log('保護者アカウントも削除しました');
        }
      }

      // 7. 園児データを削除
      const { error: childError } = await supabase
        .from('children')
        .delete()
        .eq('id', deletingChild.id);

      if (childError) {
        console.error('園児データ削除エラー:', childError);
        alert('園児データの削除に失敗しました。');
        return;
      }

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

      // 園児情報を更新
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

      // 保護者のログイン情報が変更されている場合は更新
      if (editingChild.parentUsername || editingChild.parentPassword) {
        // 親ユーザーIDを取得
        const facilityId = await getOrCreateAdminFacilityId();
        const { data: facilityChildData } = await supabase
          .from('facility_children')
          .select('parent_user_id')
          .eq('child_id', editingChild.id)
          .eq('facility_id', facilityId)
          .single();

        if (facilityChildData?.parent_user_id) {
          const updateData: any = {
            display_name: editingChild.parentName,
            email: editingChild.parentEmail || null,
            updated_at: new Date().toISOString()
          };

          // ユーザー名が変更されている場合
          if (editingChild.parentUsername) {
            updateData.username = editingChild.parentUsername;
          }

          // パスワードが変更されている場合（6文字以上の場合のみ）
          if (editingChild.parentPassword &&
            editingChild.parentPassword.length >= 6 &&
            editingChild.parentPassword !== '（未設定）' &&
            editingChild.parentPassword !== '（パスワードは暗号化されています）') {
            updateData.password = hashPassword(editingChild.parentPassword);
          }

          const { error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', facilityChildData.parent_user_id);

          if (userError) {
            console.error('保護者ログイン情報更新エラー:', userError);
            alert('保護者のログイン情報の更新に失敗しました。');
            return;
          }

          console.log('保護者ログイン情報更新成功');
        }
      }

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

    // パスワード長のバリデーション
    if (newChild.parentPassword.length < 6) {
      alert('パスワードは6文字以上で入力してください。\n現在の文字数: ' + newChild.parentPassword.length + '文字');
      return;
    }

    try {
      setLoading(true);

      // まず、ユーザー名の重複チェック
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('id')
        .eq('username', newChild.parentUsername)
        .maybeSingle(); // singleではなくmaybeSingleを使用して0件でもエラーにしない

      if (checkUserError) {
        console.error('ユーザー名重複チェックエラー:', checkUserError);
        alert('ユーザー名の確認に失敗しました。もう一度お試しください。');
        setLoading(false);
        return;
      }

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
          user_type: 'parent',
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

      // 管理者の施設IDを取得
      const facilityId = await getOrCreateAdminFacilityId();
      if (!facilityId) {
        // ロールバック
        await supabase.from('children').delete().eq('id', childData.id);
        await supabase.from('users').delete().eq('id', parentUser.id);
        alert('施設情報の取得に失敗しました。');
        return;
      }

      console.log('facility_children作成前チェック:', {
        child_id: childData.id,
        parent_user_id: parentUser.id,
        facility_id: facilityId
      });


      // 既存の関連付けをチェック
      const { data: existingRelation, error: checkError } = await supabase
        .from('facility_children')
        .select('id')
        .eq('child_id', childData.id)
        .eq('facility_id', facilityId)
        .maybeSingle(); // singleではなくmaybeSingleを使用

      if (checkError) {
        console.error('既存関連付けチェックエラー:', checkError);
        await supabase.from('children').delete().eq('id', childData.id);
        await supabase.from('users').delete().eq('id', parentUser.id);
        alert('関連付け確認に失敗しました。管理者にお問い合わせください。');
        return;
      }

      // 関連付けを作成または更新
      const facilityChildData = {
        child_id: childData.id,
        facility_id: facilityId,
        parent_user_id: parentUser.id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        has_support_limit_management: false,
        contracted_support_hours: 0,
        monthly_fee: 0
      };

      let facilityChildError = null;

      if (existingRelation) {
        // 既存の場合は更新
        const { error } = await supabase
          .from('facility_children')
          .update(facilityChildData)
          .eq('id', existingRelation.id);
        facilityChildError = error;
      } else {
        // 新規の場合は挿入
        const { error } = await supabase
          .from('facility_children')
          .insert(facilityChildData);
        facilityChildError = error;
      }

      if (facilityChildError) {
        console.error('facility_children関連付けエラー:', facilityChildError);
        console.error('エラー詳細:', JSON.stringify(facilityChildError, null, 2));
        // 失敗した場合、作成した園児と保護者アカウントを削除
        await supabase.from('children').delete().eq('id', childData.id);
        await supabase.from('users').delete().eq('id', parentUser.id);
        alert(`園児の関連付けに失敗しました。\nエラーコード: ${facilityChildError.code}\nメッセージ: ${facilityChildError.message}`);
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
        therapyTypes: []
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

  // 一斉メッセージ送信
  const sendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim() || !user) {
      alert('タイトルと本文を入力してください。');
      return;
    }

    setSendingAnnouncement(true);

    try {
      // 現在のユーザーの施設情報を取得
      const facilityId = await getOrCreateAdminFacilityId();

      if (!facilityId) {
        console.error('施設情報の取得に失敗しました');
        alert('施設情報の取得に失敗しました。');
        return;
      }

      // 一斉メッセージを保存
      const { data, error } = await supabase
        .from('announcement_messages')
        .insert({
          facility_id: facilityId,
          sender_facility_user_id: user.id,
          title: announcementTitle,
          content: announcementContent,
          priority: announcementPriority,
          category: announcementCategory,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('メッセージ送信エラー:', error);
        alert('メッセージの送信に失敗しました。');
        return;
      }

      // フォームをリセット
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementPriority('normal');
      setAnnouncementCategory('general');

      alert(`一斉メッセージを送信しました！\n${children.length}人の保護者に通知されます。`);

      // 送信済みメッセージ一覧を更新
      await loadAnnouncements();

    } catch (error) {
      console.error('エラー:', error);
      alert('メッセージの送信中にエラーが発生しました。');
    } finally {
      setSendingAnnouncement(false);
    }
  };


  // サイドバーメニュー
  const sidebarItems = [
    { id: 'management', label: '園児管理', icon: Users },
    { id: 'attendance', label: '出席記録', icon: BookOpen },
    { id: 'records', label: '成長記録', icon: Heart },
    { id: 'messages', label: 'メッセージ', icon: MessageSquare, badge: stats.unreadMessages },
    { id: 'announcements', label: '一斉お知らせ', icon: Megaphone },
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

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                保護者ログイン情報
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">ユーザー名:</span>
                                  <span className="text-blue-900 font-mono font-semibold bg-white px-2 py-1 rounded">
                                    {child.parentUsername || '未設定'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">パスワード:</span>
                                  <span className="text-blue-900 font-mono bg-white px-2 py-1 rounded">
                                    {child.parentPassword || '未設定'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-blue-600 mt-3 bg-blue-100 px-2 py-1 rounded">
                                💡 この情報を保護者の方にお伝えください
                              </p>
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
        // カテゴリ別ラベルと色
        const getCategoryInfo = (category: string) => {
          switch (category) {
            case 'achievement':
              return { label: 'できた', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' };
            case 'happy':
              return { label: '嬉しかった', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
            case 'failure':
              return { label: 'できなかった', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
            case 'trouble':
              return { label: '困った', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' };
            default:
              return { label: 'その他', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
          }
        };

        // 成長記録の検索とフィルター
        const getFilteredRecords = () => {
          let filtered = growthRecords;

          // 日次・週次・月次フィルター
          if (recordsViewMode === 'daily') {
            filtered = filtered.filter(record =>
              isSameDay(new Date(record.createdAt), recordsSelectedDate)
            );
          } else if (recordsViewMode === 'weekly') {
            const weekStart = startOfWeek(recordsSelectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(recordsSelectedDate, { weekStartsOn: 1 });
            filtered = filtered.filter(record => {
              const recordDate = new Date(record.createdAt);
              return recordDate >= weekStart && recordDate <= weekEnd;
            });
          } else if (recordsViewMode === 'monthly') {
            const monthStart = startOfMonth(recordsSelectedDate);
            const monthEnd = endOfMonth(recordsSelectedDate);
            filtered = filtered.filter(record => {
              const recordDate = new Date(record.createdAt);
              return recordDate >= monthStart && recordDate <= monthEnd;
            });
          }

          // カテゴリフィルタ
          if (recordsFilter !== 'all') {
            filtered = filtered.filter(record => record.category === recordsFilter);
          }

          // 子供フィルタ（選択された子供の記録のみ）
          if (selectedChildForRecords) {
            filtered = filtered.filter(record => record.childId === selectedChildForRecords);
          }

          // 検索
          if (recordsSearchQuery.trim()) {
            const query = recordsSearchQuery.toLowerCase();
            filtered = filtered.filter(record =>
              record.note.toLowerCase().includes(query) ||
              record.childName.toLowerCase().includes(query) ||
              record.parentName.toLowerCase().includes(query)
            );
          }

          return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        };

        const filteredRecords = getFilteredRecords();

        // 子供別の記録統計（全ての園児を表示）
        const childrenList = children.map((child) => {
          const childRecords = growthRecords.filter(r => r.childId === child.id);
          const recordsByCategory = {
            achievement: childRecords.filter(r => r.category === 'achievement').length,
            happy: childRecords.filter(r => r.category === 'happy').length,
            failure: childRecords.filter(r => r.category === 'failure').length,
            trouble: childRecords.filter(r => r.category === 'trouble').length
          };

          return {
            id: child.id,
            childId: child.id,
            childName: child.name,
            childAge: child.age,
            childGender: child.gender,
            parentName: child.parentName || '保護者',
            records: childRecords,
            recordsCount: childRecords.length,
            recordsByCategory,
            latestRecord: childRecords[0] // 最新の記録
          };
        });

        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">📊 成長記録</h1>
                <p className="text-gray-600 mt-1">保護者が記録した「できた・嬉しい・気になる・困った」を確認</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-2xl">
                  <span className="text-sm font-medium text-purple-600">
                    総記録数 {growthRecords.length}件
                  </span>
                </div>
              </div>
            </div>

            {/* 日次・週次・月次切り替えタブ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* タブ */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecordsViewMode('daily')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${recordsViewMode === 'daily'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    📅 日次
                  </button>
                  <button
                    onClick={() => setRecordsViewMode('weekly')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${recordsViewMode === 'weekly'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    📊 週次
                  </button>
                  <button
                    onClick={() => setRecordsViewMode('monthly')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${recordsViewMode === 'monthly'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    📆 月次
                  </button>
                </div>

                {/* 日付ナビゲーション */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (recordsViewMode === 'daily') {
                        setRecordsSelectedDate(subDays(recordsSelectedDate, 1));
                      } else if (recordsViewMode === 'weekly') {
                        setRecordsSelectedDate(subWeeks(recordsSelectedDate, 1));
                      } else if (recordsViewMode === 'monthly') {
                        setRecordsSelectedDate(subMonths(recordsSelectedDate, 1));
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="text-center min-w-[180px]">
                    <div className="text-base font-semibold text-gray-800">
                      {recordsViewMode === 'daily' && format(recordsSelectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                      {recordsViewMode === 'weekly' && `${format(startOfWeek(recordsSelectedDate, { weekStartsOn: 1 }), 'MM/dd', { locale: ja })} - ${format(endOfWeek(recordsSelectedDate, { weekStartsOn: 1 }), 'MM/dd', { locale: ja })}`}
                      {recordsViewMode === 'monthly' && format(recordsSelectedDate, 'yyyy年MM月', { locale: ja })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (recordsViewMode === 'daily') {
                        setRecordsSelectedDate(addDays(recordsSelectedDate, 1));
                      } else if (recordsViewMode === 'weekly') {
                        setRecordsSelectedDate(addWeeks(recordsSelectedDate, 1));
                      } else if (recordsViewMode === 'monthly') {
                        setRecordsSelectedDate(addMonths(recordsSelectedDate, 1));
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => setRecordsSelectedDate(new Date())}
                    className="ml-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    今日
                  </button>
                </div>
              </div>
            </div>

            {/* 検索・フィルター */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 検索ボックス */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={recordsSearchQuery}
                      onChange={(e) => setRecordsSearchQuery(e.target.value)}
                      placeholder="子供名、記録内容で検索..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 text-sm"
                    />
                  </div>
                </div>

                {/* カテゴリフィルター */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecordsFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordsFilter === 'all'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    全て
                  </button>
                  <button
                    onClick={() => setRecordsFilter('achievement')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordsFilter === 'achievement'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    できた
                  </button>
                  <button
                    onClick={() => setRecordsFilter('happy')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordsFilter === 'happy'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    嬉しい
                  </button>
                  <button
                    onClick={() => setRecordsFilter('failure')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordsFilter === 'failure'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    気になる
                  </button>
                  <button
                    onClick={() => setRecordsFilter('trouble')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordsFilter === 'trouble'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    困った
                  </button>
                </div>
              </div>
            </div>

            {/* メイン表示エリア */}
            {!selectedChildForRecords ? (
              /* 園児一覧 */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-700">園児の記録一覧</h2>
                  {(recordsSearchQuery.trim() || recordsFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setRecordsSearchQuery('');
                        setRecordsFilter('all');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      フィルタークリア
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childrenList.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChildForRecords(child.childId)}
                      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-purple-200 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {child.childName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{child.childName}</h3>
                          <p className="text-sm text-gray-500">{child.childAge}歳 • 保護者: {child.parentName}</p>
                          <p className="text-xs text-gray-400">{child.recordsCount}件の記録</p>
                        </div>
                      </div>

                      {/* カテゴリ別件数 */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-green-700 font-medium">できた</div>
                          <div className="text-sm font-bold text-green-800">{child.recordsByCategory.achievement}件</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-yellow-700 font-medium">嬉しかった</div>
                          <div className="text-sm font-bold text-yellow-800">{child.recordsByCategory.happy}件</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-blue-700 font-medium">できなかった</div>
                          <div className="text-sm font-bold text-blue-800">{child.recordsByCategory.failure}件</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-red-700 font-medium">困った</div>
                          <div className="text-sm font-bold text-red-800">{child.recordsByCategory.trouble}件</div>
                        </div>
                      </div>

                      {/* 最新記録 */}
                      {child.latestRecord && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">最新: </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getCategoryInfo(child.latestRecord.category).color} text-white`}>
                            {getCategoryInfo(child.latestRecord.category).label}
                          </span>
                          {child.latestRecord.note.substring(0, 25)}
                          {child.latestRecord.note.length > 25 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {childrenList.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">成長記録がありません</h3>
                    <p className="text-sm text-gray-500">保護者の方からの記録がここに表示されます</p>
                  </div>
                )}
              </div>
            ) : (
              /* 選択された園児の記録詳細 */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedChildForRecords(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {childrenList.find(c => c.childId === selectedChildForRecords)?.childName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {childrenList.find(c => c.childId === selectedChildForRecords)?.childName}さんの記録
                      </h2>
                      <p className="text-sm text-gray-500">
                        {filteredRecords.length}件の記録 • {childrenList.find(c => c.childId === selectedChildForRecords)?.childAge}歳
                      </p>
                    </div>
                  </div>
                </div>

                {/* カテゴリー別統計 */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">カテゴリー別記録数</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {filteredRecords.filter(r => r.category === 'achievement').length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">できた</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {filteredRecords.filter(r => r.category === 'happy').length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">嬉しかった</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {filteredRecords.filter(r => r.category === 'failure').length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">できなかった</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {filteredRecords.filter(r => r.category === 'trouble').length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">困った</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredRecords.map((record) => {
                    const categoryInfo = getCategoryInfo(record.category);
                    return (
                      <div
                        key={record.id}
                        className={`${categoryInfo.bgColor} border border-gray-100 rounded-xl p-4`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 ${categoryInfo.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                            {categoryInfo.label.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-3 py-1 ${categoryInfo.color} text-white text-xs font-medium rounded-full`}>
                                {categoryInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getRelativeTime(record.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm ${categoryInfo.textColor} font-medium mb-1`}>
                              {record.note}
                            </p>
                            <p className="text-xs text-gray-500">
                              記録者: {record.authorName}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">条件に一致する記録が見つかりませんでした</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'messages':
        // メッセージのフィルタリングと検索
        const getFilteredMessages = () => {
          let filtered = allMessages;

          // フィルタリング
          if (messageFilter === 'unread') {
            filtered = filtered.filter(msg => msg.sender === 'parent' && !msg.isRead);
          } else if (messageFilter === 'today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(msg => new Date(msg.timestamp).toDateString() === today);
          }

          // 検索
          if (messageSearchQuery.trim()) {
            const query = messageSearchQuery.toLowerCase();
            filtered = filtered.filter(msg => {
              const child = children.find(c => c.id === msg.childId);
              return (
                msg.message.toLowerCase().includes(query) ||
                child?.name.toLowerCase().includes(query) ||
                child?.parentName.toLowerCase().includes(query)
              );
            });
          }

          return filtered;
        };

        const filteredMessages = getFilteredMessages();

        // チャット相手別にグループ化
        const groupedMessages = children.map(child => {
          const childMessages = allMessages.filter(msg => msg.childId === child.id);
          const latestMessage = childMessages[0]; // 新しい順にソート済み
          const unreadCount = childMessages.filter(msg => msg.sender === 'parent' && !msg.isRead).length;

          return {
            ...child,
            messages: childMessages,
            latestMessage,
            unreadCount,
            hasMessages: childMessages.length > 0
          };
        }).filter(item => item.hasMessages);

        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">💬 保護者との連絡</h1>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-red-100 to-pink-100 px-4 py-2 rounded-2xl">
                  <span className="text-sm font-medium text-red-600">
                    未読 {stats.unreadMessages}件
                  </span>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-2xl">
                  <span className="text-sm font-medium text-blue-600">
                    総メッセージ {allMessages.length}件
                  </span>
                </div>
              </div>
            </div>

            {/* 検索・フィルター */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 検索ボックス */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      placeholder="保護者名、子供名、メッセージ内容で検索..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-sm"
                    />
                  </div>
                </div>

                {/* フィルター */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMessageFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${messageFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    全て
                  </button>
                  <button
                    onClick={() => setMessageFilter('unread')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${messageFilter === 'unread'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    未読のみ
                  </button>
                  <button
                    onClick={() => setMessageFilter('today')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${messageFilter === 'today'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    今日
                  </button>
                </div>
              </div>
            </div>

            {/* メッセージ表示切り替え */}
            {messageSearchQuery.trim() || messageFilter !== 'all' ? (
              /* 検索・フィルター結果 */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-700">
                    検索結果 ({filteredMessages.length}件)
                  </h2>
                  {(messageSearchQuery.trim() || messageFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setMessageSearchQuery('');
                        setMessageFilter('all');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      クリア
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredMessages.map((msg) => {
                    const child = children.find(c => c.id === msg.childId);
                    if (!child) return null;

                    return (
                      <div
                        key={msg.id}
                        onClick={() => startChat(child.id)}
                        className="bg-white rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {child.parentName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-gray-900 text-sm">{child.parentName}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">
                                  {getRelativeTime(msg.timestamp)}
                                </span>
                                {msg.sender === 'parent' && !msg.isRead && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {child.name}さん ({child.age}歳) について
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.sender === 'parent' ? 'bg-blue-400' : 'bg-orange-400'
                                }`}></span>
                              <p className="text-sm text-gray-700">
                                {msg.sender === 'parent' ? '' : '園: '}
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredMessages.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">検索条件に一致するメッセージが見つかりませんでした</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* LINEスタイルのチャットリスト */
              <div className="space-y-2">
                {groupedMessages.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => startChat(item.id)}
                    className={`bg-white rounded-xl border px-4 py-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${item.unreadCount > 0 ? 'border-blue-200 shadow-sm' : 'border-gray-100'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {item.parentName.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-base ${item.unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                            {item.parentName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {item.latestMessage && (
                              <span className="text-xs text-gray-400 font-medium">
                                {getRelativeTime(item.latestMessage.timestamp)}
                              </span>
                            )}
                            {item.unreadCount > 0 && (
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {item.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-1 font-medium">
                          {item.name}さん（{item.age}歳）について • {item.messages.length}件のメッセージ
                        </p>

                        {item.latestMessage ? (
                          <p className={`text-sm truncate ${item.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}>
                            {item.latestMessage.sender === 'parent' ? '' : '園: '}
                            {item.latestMessage.message}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">メッセージはありません</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* メッセージがない場合 */}
                {groupedMessages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">まだメッセージがありません</h3>
                    <p className="text-sm text-gray-500">保護者の方からのメッセージがここに表示されます</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'announcements':
        return (
          <div className="space-y-6">
            {/* 一斉お知らせヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">一斉お知らせ</h2>
                <p className="text-sm text-gray-500 mt-1">園の全保護者に一斉メッセージを送信できます</p>
              </div>

              {/* 一斉メッセージ作成フォーム */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* カテゴリー選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                    <select
                      value={announcementCategory}
                      onChange={(e) => setAnnouncementCategory(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    >
                      <option value="general">一般</option>
                      <option value="event">行事・イベント</option>
                      <option value="notice">お知らせ</option>
                      <option value="schedule">スケジュール</option>
                      <option value="emergency">緊急</option>
                    </select>
                  </div>

                  {/* 重要度選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">重要度</label>
                    <select
                      value={announcementPriority}
                      onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    >
                      <option value="normal">通常</option>
                      <option value="high">重要</option>
                      <option value="urgent">緊急</option>
                    </select>
                  </div>
                </div>

                {/* タイトル入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="お知らせのタイトルを入力してください"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  />
                </div>

                {/* 本文入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">本文</label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="お知らせの内容を入力してください"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                  />
                </div>

                {/* 送信予定先 */}
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                  <div className="flex items-center space-x-2 text-pink-700">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">送信予定先: {children.length}人の保護者</span>
                  </div>
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end">
                  <button
                    onClick={sendAnnouncement}
                    disabled={sendingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl hover:from-pink-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="w-5 h-5" />
                    <span>{sendingAnnouncement ? '送信中...' : '一斉送信'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 送信済みお知らせ一覧 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">送信済みお知らせ</h3>
                <p className="text-sm text-gray-500 mt-1">過去に送信したお知らせの一覧です</p>
              </div>

              <div className="p-6">
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">まだお知らせを送信していません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {announcement.priority === 'urgent' ? '緊急' :
                                  announcement.priority === 'high' ? '重要' : '通常'}
                              </span>
                              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-medium">
                                {announcement.category === 'general' ? '一般' :
                                  announcement.category === 'event' ? 'イベント' :
                                    announcement.category === 'notice' ? 'お知らせ' :
                                      announcement.category === 'schedule' ? 'スケジュール' :
                                        announcement.category === 'emergency' ? '緊急' : announcement.category}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{announcement.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{announcement.content}</p>
                            <div className="mt-3 text-xs text-gray-500">
                              送信日時: {new Date(announcement.created_at).toLocaleString('ja-JP')}
                              {announcement.sender_facility_user?.display_name &&
                                ` • 送信者: ${announcement.sender_facility_user.display_name}`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            onClick={() => setShowLogoutConfirm(true)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者アプリのログインID <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newChild.parentUsername}
                        onChange={(e) => setNewChild({ ...newChild, parentUsername: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="yamada_taro"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">※保護者がアプリにログインする際のID（半角英数字推奨）</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">保護者アプリのパスワード <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={newChild.parentPassword}
                        onChange={(e) => setNewChild({ ...newChild, parentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="6文字以上で入力してください"
                        minLength={6}
                        required
                      />
                      {newChild.parentPassword && newChild.parentPassword.length < 6 && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                          ⚠️ パスワードは6文字以上で入力してください（現在: {newChild.parentPassword.length}文字）
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">※この情報を保護者にお伝えください（必ず6文字以上）</p>
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
                    <div className={`flex items-end space-x-2 max-w-[75%] ${message.sender === 'admin' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* アイコンは相手側のみ表示 (LINE風) */}
                      {message.sender !== 'admin' && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md mb-1">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className="flex flex-col">
                        <div
                          className={`${message.sender === 'admin'
                            ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-2xl rounded-br-sm shadow-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm'
                            } px-4 py-2.5`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${message.sender === 'admin' ? 'text-right' : 'text-left'} px-1`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* メッセージ入力 */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end space-x-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`${children.find(c => c.id === chatChild)?.parentName || 'ご家族'}にメッセージを送信...\n\nShift + Enter: 改行\nEnter: 送信`}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all duration-200 resize-none min-h-[60px] max-h-[200px]"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  style={{
                    overflowY: 'auto',
                    scrollbarWidth: 'thin'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-2xl hover:from-pink-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex-shrink-0"
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

                  {/* ログイン情報編集 */}
                  <div className="mt-4 bg-blue-50 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-3">保護者アプリのログイン情報</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ログインID（ユーザー名）</label>
                        <input
                          type="text"
                          value={editingChild.parentUsername || ''}
                          onChange={(e) => setEditingChild({ ...editingChild, parentUsername: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="yamada_taro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                        <input
                          type="text"
                          value={editingChild.parentPassword || ''}
                          onChange={(e) => setEditingChild({ ...editingChild, parentPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="6文字以上"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 ログイン情報を変更すると、保護者の方は新しい情報でログインする必要があります
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

      {/* ログアウト確認ダイアログ */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          await logout();
          setShowLogoutConfirm(false);
        }}
      />
    </div>
  );
};

export default App;