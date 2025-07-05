-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile table (Supabaseの auth.users を拡張)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table (子供の情報)
CREATE TABLE public.children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  birthdate DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record Events table (記録イベント)
CREATE TABLE public.record_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('achievement', 'happy', 'failure', 'trouble')),
  note TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events table (予定)
CREATE TABLE public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached Content table (AI生成コンテンツのキャッシュ)
CREATE TABLE public.cached_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  content_date DATE NOT NULL,
  diary_content TEXT,
  message_content TEXT,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own children" ON public.children FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own children" ON public.children FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own children" ON public.children FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own children" ON public.children FOR DELETE USING (auth.uid() = user_id);

-- Record Events
ALTER TABLE public.record_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own record events" ON public.record_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own record events" ON public.record_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own record events" ON public.record_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own record events" ON public.record_events FOR DELETE USING (auth.uid() = user_id);

-- Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Cached Content
ALTER TABLE public.cached_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cached content" ON public.cached_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cached content" ON public.cached_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cached content" ON public.cached_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cached content" ON public.cached_content FOR DELETE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 