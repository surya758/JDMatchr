-- Create user_preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_preferences ON public.user_preferences USING GIN(preferences);

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER on_user_preferences_updated
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to get user preferences with defaults
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_prefs JSONB;
    default_prefs JSONB := '{
        "theme": "system",
        "dashboard_sidebar_collapsed": false,
        "notifications_enabled": true,
        "email_notifications": true,
        "default_analysis_view": "list",
        "results_per_page": 5,
        "auto_expand_candidates": false,
        "language": "en",
        "timezone": "UTC"
    }';
BEGIN
    -- Get user preferences
    SELECT preferences INTO user_prefs
    FROM public.user_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences exist, return defaults
    IF user_prefs IS NULL THEN
        RETURN default_prefs;
    END IF;
    
    -- Merge user preferences with defaults (user prefs take precedence)
    RETURN default_prefs || user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user preferences with defaults
CREATE OR REPLACE FUNCTION public.initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id, preferences)
    VALUES (NEW.id, '{}')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize preferences when user is created
CREATE TRIGGER on_user_created_initialize_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.initialize_user_preferences();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences(UUID) TO authenticated; 