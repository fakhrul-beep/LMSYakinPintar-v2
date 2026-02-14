-- Migration: Emergency Fix for Missing Columns in Core Tables
-- Created at: 2026-02-13
-- This script ensures that 'students' and 'tutors' tables have the critical columns required for the RPC functions.

DO $$ 
BEGIN 
    -- 1. Fix 'students' table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        -- Add user_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='user_id') THEN
            ALTER TABLE public.students ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id to public.students';
        END IF;
        
        -- Add program if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='program') THEN
            ALTER TABLE public.students ADD COLUMN program TEXT;
            RAISE NOTICE 'Added program to public.students';
        END IF;

        -- Add is_active if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='is_active') THEN
            ALTER TABLE public.students ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Added is_active to public.students';
        END IF;

        -- Add city if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='city') THEN
            ALTER TABLE public.students ADD COLUMN city TEXT;
            RAISE NOTICE 'Added city to public.students';
        END IF;

        -- Add area if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='area') THEN
            ALTER TABLE public.students ADD COLUMN area TEXT;
            RAISE NOTICE 'Added area to public.students';
        END IF;
        
        -- Add parent_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='parent_id') THEN
            ALTER TABLE public.students ADD COLUMN parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added parent_id to public.students';
        END IF;
    ELSE
        RAISE NOTICE 'Table public.students does not exist. Please run schema.sql first.';
    END IF;

    -- 2. Fix 'tutors' table (redundant but safe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tutors') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tutors' AND column_name='profile_photo') THEN
            ALTER TABLE public.tutors ADD COLUMN profile_photo TEXT;
            RAISE NOTICE 'Added profile_photo to public.tutors';
        END IF;
    END IF;

END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
