-- Migration: Add Tutor Profile Versioning and Professional Details
-- Created: 2026-02-14

-- 1. Add professional detail columns to tutors table
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS student_grades TEXT[],
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_email": false, "show_whatsapp": true}'::jsonb;

-- 2. Create tutor_profile_versions table for rollback functionality
CREATE TABLE IF NOT EXISTS public.tutor_profile_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL,
    version_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_tutor_profile_versions_tutor_id ON public.tutor_profile_versions(tutor_id);

-- 4. Grant permissions
GRANT ALL ON TABLE public.tutor_profile_versions TO anon, authenticated, service_role;

-- 5. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
