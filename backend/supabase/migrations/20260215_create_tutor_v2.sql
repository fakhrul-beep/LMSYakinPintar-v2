-- Migration: Update create_tutor to v2 to handle all registration fields
-- Created at: 2026-02-15

CREATE OR REPLACE FUNCTION public.create_tutor_v2(
    p_name TEXT,
    p_email TEXT,
    p_password_hash TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_education TEXT DEFAULT NULL,
    p_experience TEXT DEFAULT NULL,
    p_subjects TEXT[] DEFAULT '{}',
    p_student_grades TEXT[] DEFAULT '{}',
    p_hourly_rate NUMERIC DEFAULT 0,
    p_city TEXT DEFAULT NULL,
    p_area TEXT DEFAULT NULL,
    p_availability TEXT DEFAULT NULL,
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

    -- 3. Create Tutor record with all fields
    INSERT INTO public.tutors (
        user_id, 
        education, 
        experience, 
        subjects, 
        student_grades, 
        hourly_rate, 
        city, 
        area, 
        availability_note, 
        profile_photo, 
        is_active
    )
    VALUES (
        v_user_id, 
        p_education, 
        p_experience, 
        p_subjects, 
        p_student_grades, 
        p_hourly_rate, 
        p_city, 
        p_area, 
        p_availability, 
        p_profile_photo, 
        p_is_active
    )
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
GRANT EXECUTE ON FUNCTION public.create_tutor_v2 TO anon, authenticated, service_role;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
