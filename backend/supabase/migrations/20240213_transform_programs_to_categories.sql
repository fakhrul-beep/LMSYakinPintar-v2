-- Migration: Transform Programs to Learning Categories (Jenjang Pembelajaran)
-- Created at: 2026-02-13

-- 1. Create new table 'learning_categories'
CREATE TABLE IF NOT EXISTS public.learning_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., 'SD', 'SMP', 'SMA', 'Umum'
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrate existing data from programs to learning_categories
-- We take unique program names as initial categories
DO $$ 
BEGIN 
    -- Check if 'programs' table exists before migration
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
        INSERT INTO public.learning_categories (name, slug, description, is_active)
        SELECT DISTINCT name, slug, description, is_active 
        FROM public.programs
        ON CONFLICT (name) DO NOTHING;
    ELSE
        RAISE NOTICE 'Table public.programs does not exist. Skipping data migration.';
    END IF;
END $$;

-- 3. Update students table to reference learning_categories (optional but recommended)
-- For now, we keep the 'program' column in students as TEXT but it will represent Category Name
-- We can add a category_id later if needed for strict relations.

-- 4. Update RPC function 'create_student_v1' to reflect terminology (Internal Logic stays similar)
-- The parameter p_program will now be treated as p_learning_category_name
CREATE OR REPLACE FUNCTION public.create_student_v1(
    p_name TEXT,
    p_email TEXT,
    p_password_hash TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_grade TEXT DEFAULT NULL,
    p_program TEXT DEFAULT NULL, -- This now refers to learning_category name
    p_city TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_student_id UUID;
BEGIN
    -- 1. Check if user already exists
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        SELECT id INTO v_student_id FROM public.students WHERE user_id = v_user_id;
        IF v_student_id IS NOT NULL THEN
            RETURN jsonb_build_object('status', 'error', 'message', 'Siswa sudah terdaftar');
        END IF;
    ELSE
        INSERT INTO public.users (name, email, password_hash, role, whatsapp)
        VALUES (p_name, p_email, p_password_hash, 'student', p_whatsapp)
        RETURNING id INTO v_user_id;
    END IF;

    INSERT INTO public.students (user_id, name, grade, program, city, is_active)
    VALUES (v_user_id, p_name, p_grade, p_program, p_city, p_is_active)
    RETURNING id INTO v_student_id;

    RETURN jsonb_build_object(
        'status', 'success', 
        'data', jsonb_build_object('id', v_student_id, 'user_id', v_user_id)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM, 'code', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Rename old programs table to mark as legacy (to be deleted later)
-- ALTER TABLE public.programs RENAME TO programs_old;

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
