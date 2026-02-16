-- Migration: Specialization Validation System
-- Created at: 2026-02-15

-- 1. Create mata_pelajaran table
CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create spesialisasi table
CREATE TABLE IF NOT EXISTS public.spesialisasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create relation table
CREATE TABLE IF NOT EXISTS public.mata_pelajaran_spesialisasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mata_pelajaran_id UUID REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
    spesialisasi_id UUID REFERENCES public.spesialisasi(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mata_pelajaran_id, spesialisasi_id)
);

-- 4. Add foreign keys to tutors table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tutors' AND column_name='mata_pelajaran_id') THEN
        ALTER TABLE public.tutors ADD COLUMN mata_pelajaran_id UUID REFERENCES public.mata_pelajaran(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tutors' AND column_name='spesialisasi_id') THEN
        ALTER TABLE public.tutors ADD COLUMN spesialisasi_id UUID REFERENCES public.spesialisasi(id);
    END IF;
END $$;

-- 5. Table for correlation error logging
CREATE TABLE IF NOT EXISTS public.correlation_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    mata_pelajaran_id UUID,
    spesialisasi_id UUID,
    error_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mata_pelajaran_updated_at ON public.mata_pelajaran;
CREATE TRIGGER update_mata_pelajaran_updated_at BEFORE UPDATE ON public.mata_pelajaran FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_spesialisasi_updated_at ON public.spesialisasi;
CREATE TRIGGER update_spesialisasi_updated_at BEFORE UPDATE ON public.spesialisasi FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_mata_pelajaran_spesialisasi_updated_at ON public.mata_pelajaran_spesialisasi;
CREATE TRIGGER update_mata_pelajaran_spesialisasi_updated_at BEFORE UPDATE ON public.mata_pelajaran_spesialisasi FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 7. Stored Procedure for validation
CREATE OR REPLACE FUNCTION public.validate_subject_specialization(p_subject_id UUID, p_spec_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- If both are null, it's valid (or handle as invalid based on requirements)
    IF p_subject_id IS NULL OR p_spec_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.mata_pelajaran_spesialisasi 
        WHERE mata_pelajaran_id = p_subject_id AND spesialisasi_id = p_spec_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger function to validate tutor subject-specialization correlation
CREATE OR REPLACE FUNCTION public.trigger_validate_tutor_correlation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mata_pelajaran_id IS NOT NULL AND NEW.spesialisasi_id IS NOT NULL THEN
        IF NOT public.validate_subject_specialization(NEW.mata_pelajaran_id, NEW.spesialisasi_id) THEN
            -- Log error to correlation_errors table before raising exception
            INSERT INTO public.correlation_errors (
                user_id,
                mata_pelajaran_id,
                spesialisasi_id,
                error_type,
                metadata
            ) VALUES (
                NEW.user_id,
                NEW.mata_pelajaran_id,
                NEW.spesialisasi_id,
                'INVALID_CORRELATION_TRIGGER',
                jsonb_build_object('source', 'db_trigger')
            );
            
            RAISE EXCEPTION 'Spesialisasi yang dipilih tidak tersedia untuk mata pelajaran yang dipilih';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Apply trigger to tutors table
DROP TRIGGER IF EXISTS validate_tutor_correlation_trigger ON public.tutors;
CREATE TRIGGER validate_tutor_correlation_trigger
BEFORE INSERT OR UPDATE ON public.tutors
FOR EACH ROW EXECUTE PROCEDURE public.trigger_validate_tutor_correlation();

-- 10. Seed some initial data for testing
INSERT INTO public.mata_pelajaran (name) VALUES ('Matematika'), ('Bahasa Inggris') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.spesialisasi (name) VALUES ('Aljabar'), ('Kalkulus'), ('Grammar'), ('Speaking') ON CONFLICT (name) DO NOTHING;

-- Map them
DO $$
DECLARE
    v_math_id UUID;
    v_eng_id UUID;
    v_alg_id UUID;
    v_calc_id UUID;
    v_gram_id UUID;
    v_speak_id UUID;
BEGIN
    SELECT id INTO v_math_id FROM public.mata_pelajaran WHERE name = 'Matematika';
    SELECT id INTO v_eng_id FROM public.mata_pelajaran WHERE name = 'Bahasa Inggris';
    SELECT id INTO v_alg_id FROM public.spesialisasi WHERE name = 'Aljabar';
    SELECT id INTO v_calc_id FROM public.spesialisasi WHERE name = 'Kalkulus';
    SELECT id INTO v_gram_id FROM public.spesialisasi WHERE name = 'Grammar';
    SELECT id INTO v_speak_id FROM public.spesialisasi WHERE name = 'Speaking';

    INSERT INTO public.mata_pelajaran_spesialisasi (mata_pelajaran_id, spesialisasi_id) VALUES 
    (v_math_id, v_alg_id),
    (v_math_id, v_calc_id),
    (v_eng_id, v_gram_id),
    (v_eng_id, v_speak_id)
    ON CONFLICT DO NOTHING;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
