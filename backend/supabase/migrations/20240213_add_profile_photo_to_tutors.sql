-- Migration: Add profile_photo to tutors table
-- Created at: 2026-02-13

-- 1. Ensure 'tutors' table exists before attempting ALTER
DO $$ 
BEGIN 
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tutors') THEN
        RAISE NOTICE 'Table public.tutors does not exist. Creating basic structure...';
        
        -- Minimal table creation if missing (matching schema.sql)
        CREATE TABLE public.tutors (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            bio TEXT,
            subjects TEXT[],
            profile_photo TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Table exists, check for column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tutors' AND column_name='profile_photo') THEN
            ALTER TABLE public.tutors ADD COLUMN profile_photo TEXT;
        END IF;
    END IF;
END $$;

-- Also ensure the RPC function is up to date (it was already updated in schema.sql, 
-- but this migration ensures it's applied if it wasn't)
CREATE OR REPLACE FUNCTION public.create_tutor_v1(
    p_name TEXT,
    p_email TEXT,
    p_password_hash TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_subjects TEXT[] DEFAULT '{}',
    p_profile_photo TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_tutor_id UUID;
BEGIN
    -- 1. Check if user already exists
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        -- Check if tutor record already exists for this user
        SELECT id INTO v_tutor_id FROM public.tutors WHERE user_id = v_user_id;
        IF v_tutor_id IS NOT NULL THEN
            RETURN jsonb_build_object('status', 'error', 'message', 'Guru sudah terdaftar');
        END IF;
        
        -- Verify role is tutor
        IF (SELECT role FROM public.users WHERE id = v_user_id) != 'tutor' THEN
            RETURN jsonb_build_object('status', 'error', 'message', 'Email sudah terdaftar dengan role lain');
        END IF;
    ELSE
        -- 2. Create User record
        INSERT INTO public.users (name, email, password_hash, role, whatsapp)
        VALUES (p_name, p_email, p_password_hash, 'tutor', p_whatsapp)
        RETURNING id INTO v_user_id;
    END IF;

    -- 3. Create Tutor record
    INSERT INTO public.tutors (user_id, bio, subjects, profile_photo, is_active)
    VALUES (v_user_id, p_bio, p_subjects, p_profile_photo, p_is_active)
    RETURNING id INTO v_tutor_id;

    RETURN jsonb_build_object(
        'status', 'success', 
        'data', jsonb_build_object(
            'id', v_tutor_id, 
            'user_id', v_user_id
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error', 
        'message', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
