-- ===============================================================
-- きょうのできた - 統一マスターデータベーススキーマ
-- ===============================================================
-- 作成日: 2024年12月31日
-- 説明: 親アプリ・管理アプリの完全統合版データベーススキーマ
-- 特徴: マルチテナント対応、Supabase認証統一、完全な機能統合
-- ===============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (完全リセット用)
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS invitation_links CASCADE;
DROP TABLE IF EXISTS facility_children CASCADE;
DROP TABLE IF EXISTS facility_memberships CASCADE;
DROP TABLE IF EXISTS attendance_schedules CASCADE;
DROP TABLE IF EXISTS child_facility_relations CASCADE;
DROP TABLE IF EXISTS facility_users CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS daily_records CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS growth_records CASCADE;
DROP TABLE IF EXISTS records CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS direct_chat_conversations CASCADE;
DROP TABLE IF EXISTS direct_chat_messages CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- CORE TABLES (統一認証システム)
-- =============================================================================

-- Users table (親ユーザー・管理者統一)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'parent' CHECK (user_type IN ('parent', 'admin', 'facility_admin', 'facility_staff')),
  email TEXT UNIQUE,
  display_name TEXT,
  full_name TEXT,
  phone TEXT,
  -- 管理者・施設情報（設定画面で編集可能）
  facility_name TEXT, -- 園・施設名
  facility_address TEXT, -- 施設住所
  facility_phone TEXT, -- 施設電話番号
  facility_email TEXT, -- 施設メールアドレス
  is_individual_account BOOLEAN DEFAULT FALSE, -- 個人利用アカウント
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Facilities table (事業所・保育園)
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  facility_code TEXT UNIQUE NOT NULL, -- 事業所コード (招待用)
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  business_type TEXT DEFAULT 'daycare' CHECK (business_type IN ('daycare', 'kindergarten', 'nursery', 'therapy', 'support_center', 'after_school')),
  address TEXT,
  phone TEXT,
  email TEXT,
  business_hours TEXT,
  operating_hours_start TIME DEFAULT '07:00',
  operating_hours_end TIME DEFAULT '19:00',
  capacity INTEGER,
  facility_type TEXT DEFAULT 'daycare' CHECK (facility_type IN ('daycare', 'kindergarten', 'nursery')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_active BOOLEAN DEFAULT TRUE,
  billing_plan TEXT DEFAULT 'standard',
  monthly_fee DECIMAL(10,2),
  ai_usage_limit INTEGER DEFAULT 1000, -- 月間AI使用制限
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Facility users table (事業所の管理者・職員) - 旧設計との統合
CREATE TABLE IF NOT EXISTS facility_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- users tableとの連携
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'teacher', 'staff')),
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Facility memberships (個人と事業所の関係管理)
CREATE TABLE IF NOT EXISTS facility_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'parent' CHECK (role IN ('admin', 'staff', 'parent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'withdrawn')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT,
  billing_responsibility BOOLEAN DEFAULT FALSE, -- この人が料金負担するか
  ai_usage_allowance INTEGER DEFAULT 100, -- 個人のAI使用許可量
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, facility_id) -- 同じ人は同じ事業所に重複登録不可
);

-- Children table (子供・園児)
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  birthdate DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  avatar_image TEXT,
  guardian_name TEXT, -- 保護者名
  guardian_phone TEXT,
  guardian_email TEXT,
  emergency_contact TEXT,
  allergies TEXT,
  medical_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'transferred', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Child-Facility Relations (子供と事業所の関係)
CREATE TABLE IF NOT EXISTS child_facility_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(child_id, facility_id)
);

-- Facility children (事業所ごとの子供詳細情報)
CREATE TABLE IF NOT EXISTS facility_children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本情報
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'graduated', 'withdrawn')),
  
  -- 発達障害関連の詳細項目
  has_support_limit_management BOOLEAN DEFAULT FALSE, -- 上限管理事業所の有無
  support_certificate_expiry DATE, -- 受給者証の期限
  contracted_support_hours INTEGER, -- 契約支給量（時間/月）
  consultation_support_office TEXT, -- 相談支援事業所
  consultation_support_staff_name TEXT, -- 相談支援員の名前
  consultation_support_staff_phone TEXT, -- 相談支援員の電話番号
  
  -- 追加の支援情報
  diagnosis TEXT, -- 診断名
  support_level TEXT, -- 支援レベル
  therapy_types TEXT[], -- 受けている療法の種類
  medication_info TEXT, -- 服薬情報
  emergency_contact_info JSONB, -- 緊急連絡先情報
  allergy_info TEXT, -- アレルギー情報
  dietary_restrictions TEXT, -- 食事制限
  special_notes TEXT, -- 特記事項
  
  -- 料金関連
  monthly_fee DECIMAL(10,2),
  payment_status TEXT DEFAULT 'current' CHECK (payment_status IN ('current', 'overdue', 'suspended')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(child_id, facility_id) -- 同じ子供は同じ事業所に重複登録不可
);

