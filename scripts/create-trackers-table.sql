-- Create the trackers table
CREATE TABLE IF NOT EXISTS public.trackers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own trackers
CREATE POLICY "Users can view their own trackers" ON public.trackers
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own trackers
CREATE POLICY "Users can insert their own trackers" ON public.trackers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own trackers
CREATE POLICY "Users can update their own trackers" ON public.trackers
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own trackers
CREATE POLICY "Users can delete their own trackers" ON public.trackers
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS trackers_user_id_idx ON public.trackers(user_id);
CREATE INDEX IF NOT EXISTS trackers_created_at_idx ON public.trackers(created_at);
