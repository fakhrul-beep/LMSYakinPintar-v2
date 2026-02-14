-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'student', 'tutor', 'admin')),
    whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutors Table
CREATE TABLE IF NOT EXISTS public.tutors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects TEXT[], -- Array of strings
    city TEXT,
    area TEXT,
    hourly_rate NUMERIC,
    experience_years INTEGER,
    rating_average NUMERIC DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    profile_photo TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    availability_note TEXT,
    education TEXT,
    experience TEXT,
    student_grades TEXT[],
    certifications JSONB DEFAULT '[]'::jsonb,
    privacy_settings JSONB DEFAULT '{"show_email": false, "show_whatsapp": true}'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb, -- Store schedule map as JSONB
    portfolio JSONB DEFAULT '[]'::jsonb, -- Store portfolio array as JSONB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    program TEXT,
    city TEXT,
    area TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    full_description TEXT,
    cover_image TEXT,
    duration TEXT,
    schedule TEXT,
    price NUMERIC NOT NULL,
    quota INTEGER,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    parent_id UUID NOT NULL REFERENCES public.users(id),
    tutor_id UUID NOT NULL REFERENCES public.tutors(id),
    subject TEXT NOT NULL,
    mode TEXT CHECK (mode IN ('offline', 'online')) DEFAULT 'offline',
    city TEXT,
    area TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours NUMERIC DEFAULT 2,
    price_total NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')) DEFAULT 'requested',
    payment_ref_id UUID, -- Will be a foreign key to payments, but payments table is created after. Can add constraint later or here if payments exists.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    provider TEXT DEFAULT 'midtrans',
    midtrans_order_id TEXT,
    midtrans_transaction_id TEXT,
    status TEXT CHECK (status IN ('pending', 'success', 'failed', 'cancelled')) DEFAULT 'pending',
    amount NUMERIC NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES public.tutors(id),
    booking_id UUID REFERENCES public.bookings(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'withdrawal', 'fee')),
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('student', 'tutor')),
    payload JSONB NOT NULL,
    source TEXT DEFAULT 'landing-page',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    tutor_id UUID NOT NULL REFERENCES public.tutors(id),
    summary TEXT NOT NULL,
    score NUMERIC,
    next_plan TEXT,
    homework TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    category TEXT,
    tags TEXT[],
    featured_image TEXT,
    status TEXT CHECK (status IN ('draft', 'published', 'scheduled')) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor Profile Versions Table
CREATE TABLE IF NOT EXISTS public.tutor_profile_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL,
    version_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_tutors_subjects ON public.tutors USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_tutors_city ON public.tutors(city);
CREATE INDEX IF NOT EXISTS idx_tutors_area ON public.tutors(area);
CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);
CREATE INDEX IF NOT EXISTS idx_bookings_parent ON public.bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON public.bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_payments_midtrans_order_id ON public.payments(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);

-- RPC for Atomic Tutor Creation
-- This function handles creating both user and tutor records in a single transaction
-- to prevent inconsistent states where a user is created but the tutor record is missing.
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.create_tutor_v1 TO anon, authenticated, service_role;

-- Parent-Student Relations (for Multi-Account support)
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT, -- e.g., 'Father', 'Mother', 'Guardian'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Grant permissions for the new table
GRANT ALL ON TABLE public.parent_students TO anon, authenticated, service_role;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- RPC for Atomic Student Creation
CREATE OR REPLACE FUNCTION public.create_student_v1(
    p_name TEXT,
    p_email TEXT,
    p_password_hash TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_grade TEXT DEFAULT NULL,
    p_program TEXT DEFAULT NULL,
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
        -- Check if student record exists
        SELECT id INTO v_student_id FROM public.students WHERE user_id = v_user_id;
        IF v_student_id IS NOT NULL THEN
            RETURN jsonb_build_object('status', 'error', 'message', 'Siswa sudah terdaftar');
        END IF;
    ELSE
        -- 2. Create User record
        INSERT INTO public.users (name, email, password_hash, role, whatsapp)
        VALUES (p_name, p_email, p_password_hash, 'student', p_whatsapp)
        RETURNING id INTO v_user_id;
    END IF;

    -- 3. Create Student record
    INSERT INTO public.students (user_id, name, grade, program, city, is_active)
    VALUES (v_user_id, p_name, p_grade, p_program, p_city, p_is_active)
    RETURNING id INTO v_student_id;

    RETURN jsonb_build_object(
        'status', 'success', 
        'data', jsonb_build_object(
            'id', v_student_id, 
            'user_id', v_user_id
        )
    );
EXCEPTION WHEN OTHERS THEN
    -- Capture more context for debugging
    RETURN jsonb_build_object(
        'status', 'error', 
        'message', SQLERRM,
        'code', SQLSTATE,
        'hint', 'Ensure students table has user_id column and PostgREST schema is reloaded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.create_student_v1 TO anon, authenticated, service_role;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
