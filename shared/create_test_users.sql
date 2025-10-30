-- テストユーザー作成SQL
-- パスワードハッシュ: btoa('test123' + 'kyou-no-dekita-salt')

-- 既存のテストユーザーを削除（エラーを無視）
DELETE FROM users WHERE username IN ('test_parent', 'test_admin');

-- 1. 親ユーザー作成
INSERT INTO users (
    id,
    username,
    password,
    user_type,
    display_name,
    email
) VALUES (
    gen_random_uuid(),
    'test_parent',
    'dGVzdDEyM2t5b3Utbm8tZGVraXRhLXNhbHQ=', -- test123のハッシュ
    'parent',
    'テスト保護者',
    'parent@test.com'
);

-- 2. 管理者ユーザー作成
INSERT INTO users (
    id,
    username,
    password,
    user_type,
    display_name,
    email
) VALUES (
    gen_random_uuid(),
    'test_admin',
    'dGVzdDEyM2t5b3Utbm8tZGVraXRhLXNhbHQ=', -- test123のハッシュ
    'facility_admin',
    'テスト管理者',
    'admin@test.com'
);

-- 確認
SELECT 
    username,
    user_type,
    display_name,
    created_at
FROM users 
WHERE username IN ('test_parent', 'test_admin');

SELECT '✅ テストユーザー作成完了！' as status;
SELECT 'ユーザー名: test_parent または test_admin' as login_info;
SELECT 'パスワード: test123' as password_info;

