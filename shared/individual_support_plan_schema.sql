-- ========================================
-- 個別支援計画システム用データベーススキーマ
-- HUG競合システム
-- ========================================

-- ========================================
-- 1. 児童情報管理
-- ========================================

-- 児童基本情報
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  
  -- 基本情報
  family_name VARCHAR(50) NOT NULL,
  given_name VARCHAR(50) NOT NULL,
  family_name_kana VARCHAR(100),
  given_name_kana VARCHAR(100),
  birth_date DATE NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- 障害情報
  disability_type VARCHAR(100)[], -- 複数選択可能
  disability_certificate_type VARCHAR(50), -- 療育手帳、身体障害者手帳など
  disability_certificate_grade VARCHAR(20),
  
  -- 医療情報
  medical_history TEXT,
  allergies TEXT[],
  medications TEXT[],
  emergency_notes TEXT,
  
  -- 利用情報
  enrollment_date DATE NOT NULL,
  withdrawal_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'withdrawn')),
  
  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- 保護者情報
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- 基本情報
  family_name VARCHAR(50) NOT NULL,
  given_name VARCHAR(50) NOT NULL,
  family_name_kana VARCHAR(100),
  given_name_kana VARCHAR(100),
  relationship VARCHAR(20) NOT NULL, -- 父、母、祖父母など
  
  -- 連絡先
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address_postal_code VARCHAR(10),
  address_prefecture VARCHAR(20),
  address_city VARCHAR(50),
  address_street VARCHAR(200),
  
  -- 優先度
  is_primary BOOLEAN DEFAULT FALSE,
  emergency_contact_order INTEGER DEFAULT 1,
  
  -- ユーザーアカウント連携
  user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 5領域アセスメント
-- ========================================

-- アセスメント記録
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- アセスメント基本情報
  assessment_date DATE NOT NULL,
  assessor_id UUID REFERENCES admin_users(id),
  assessment_type VARCHAR(50) DEFAULT 'regular', -- regular, initial, review
  
  -- 5領域の総合評価
  health_life_summary TEXT,
  motor_sensory_summary TEXT,
  cognition_behavior_summary TEXT,
  language_communication_summary TEXT,
  interpersonal_social_summary TEXT,
  
  -- 総合所見
  overall_assessment TEXT,
  strengths TEXT,
  challenges TEXT,
  
  -- 本人・保護者の希望
  child_wishes TEXT,
  guardian_wishes TEXT,
  
  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- アセスメント詳細項目（5領域の各項目）
CREATE TABLE assessment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- 領域と項目
  domain VARCHAR(50) NOT NULL, -- health_life, motor_sensory, cognition_behavior, language_communication, interpersonal_social
  category VARCHAR(100) NOT NULL, -- 例：健康・生活の「食事」「排泄」など
  item_name VARCHAR(200) NOT NULL,
  
  -- 評価
  current_level INTEGER CHECK (current_level >= 1 AND current_level <= 5), -- 1:要支援 〜 5:自立
  evaluation_notes TEXT,
  specific_observations TEXT,
  
  -- 優先度
  priority INTEGER CHECK (priority >= 1 AND priority <= 3), -- 1:高 2:中 3:低
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 個別支援計画
-- ========================================

-- 個別支援計画（親テーブル）
CREATE TABLE individual_support_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id),
  
  -- 計画期間
  plan_start_date DATE NOT NULL,
  plan_end_date DATE NOT NULL,
  
  -- 総合的な支援方針
  support_policy TEXT NOT NULL,
  support_approach TEXT,
  
  -- AI生成情報
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model VARCHAR(100), -- 使用したAIモデル名
  ai_generation_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- 承認フロー
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled')),
  drafted_by UUID REFERENCES admin_users(id),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- 保護者同意
  guardian_agreed BOOLEAN DEFAULT FALSE,
  guardian_agreement_date DATE,
  guardian_agreement_signature TEXT, -- 電子署名データ
  
  -- 評価
  mid_term_evaluation TEXT,
  mid_term_evaluation_date DATE,
  final_evaluation TEXT,
  final_evaluation_date DATE,
  
  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- 長期目標
