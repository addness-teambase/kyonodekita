-- スーパー管理者権限の追加
-- きょうのできた - Super Admin機能

-- 既存のCHECK制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 新しいCHECK制約を追加（super_adminを含む）
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('parent', 'admin', 'facility_admin', 'facility_staff', 'super_admin'));

-- スーパー管理者アカウントの作成
-- ユーザー名: superadmin
-- パスワード: admin123 (実際の環境では強力なパスワードに変更してください)
-- ハッシュ値: 16進数のハッシュ（簡易ハッシュ関数で生成）

-- 既存のsuperadminアカウントがあれば削除
DELETE FROM users WHERE username = 'superadmin';

-- スーパー管理者アカウントを作成
INSERT INTO users (
  username, 
  password, 
  plain_password,
  user_type, 
  display_name,
  email
) VALUES (
  'superadmin',
  '87e1e87b', -- admin123 のハッシュ値
  'admin123', -- 平文パスワード（確認用）※本番環境では削除推奨
  'super_admin',
  'スーパー管理者',
  'superadmin@example.com'
);

-- 確認
SELECT 
  id,
  username,
  user_type,
  display_name,
  email,
  created_at
FROM users 
WHERE user_type = 'super_admin';






