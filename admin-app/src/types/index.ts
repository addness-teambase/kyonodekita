// 管理者版「今日のできた」の型定義

// 園児情報
export interface ChildInfo {
  id: string;
  name: string;
  age: number;
  birthdate: string;
  gender: 'male' | 'female';
  parentName: string;
  parentEmail: string;
  lastActivity: string;
  unreadMessages: number;
  todayRecords: number;
  status: 'active' | 'inactive';
  avatar: string;
  attendanceStatus?: 'scheduled' | 'present' | 'absent' | 'late' | 'early_departure' | 'sick';
  scheduledArrivalTime?: string;
  scheduledDepartureTime?: string;
  actualArrivalTime?: string;
  actualDepartureTime?: string;

  // 発達障害関連の詳細項目
  hasSupportLimitManagement?: boolean; // 上限管理事業所の有無
  supportCertificateExpiry?: string; // 受給者証の期限
  contractedSupportHours?: number; // 契約支給量（時間/月）
  consultationSupportOffice?: string; // 相談支援事業所
  consultationSupportStaffName?: string; // 相談支援員の名前
  consultationSupportStaffPhone?: string; // 相談支援員の電話番号
  diagnosis?: string; // 診断名
  supportLevel?: string; // 支援レベル
  therapyTypes?: string[]; // 受けている療法の種類
}

// カレンダーイベント
export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time?: string;
  description?: string;
  event_type?: 'facility' | 'child_specific' | 'parent_meeting' | 'holiday' | 'emergency';
  is_attendance_affecting?: boolean;
  affected_children?: string[];
  child_id?: string;
}

// 出席予定
export interface AttendanceSchedule {
  id: string;
  child_id: string;
  date: string;
  scheduled_arrival_time?: string;
  scheduled_departure_time?: string;
  actual_arrival_time?: string;
  actual_departure_time?: string;
  attendance_status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_departure' | 'sick';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  child?: ChildInfo;
}

// 出席パターン
export interface AttendancePattern {
  id: string;
  child_id: string;
  day_of_week: number; // 0=日曜, 1=月曜, ...
  usual_arrival_time?: string;
  usual_departure_time?: string;
  is_active: boolean;
  effective_from?: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

// 日次出席サマリー
export interface DailyAttendanceSummary {
  id: string;
  date: string;
  total_scheduled: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_early_departure: number;
  created_at: string;
  updated_at: string;
}

// 保護者通知
export interface ParentNotification {
  id: string;
  child_id: string;
  parent_user_id: string;
  notification_type: 'arrival' | 'departure' | 'absence' | 'emergency' | 'general' | 'schedule_change';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  sent_at: string;
  created_at: string;
  child?: ChildInfo;
}

// 記録カテゴリー（parent-appと互換性維持）
export type RecordCategory = 'achievement' | 'happy' | 'failure' | 'trouble';

// 記録イベント
export interface RecordEvent {
  id: string;
  childId: string;
  timestamp: string;
  category: RecordCategory;
  note: string;
}

// チャットメッセージ
export interface ChatMessage {
  id: string;
  childId: string;
  sender: 'parent' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

// 事業所情報
export interface FacilityInfo {
  id: string;
  name: string;
  adminName: string;
  createdAt: string;
}

// ユーザー（管理者）情報
export interface AdminUser {
  id: string;
  facilityId: string;
  facility: FacilityInfo;
}

// 統計情報
export interface DashboardStats {
  totalChildren: number;
  activeToday: number;
  totalRecords: number;
  unreadMessages: number;
}

// 成長記録
export interface GrowthRecord {
  id: string;
  childId: string;
  date: string;
  height?: number;
  weight?: number;
  note?: string;
  milestone?: string;
}

// テーマ設定
export type Theme = 'pink' | 'blue' | 'green' | 'purple';

// 出席・活動記録
export interface AttendanceRecord {
  id: string;
  childId: string;
  date: string;
  usageStartTime?: string;
  usageEndTime?: string;
  childCondition: string;
  activities: string;
  recordedBy: string;
  recordedAt: string;
}

// 管理者設定
export interface AdminSettings {
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    digest: boolean;
  };
  privacy: {
    shareData: boolean;
    allowAnalytics: boolean;
  };
}