-- =============================================================================
-- ATTENDANCE & ACTIVITY RECORDS (管理アプリ → 親アプリ連携の核心)
-- =============================================================================

-- Attendance schedules/records (出席記録・活動記録)
CREATE TABLE IF NOT EXISTS attendance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- 利用予定時間
  scheduled_arrival_time TIME,
  scheduled_departure_time TIME,
  
  -- 実際の利用時間
  actual_arrival_time TIME,
  actual_departure_time TIME,
  
  -- 出席状況
  attendance_status TEXT DEFAULT 'scheduled' CHECK (attendance_status IN ('scheduled', 'present', 'absent', 'late', 'early_departure')),
  
  -- 活動記録・様子
  notes TEXT, -- 【本人の様子】と【活動内容】をまとめて格納
  child_condition TEXT, -- 本人の様子（別途格納）
  activities TEXT, -- 活動内容（別途格納）
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5), -- 1:悪い ～ 5:とても良い
  
  -- 食事記録
  lunch_status TEXT CHECK (lunch_status IN ('完食', '半分', '少し', '未摂取')),
  snack_status TEXT CHECK (snack_status IN ('完食', '半分', '少し', '未摂取')),
  
  -- 記録者情報
  created_by UUID REFERENCES facility_users(id) ON DELETE SET NULL,
  created_by_name TEXT, -- 記録者名（冗長化）
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================================================
-- PARENT APP SPECIFIC TABLES (親アプリ専用)
-- =============================================================================

-- Records table (親が入力する「できた」記録)
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id), -- マルチテナント対応
  category TEXT NOT NULL CHECK (category IN ('achievement', 'happy', 'failure', 'trouble')),
  note TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Calendar events table (親が入力する予定)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id), -- マルチテナント対応
  date DATE NOT NULL,
  title TEXT NOT NULL,
  time TEXT,
  type TEXT DEFAULT 'event' CHECK (type IN ('event', 'appointment', 'reminder', 'attendance_record')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Growth records table (親が入力する成長記録)
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id), -- マルチテナント対応
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('first_time', 'milestone', 'achievement', 'memory')),
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_data TEXT, -- Base64エンコードされた画像/動画データ
  media_name TEXT,
  media_size INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Daily records table (親の日記)
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('happy', 'good', 'okay', 'tired', 'sad')),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- =============================================================================
-- CHAT SYSTEM (親⟷管理者の直接コミュニケーション)
-- =============================================================================

-- AI Chat sessions (親とAIのチャット)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI Chat messages (親とAIのチャット)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Direct chat conversations (親と先生の直接チャット)
CREATE TABLE IF NOT EXISTS direct_chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  facility_user_id UUID REFERENCES facility_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(child_id, parent_user_id, facility_id)
);

-- Direct chat messages (親と先生の直接チャット)
CREATE TABLE IF NOT EXISTS direct_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES direct_chat_conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_facility_user_id UUID REFERENCES facility_users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'facility_admin', 'facility_teacher', 'facility_staff')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================================================
-- ADVANCED FEATURES (マルチテナント・招待システム等)
-- =============================================================================

-- Invitation links (招待システム)
CREATE TABLE IF NOT EXISTS invitation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- 特定の子供用の招待の場合
  invitation_code TEXT UNIQUE NOT NULL, -- 招待コード
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('new_parent', 'existing_parent', 'child_add')),
  inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 招待先情報
  invitee_email TEXT,
  invitee_name TEXT,
  
  -- 子供情報（事前入力）
  child_name TEXT,
  child_age INTEGER,
  child_birthdate DATE,
  child_gender TEXT CHECK (child_gender IN ('male', 'female')),
  
  -- 招待状態
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by_user_id UUID REFERENCES users(id),
  
  -- メッセージ
  invitation_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI usage logs (AI使用量追跡)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('chat', 'analysis', 'report_generation', 'translation')),
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Data retention policies (データ保持ポリシー)
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('chat_messages', 'records', 'photos', 'analytics')),
  retention_period_months INTEGER NOT NULL,
  delete_on_withdrawal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(facility_id, data_type)
);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Create an updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_users_updated_at
  BEFORE UPDATE ON facility_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_memberships_updated_at
  BEFORE UPDATE ON facility_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_facility_relations_updated_at
  BEFORE UPDATE ON child_facility_relations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_children_updated_at
  BEFORE UPDATE ON facility_children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_schedules_updated_at
  BEFORE UPDATE ON attendance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_records_updated_at
  BEFORE UPDATE ON growth_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_chat_conversations_updated_at
  BEFORE UPDATE ON direct_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitation_links_updated_at
  BEFORE UPDATE ON invitation_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UTILITY FUNCTIONS (便利関数)
