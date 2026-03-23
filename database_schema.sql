-- 🎓 Agentic AI Tutor: Strategic Mastery Schema
-- Run this in the Supabase SQL Editor to enable persistent agentic tracking

-- 1. Create the mastery table
CREATE TABLE IF NOT EXISTS public.learner_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    concept TEXT NOT NULL,
    mastery_score FLOAT NOT NULL DEFAULT 0.0,
    attempts INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, concept)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.learner_mastery ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Privacy-first. Learners only access their own neural profile.
CREATE POLICY "Users can manage their own mastery" 
ON public.learner_mastery 
FOR ALL 
USING (auth.uid() = user_id);

-- 4. Indices for high-performance agent polling
CREATE INDEX IF NOT EXISTS idx_mastery_user ON public.learner_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_concept ON public.learner_mastery(concept);

-- 🚀 Platform Ready for Strategic Alignment.
