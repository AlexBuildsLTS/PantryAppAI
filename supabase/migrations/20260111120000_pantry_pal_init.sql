/**
 * @file 20260111120000_pantry_pal_init.sql
 * @description AAA+ Enterprise Schema for Pantry Pal.
 * Features:
 * 1. Robust Type Safety: Custom enums for member ranks, item status, and subscription tiers.
 * 2. High-Performance Indexing: B-tree indexes on foreign keys and frequently queried status columns.
 * 3. Deep AI Integration: Metadata and confidence scoring fields for Gemini AI results.
 * 4. Enterprise Security: Granular RLS policies for collaborative shopping and personal inventory.
 * 5. Auditability: Automated updated_at triggers and analytics tracking.
 */

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Robust Type Creation (Handling existing types for migration safety)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_rank') THEN
        CREATE TYPE member_rank AS ENUM ('MEMBER', 'PREMIUM', 'MODERATOR', 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('FRESH', 'EXPIRING_SOON', 'EXPIRED', 'CONSUMED', 'WASTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_tier') THEN
        CREATE TYPE sub_tier AS ENUM ('FREE', 'PREMIUM', 'PRO');
    END IF;
END $$;

-- 2. CORE IDENTITY & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    rank member_rank DEFAULT 'MEMBER',
    tier sub_tier DEFAULT 'FREE',
    is_onboarded BOOLEAN DEFAULT FALSE,
    -- Moderation fields
    is_banned BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMPTZ,
    moderation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORAGE LOCATIONS
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Pantry', -- Fridge, Freezer, Pantry, Spice Rack
    temperature NUMERIC, -- For smart tracking
    humidity NUMERIC,
    custom_icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FOOD INVENTORY (AI-ENRICHED)
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Uncategorized',
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    expiry_date DATE,
    status item_status DEFAULT 'FRESH',
    -- AI Metadata
    ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    nutritional_data JSONB DEFAULT '{}'::jsonb, -- Store macro/micro data
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Custom attributes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI RECIPE ENGINE
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    ingredients JSONB NOT NULL, -- Array of objects: { name, amount, unit }
    instructions TEXT NOT NULL,
    prep_time INTEGER, -- In minutes
    cook_time INTEGER,
    servings INTEGER DEFAULT 1,
    difficulty TEXT,
    nutritional_info JSONB DEFAULT '{}'::jsonb,
    ai_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COLLABORATIVE SHOPPING LISTS
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    shared_with UUID[] DEFAULT '{}', -- Array of user IDs
    items JSONB DEFAULT '[]'::jsonb, -- { name, quantity, bought: bool }
    store_layout JSONB DEFAULT '{}'::jsonb, -- AI-optimized route
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ANALYTICS & SMART NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'SCAN', 'WASTE', 'CONSUME'
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'EXPIRY', 'SYSTEM', 'SOCIAL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- 8. USER PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    dietary_restrictions TEXT[] DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"push": true, "email": false}'::jsonb,
    ai_preferences JSONB DEFAULT '{"auto_categorize": true}'::jsonb,
    theme_settings JSONB DEFAULT '{"mode": "system", "glassmorphism": true}'::jsonb
);

-- 9. PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_status ON public.food_items(status);
CREATE INDEX IF NOT EXISTS idx_food_items_expiry ON public.food_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_scheduled ON public.notifications(user_id, scheduled_for);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies: Food Items
CREATE POLICY "Users can manage own food" ON public.food_items 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policies: Shopping Lists (Collaborative)
CREATE POLICY "Owners and shared users can view lists" ON public.shopping_lists
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Owners and shared users can update lists" ON public.shopping_lists
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

-- 11. AUTOMATED TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_food_items_updated_at BEFORE UPDATE ON public.food_items FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. AUTHENTICATION HOOK
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pantry Pal User'), 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default location
  INSERT INTO public.locations (user_id, name, type)
  VALUES (NEW.id, 'Main Pantry', 'Pantry');

  -- Create default preferences
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();