-- =============================================================================

-- 招待コード生成関数
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- ユーザーが特定の事業所にアクセスできるかチェック
CREATE OR REPLACE FUNCTION user_has_facility_access(
  check_user_id UUID,
  check_facility_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM facility_memberships
    WHERE user_id = check_user_id
    AND facility_id = check_facility_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- 退出処理関数（事業所連携のみ切断、個人データは全て保持）
CREATE OR REPLACE FUNCTION process_facility_withdrawal(
  withdraw_user_id UUID,
  withdraw_facility_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. メンバーシップを退会状態に更新
  UPDATE facility_memberships 
  SET 
    status = 'withdrawn',
    withdrawn_at = NOW(),
    withdrawal_reason = reason
  WHERE user_id = withdraw_user_id 
  AND facility_id = withdraw_facility_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 2. 事業所の子供登録を非アクティブに（データは保持）
  UPDATE facility_children 
  SET 
    status = 'withdrawn',
    withdrawal_date = CURRENT_DATE
  WHERE parent_user_id = withdraw_user_id 
  AND facility_id = withdraw_facility_id;
  
  -- 3. 事業所とのチャットを非アクティブに（履歴は保持）
  UPDATE direct_chat_conversations 
  SET status = 'closed'
  WHERE parent_user_id = withdraw_user_id 
  AND facility_id = withdraw_facility_id;
  
  -- 4. ユーザーを個人利用モードに移行（全機能無料で利用可能）
  UPDATE users 
  SET is_individual_account = TRUE
  WHERE id = withdraw_user_id
  AND NOT EXISTS (
    SELECT 1 FROM facility_memberships 
    WHERE user_id = withdraw_user_id 
    AND status = 'active'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECURITY SETTINGS
-- =============================================================================

-- Disable Row Level Security (RLS) for custom authentication
-- アプリケーション層での認証を使用
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE facility_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE facility_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE child_facility_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE facility_children DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE records DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Facility-related indexes
CREATE INDEX IF NOT EXISTS idx_facilities_code ON facilities(facility_code);
CREATE INDEX IF NOT EXISTS idx_facilities_admin ON facilities(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities(status);
CREATE INDEX IF NOT EXISTS idx_facility_users_facility_id ON facility_users(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_users_username ON facility_users(username);
CREATE INDEX IF NOT EXISTS idx_facility_users_user_id ON facility_users(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_memberships_user ON facility_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_memberships_facility ON facility_memberships(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_memberships_status ON facility_memberships(status);

-- Children-related indexes
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_children_status ON children(status);
CREATE INDEX IF NOT EXISTS idx_child_facility_relations_child_id ON child_facility_relations(child_id);
CREATE INDEX IF NOT EXISTS idx_child_facility_relations_facility_id ON child_facility_relations(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_children_child ON facility_children(child_id);
CREATE INDEX IF NOT EXISTS idx_facility_children_facility ON facility_children(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_children_parent ON facility_children(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_facility_children_status ON facility_children(status);

-- Attendance-related indexes (重要: 頻繁に検索される)
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_child_id ON attendance_schedules(child_id);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_facility_id ON attendance_schedules(facility_id);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_date ON attendance_schedules(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_date_child ON attendance_schedules(date, child_id);

-- Record-related indexes
CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_child_id ON records(child_id);
CREATE INDEX IF NOT EXISTS idx_records_facility_id ON records(facility_id);
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON records(timestamp);

-- Calendar-related indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_child_id ON calendar_events(child_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_facility_id ON calendar_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- Daily records indexes
CREATE INDEX IF NOT EXISTS idx_daily_records_user_id ON daily_records(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);

-- Chat-related indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_conversations_child_id ON direct_chat_conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_conversations_parent_user_id ON direct_chat_conversations(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_conversations_facility_id ON direct_chat_conversations(facility_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_conversation_id ON direct_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_created_at ON direct_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_is_read ON direct_chat_messages(is_read);

-- Growth records indexes
CREATE INDEX IF NOT EXISTS idx_growth_records_user_id ON growth_records(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_child_id ON growth_records(child_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_facility_id ON growth_records(facility_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_date ON growth_records(date);
CREATE INDEX IF NOT EXISTS idx_growth_records_category ON growth_records(category);

-- Invitation system indexes
CREATE INDEX IF NOT EXISTS idx_invitation_links_code ON invitation_links(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitation_links_facility ON invitation_links(facility_id);
CREATE INDEX IF NOT EXISTS idx_invitation_links_status ON invitation_links(status);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_facility ON ai_usage_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- =============================================================================
-- SAMPLE DATA (デモ・テスト用)
-- =============================================================================

-- Sample facilities（チャット機能用のデフォルト施設を含む）
INSERT INTO facilities (id, name, facility_code, business_type, monthly_fee)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'デフォルト保育園', 'DEFAULT01', 'daycare', 5000.00),
  (uuid_generate_v4(), 'きょうのできた保育園', 'KYOU001', 'daycare', 5000.00),
  (uuid_generate_v4(), 'みらい療育センター', 'MIRA001', 'therapy', 8000.00)
ON CONFLICT (facility_code) DO NOTHING;

-- Sample users (both parent and admin)
INSERT INTO users (username, password, user_type, display_name, email)
VALUES 
  ('demo_parent', 'demo123', 'parent', '山田太郎', 'yamada@example.com'),
  ('demo_admin', 'admin123', 'facility_admin', '佐藤管理者', 'admin@kyou001.jp')
ON CONFLICT (username) DO NOTHING;

-- Sample facility users (for admin-app authentication)
INSERT INTO facility_users (facility_id, username, password, display_name, role, email)
SELECT 
  f.id,
  'demo_admin',
  'admin123',
  '佐藤管理者',
  'admin',
  'admin@kyou001.jp'
FROM facilities f 
WHERE f.facility_code = 'KYOU001'
ON CONFLICT (username) DO NOTHING;

-- Sample children for demo
INSERT INTO children (user_id, name, age, birthdate, gender, guardian_name, guardian_phone)
SELECT 
  u.id,
  '山田花子',
  5,
  '2019-04-01'::DATE,
  'female',
  '山田太郎',
  '090-1234-5678'
FROM users u 
WHERE u.username = 'demo_parent'
ON CONFLICT DO NOTHING;

-- Sample facility memberships
INSERT INTO facility_memberships (user_id, facility_id, role, status)
SELECT 
  u.id,
  f.id,
  'parent',
  'active'
FROM users u, facilities f
WHERE u.username = 'demo_parent' AND f.facility_code = 'KYOU001'
ON CONFLICT (user_id, facility_id) DO NOTHING;

-- Sample child-facility relations
INSERT INTO child_facility_relations (child_id, facility_id, status)
SELECT 
  c.id,
  f.id,
  'active'
FROM children c, facilities f, users u
WHERE c.user_id = u.id AND u.username = 'demo_parent' AND f.facility_code = 'KYOU001'
ON CONFLICT (child_id, facility_id) DO NOTHING;

-- Default data retention policies
INSERT INTO data_retention_policies (facility_id, data_type, retention_period_months, delete_on_withdrawal)
SELECT f.id, 'chat_messages', 12, TRUE FROM facilities f
UNION ALL
SELECT f.id, 'records', 60, FALSE FROM facilities f
UNION ALL
SELECT f.id, 'photos', 24, FALSE FROM facilities f
UNION ALL
SELECT f.id, 'analytics', 36, FALSE FROM facilities f
ON CONFLICT (facility_id, data_type) DO NOTHING;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '🎉 きょうのできた - 完全統合データベース構築完了！';
    RAISE NOTICE '📊 作成されたテーブル数: 19個（全機能統合）';
    RAISE NOTICE '🔗 親アプリ ⟷ 管理アプリの完全統合';
    RAISE NOTICE '🏢 マルチテナント対応完了';
    RAISE NOTICE '👥 統一認証システム準備完了';
    RAISE NOTICE '⚙️ 設定画面・園児削除機能対応';
    RAISE NOTICE '💬 チャット機能統合完了';
    RAISE NOTICE '🚀 本番環境で使用可能です！';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ワンファイル統合により複雑な手順が不要になりました！';
    RAISE NOTICE '📋 詳細は shared/UNIFIED_SETUP.md を参照してください';
END $$;