CREATE TABLE long_term_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_plan_id UUID NOT NULL REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  
  -- 目標内容
  goal_text TEXT NOT NULL,
  domain VARCHAR(50), -- 5領域のどれか
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  
  -- 評価
  achievement_rate INTEGER CHECK (achievement_rate >= 0 AND achievement_rate <= 100),
  evaluation_notes TEXT,
  
  -- 並び順
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 短期目標
CREATE TABLE short_term_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_plan_id UUID NOT NULL REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  long_term_goal_id UUID REFERENCES long_term_goals(id) ON DELETE SET NULL,
  
  -- 目標内容
  goal_text TEXT NOT NULL,
  domain VARCHAR(50),
  target_date DATE,
  
  -- 評価基準
  success_criteria TEXT,
  achievement_rate INTEGER CHECK (achievement_rate >= 0 AND achievement_rate <= 100),
  evaluation_notes TEXT,
  
  -- ステータス
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'partially_achieved', 'not_achieved')),
  
  -- 並び順
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 具体的支援内容
CREATE TABLE support_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_plan_id UUID NOT NULL REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  short_term_goal_id UUID REFERENCES short_term_goals(id) ON DELETE CASCADE,
  
  -- 支援内容
  activity_name VARCHAR(200) NOT NULL,
  activity_description TEXT NOT NULL,
  domain VARCHAR(50),
  
  -- 実施計画
  frequency VARCHAR(100), -- 例：「週3回」「毎日」
  duration VARCHAR(100), -- 例：「30分」「1時間」
  location VARCHAR(100), -- 例：「屋内」「屋外」
  materials TEXT, -- 使用する教材・道具
  
  -- 担当者
  responsible_staff_id UUID REFERENCES admin_users(id),
  supporting_staff_ids UUID[], -- 複数の補助スタッフ
  
  -- 実施記録
  implementation_count INTEGER DEFAULT 0,
  last_implemented_at DATE,
  
  -- 評価
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  notes TEXT,
  
  -- 並び順
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 国保連請求システム
-- ========================================

-- 請求基本情報
CREATE TABLE billing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  
  -- 請求月
  billing_year INTEGER NOT NULL,
  billing_month INTEGER NOT NULL CHECK (billing_month >= 1 AND billing_month <= 12),
  
  -- ステータス
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'checked', 'submitted', 'accepted', 'returned', 'paid')),
  
  -- 金額
  total_amount INTEGER DEFAULT 0,
  facility_burden INTEGER DEFAULT 0,
  user_burden INTEGER DEFAULT 0,
  
  -- 国保連提出情報
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES admin_users(id),
  
  -- AI自動チェック
  ai_checked BOOLEAN DEFAULT FALSE,
  ai_check_timestamp TIMESTAMP WITH TIME ZONE,
  ai_check_result JSONB, -- エラー・警告情報
  
  -- 返戻情報
  returned_at TIMESTAMP WITH TIME ZONE,
  return_reason TEXT,
  corrected_at TIMESTAMP WITH TIME ZONE,
  
  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(facility_id, billing_year, billing_month)
);

-- 児童別請求明細
CREATE TABLE billing_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_record_id UUID NOT NULL REFERENCES billing_records(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- 基本情報
  recipient_number VARCHAR(20), -- 受給者証番号
  service_type VARCHAR(50) NOT NULL, -- 児童発達支援、放課後等デイサービス
  
  -- 利用実績
  scheduled_days INTEGER DEFAULT 0, -- 契約日数
  actual_days INTEGER DEFAULT 0, -- 実利用日数
  absence_days INTEGER DEFAULT 0, -- 欠席日数
  
  -- 基本報酬
  unit_price INTEGER NOT NULL,
  units INTEGER NOT NULL,
  base_amount INTEGER NOT NULL,
  
  -- 加算
  additions JSONB, -- 各種加算の詳細
  addition_amount INTEGER DEFAULT 0,
  
  -- 減算
  deductions JSONB, -- 各種減算の詳細
  deduction_amount INTEGER DEFAULT 0,
  
  -- 合計
  total_units INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  
  -- 負担額
  user_burden_rate INTEGER DEFAULT 10, -- パーセンテージ
  user_burden_amount INTEGER,
  facility_burden_amount INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 加算管理（動的加算ルール）
CREATE TABLE addition_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 加算情報
  addition_code VARCHAR(20) NOT NULL UNIQUE, -- 例：「専門的支援加算」
  addition_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- 加算要件（AI判定用）
  requirements JSONB NOT NULL, -- 要件をJSON形式で定義
  
  -- 単位数
  unit_value INTEGER NOT NULL,
  
  -- 有効期間
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- AI判定
  ai_checkable BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 出席記録（請求の基礎データ）
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  
  -- 出席情報
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'absent_with_notice', 'holiday', 'cancelled')),
  
  -- 時間
  arrival_time TIME,
  departure_time TIME,
  actual_duration_minutes INTEGER,
  
  -- 送迎
  pickup_provided BOOLEAN DEFAULT FALSE,
  dropoff_provided BOOLEAN DEFAULT FALSE,
  
  -- 食事
  lunch_provided BOOLEAN DEFAULT FALSE,
  snack_provided BOOLEAN DEFAULT FALSE,
  
  -- 担当スタッフ
  primary_staff_id UUID REFERENCES admin_users(id),
  supporting_staff_ids UUID[],
  
  -- 活動記録
  activities_summary TEXT,
  
  -- 特記事項
  notes TEXT,
  
  -- 請求連携
  billing_detail_id UUID REFERENCES billing_details(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(child_id, attendance_date)
);

-- ========================================
-- 5. 帳票フォーマット管理
-- ========================================

