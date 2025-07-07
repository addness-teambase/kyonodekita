-- きょうのできたアプリのためのSupabaseスキーマ

-- RLS (Row Level Security)を有効にする
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- usersテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT NOT NULL,
    avatar_image TEXT,
    email TEXT
);

-- RLSを有効にする
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- childrenテーブル
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    birthdate DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    avatar_image TEXT
);

-- RLSを有効にする
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の子供のデータのみアクセス可能
CREATE POLICY "Users can view their own children" ON children FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own children" ON children FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own children" ON children FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own children" ON children FOR DELETE USING (auth.uid() = user_id);

-- record_eventsテーブル
CREATE TABLE record_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('achievement', 'happy', 'failure', 'trouble')),
    note TEXT NOT NULL
);

-- RLSを有効にする
ALTER TABLE record_events ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の記録のみアクセス可能
CREATE POLICY "Users can view their own record events" ON record_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own record events" ON record_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own record events" ON record_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own record events" ON record_events FOR DELETE USING (auth.uid() = user_id);

-- calendar_eventsテーブル
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    description TEXT
);

-- RLSを有効にする
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のカレンダーイベントのみアクセス可能
CREATE POLICY "Users can view their own calendar events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- growth_recordsテーブル
CREATE TABLE growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    media_data TEXT,
    media_name TEXT,
    media_size INTEGER
);

-- RLSを有効にする
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の成長記録のみアクセス可能
CREATE POLICY "Users can view their own growth records" ON growth_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own growth records" ON growth_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own growth records" ON growth_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own growth records" ON growth_records FOR DELETE USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_record_events_user_id ON record_events(user_id);
CREATE INDEX idx_record_events_child_id ON record_events(child_id);
CREATE INDEX idx_record_events_timestamp ON record_events(timestamp);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_growth_records_user_id ON growth_records(user_id);
CREATE INDEX idx_growth_records_child_id ON growth_records(child_id);
CREATE INDEX idx_growth_records_created_at ON growth_records(created_at);

-- 認証なしでのアクセスを許可するための関数（開発用）
-- 実際の運用では適切な認証システムを使用してください
CREATE OR REPLACE FUNCTION public.handle_anonymous_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- 匿名ユーザーのIDを生成または取得
    SELECT id INTO user_id FROM users WHERE username = 'anonymous_user' LIMIT 1;
    
    IF user_id IS NULL THEN
        INSERT INTO users (username) VALUES ('anonymous_user') RETURNING id INTO user_id;
    END IF;
    
    RETURN user_id;
END;
$$; 