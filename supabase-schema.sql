-- Supabase Schema for Blog with Auth, Comments, and Favorites
-- Execute this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'author', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('post', 'news')),
  parent_id UUID REFERENCES comments(id),
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  replies_count INTEGER DEFAULT 0
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('post', 'news')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id, post_type)
);

-- Update existing tables to ensure proper structure
-- Handle reactions column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reactions') THEN
        ALTER TABLE posts ALTER COLUMN reactions TYPE JSONB USING reactions::JSONB;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'reactions') THEN
        ALTER TABLE news ALTER COLUMN reactions TYPE JSONB USING reactions::JSONB;
    END IF;
END $$;

-- Handle tags column - convert text[] to jsonb
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tags' AND data_type = 'ARRAY') THEN
        -- Remove default value first
        ALTER TABLE posts ALTER COLUMN tags DROP DEFAULT;
        -- Convert type
        ALTER TABLE posts ALTER COLUMN tags TYPE JSONB USING to_jsonb(tags);
        -- Set new default
        ALTER TABLE posts ALTER COLUMN tags SET DEFAULT '[]'::JSONB;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'tags' AND data_type = 'ARRAY') THEN
        -- Remove default value first
        ALTER TABLE news ALTER COLUMN tags DROP DEFAULT;
        -- Convert type
        ALTER TABLE news ALTER COLUMN tags TYPE JSONB USING to_jsonb(tags);
        -- Set new default
        ALTER TABLE news ALTER COLUMN tags SET DEFAULT '[]'::JSONB;
    END IF;
END $$;

-- Set default values for reactions
UPDATE posts SET reactions = '{"heart":0,"fire":0,"smile":0}'::JSONB WHERE reactions IS NULL;
UPDATE news SET reactions = '{"heart":0,"fire":0,"smile":0}'::JSONB WHERE reactions IS NULL;

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- RLS Policies for news
CREATE POLICY "Anyone can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create news" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own news" ON news FOR UPDATE USING (true);
CREATE POLICY "Users can delete own news" ON news FOR DELETE USING (true);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update replies count
DROP TRIGGER IF EXISTS update_replies_count_trigger ON comments;
CREATE TRIGGER update_replies_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_replies_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post ON favorites(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert default editor profile (you'll need to replace the UUID with actual user ID from auth.users)
-- This should be done after the user is created in auth.users
-- INSERT INTO user_profiles (id, email, full_name, role) 
-- VALUES ('USER_UUID_HERE', 'proeco09@yandex.ru', 'Редактор', 'admin')
-- ON CONFLICT (id) DO UPDATE SET 
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   role = EXCLUDED.role;
