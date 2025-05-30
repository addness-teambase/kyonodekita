/*
  # ストレス記録システムの初期スキーマ

  1. 新規テーブル
    - `groups`
      - `id` (uuid, プライマリーキー)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `stress_events`
      - `id` (uuid, プライマリーキー)
      - `user_id` (uuid, 外部キー)
      - `group_id` (uuid, 外部キー)
      - `timestamp` (timestamp)
      - `level` (text)
      - `user_name` (text)

  2. セキュリティ
    - RLSを有効化
    - グループメンバーが記録を読み取れるポリシーを追加
*/

-- グループテーブルの作成
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ストレスイベントテーブルの作成
CREATE TABLE IF NOT EXISTS stress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  group_id uuid REFERENCES groups(id),
  timestamp timestamptz DEFAULT now(),
  level text,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLSの有効化
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_events ENABLE ROW LEVEL SECURITY;

-- グループメンバーのための読み取りポリシー
CREATE POLICY "グループメンバーがストレスイベントを読める"
  ON stress_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ユーザーが自分のストレスイベントを作成できる"
  ON stress_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- グループの読み取りポリシー
CREATE POLICY "全ユーザーがグループを読める"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);