-- 自治体別フォーマット
CREATE TABLE prefecture_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 自治体情報
  prefecture_code VARCHAR(2) NOT NULL,
  prefecture_name VARCHAR(20) NOT NULL,
  municipality_code VARCHAR(6),
  municipality_name VARCHAR(50),
  
  -- フォーマット情報
  format_type VARCHAR(50) NOT NULL, -- individual_support_plan, assessment, billing
  format_name VARCHAR(200) NOT NULL,
  template_file_url TEXT, -- Word/Excelテンプレート
  
  -- フィールドマッピング
  field_mapping JSONB NOT NULL, -- システムのフィールドと帳票の対応
  
  -- 必須項目
  required_fields TEXT[],
  
  -- バリデーションルール
  validation_rules JSONB,
  
  -- 有効期間
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- 使用状況
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 生成済み帳票
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 関連情報
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  support_plan_id UUID REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  billing_record_id UUID REFERENCES billing_records(id) ON DELETE CASCADE,
  
  -- ドキュメント情報
  document_type VARCHAR(50) NOT NULL,
  format_id UUID REFERENCES prefecture_formats(id),
  
  -- ファイル情報
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_format VARCHAR(10) NOT NULL, -- pdf, docx, xlsx
  file_size INTEGER,
  
  -- 生成情報
  generated_by UUID REFERENCES admin_users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI生成フラグ
  ai_generated BOOLEAN DEFAULT FALSE,
  
  -- ダウンロード履歴
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. AIプロンプト管理
-- ========================================

-- AIプロンプトテンプレート
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- プロンプト情報
  prompt_type VARCHAR(50) NOT NULL, -- support_plan, goals, activities, billing_check
  prompt_name VARCHAR(200) NOT NULL,
  prompt_template TEXT NOT NULL,
  
  -- モデル設定
  ai_model VARCHAR(100) DEFAULT 'gpt-4',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  
  -- バージョン管理
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- パフォーマンス
  average_generation_time DECIMAL(10,2), -- 秒
  success_rate DECIMAL(5,2), -- パーセンテージ
  usage_count INTEGER DEFAULT 0,
  
  -- 評価
  quality_score DECIMAL(3,2), -- 1-5のスコア
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- AI生成履歴
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 関連情報
  support_plan_id UUID REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES ai_prompts(id),
  
  -- 入力データ
  input_data JSONB NOT NULL,
  
  -- 生成結果
  generated_content TEXT NOT NULL,
  
  -- パフォーマンス
  generation_time_seconds DECIMAL(10,3),
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  
  -- モデル情報
  ai_model VARCHAR(100),
  model_parameters JSONB,
  
  -- 人間による評価
  human_rating INTEGER CHECK (human_rating >= 1 AND human_rating <= 5),
  human_feedback TEXT,
  was_edited BOOLEAN DEFAULT FALSE,
  edit_percentage DECIMAL(5,2), -- 編集された割合
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- ========================================
-- 7. インデックス作成
-- ========================================

-- パフォーマンス最適化用インデックス
CREATE INDEX idx_children_facility ON children(facility_id);
CREATE INDEX idx_children_status ON children(status);
CREATE INDEX idx_assessments_child ON assessments(child_id);
CREATE INDEX idx_assessments_date ON assessments(assessment_date);
CREATE INDEX idx_support_plans_child ON individual_support_plans(child_id);
CREATE INDEX idx_support_plans_status ON individual_support_plans(status);
CREATE INDEX idx_support_plans_dates ON individual_support_plans(plan_start_date, plan_end_date);
CREATE INDEX idx_billing_facility_month ON billing_records(facility_id, billing_year, billing_month);
CREATE INDEX idx_attendance_child_date ON attendance_records(child_id, attendance_date);
CREATE INDEX idx_attendance_facility_date ON attendance_records(facility_id, attendance_date);

-- ========================================
-- 8. RLS (Row Level Security) ポリシー
-- ========================================

-- 施設管理者は自施設のデータのみアクセス可能
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_support_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ポリシー例（実際の実装時に詳細化）
CREATE POLICY facility_isolation_children ON children
  USING (facility_id IN (SELECT facility_id FROM staff_assignments WHERE user_id = auth.uid()));

-- ========================================
-- 9. トリガー（自動更新）
-- ========================================

-- updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_plans_updated_at BEFORE UPDATE ON individual_support_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. ビュー（よく使うクエリ）
-- ========================================

-- 現在有効な個別支援計画
CREATE VIEW active_support_plans AS
SELECT 
  isp.*,
  c.family_name || ' ' || c.given_name AS child_name,
  c.birth_date,
  f.name AS facility_name
FROM individual_support_plans isp
JOIN children c ON isp.child_id = c.id
JOIN facilities f ON c.facility_id = f.id
WHERE isp.status = 'active'
  AND isp.plan_start_date <= CURRENT_DATE
  AND isp.plan_end_date >= CURRENT_DATE;

-- 請求サマリー
CREATE VIEW billing_summary AS
SELECT 
  br.billing_year,
  br.billing_month,
  f.name AS facility_name,
  COUNT(bd.id) AS child_count,
  SUM(bd.actual_days) AS total_attendance_days,
  SUM(bd.total_amount) AS total_billing_amount,
  br.status
FROM billing_records br
JOIN facilities f ON br.facility_id = f.id
LEFT JOIN billing_details bd ON br.id = bd.billing_record_id
GROUP BY br.id, br.billing_year, br.billing_month, f.name, br.status;

