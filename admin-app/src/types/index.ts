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
}

// カレンダーイベント
export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time?: string;
  description?: string;
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