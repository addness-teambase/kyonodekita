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