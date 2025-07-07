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
}

export interface ChildInfo {
  id: string;
  name: string;
  age: number;
  birthdate?: string;
  gender?: 'male' | 'female';
  avatarImage?: string;
}