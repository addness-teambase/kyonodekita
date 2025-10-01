export interface ChildObservation {
  id: string;
  timestamp: string;
  status: 'excellent' | 'good' | 'normal' | 'concerned' | 'worried';
  note?: string;
}

export type Theme = 'blue' | 'green' | 'purple';

export interface UserPreferences {
  theme: Theme;
  showMotivationalMessages: boolean;
}

export type RecordMode = 'observation';

// RecordContextで使用する型定義
export type RecordCategory = 'achievement' | 'happy' | 'failure' | 'trouble';

export interface RecordEvent {
  id: string;
  childId: string;
  timestamp: string;
  category: RecordCategory;
  note: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time?: string;
  description?: string;
  type?: 'attendance_record' | 'attendance_schedule' | 'event' | 'holiday';
  attendanceRecord?: AttendanceRecord;
  priority?: 'normal' | 'high';
  is_facility_wide?: boolean; // 園全体の予定かどうか
  facility_user_id?: string; // 管理者が作成した場合
}

// 出席・活動記録（管理者から受け取る情報）
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

export interface ChildInfo {
  id: string;
  name: string;
  age: number;
  birthdate?: string;
  gender?: 'male' | 'female';
  avatarImage?: string;
}

export interface FacilityInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

// 直接チャット用メッセージ
export interface DirectChatMessage {
  id: string;
  childId: string;
  sender: 'parent' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

// 直接チャットセッション
export interface DirectChatSession {
  id: string;
  childId: string;
  participantType: 'admin' | 'teacher';
  participantName: string;
  messages: DirectChatMessage[];
  lastMessageTime: string;
  unreadCount: number;
}