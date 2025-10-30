-- データベース状態確認用SQL

-- 1. usersテーブルの確認
SELECT '=== USERS TABLE ===' as check_point;
SELECT COUNT(*) as user_count FROM users;
SELECT username, user_type, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- 2. 親ユーザーの確認
SELECT '=== PARENT USERS ===' as check_point;
SELECT id, username, user_type, display_name FROM users WHERE user_type = 'parent';

-- 3. 管理者ユーザーの確認
SELECT '=== ADMIN USERS ===' as check_point;
SELECT id, username, user_type, display_name FROM users WHERE user_type = 'facility_admin';

-- 4. facilitiesテーブルの確認
SELECT '=== FACILITIES ===' as check_point;
SELECT COUNT(*) as facility_count FROM facilities;
SELECT id, name, facility_code FROM facilities LIMIT 5;

-- 5. childrenテーブルの確認
SELECT '=== CHILDREN ===' as check_point;
SELECT COUNT(*) as children_count FROM children;

-- 6. facility_childrenテーブルの確認
SELECT '=== FACILITY_CHILDREN ===' as check_point;
SELECT COUNT(*) as relation_count FROM facility_children;

-- 7. RLS（Row Level Security）の確認
SELECT '=== RLS STATUS ===' as check_point;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'facilities', 'children', 'facility_children')
ORDER BY tablename;

