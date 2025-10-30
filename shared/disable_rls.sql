-- RLS（Row Level Security）を無効化
-- これにより、親アプリと管理アプリからのアクセスが可能になります

-- usersテーブルのRLS無効化
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- facilitiesテーブルのRLS無効化
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;

-- childrenテーブルのRLS無効化
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;

-- facility_childrenテーブルのRLS無効化
ALTER TABLE public.facility_children DISABLE ROW LEVEL SECURITY;

-- daily_recordsテーブルのRLS無効化
ALTER TABLE public.daily_records DISABLE ROW LEVEL SECURITY;

-- attendance_schedulesテーブルのRLS無効化
ALTER TABLE public.attendance_schedules DISABLE ROW LEVEL SECURITY;

-- その他のテーブルも無効化
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_read_status DISABLE ROW LEVEL SECURITY;

-- 確認
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '✅ RLS無効化完了！ログインが可能になりました。' as status;

