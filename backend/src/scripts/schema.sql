-- Create mata_pelajaran table
CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spesialisasi table
CREATE TABLE IF NOT EXISTS spesialisasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relation table
CREATE TABLE IF NOT EXISTS mata_pelajaran_spesialisasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mata_pelajaran_id UUID REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    spesialisasi_id UUID REFERENCES spesialisasi(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mata_pelajaran_id, spesialisasi_id)
);

-- Add foreign keys to tutors table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='mata_pelajaran_id') THEN
        ALTER TABLE tutors ADD COLUMN mata_pelajaran_id UUID REFERENCES mata_pelajaran(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='spesialisasi_id') THEN
        ALTER TABLE tutors ADD COLUMN spesialisasi_id UUID REFERENCES spesialisasi(id);
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mata_pelajaran_updated_at BEFORE UPDATE ON mata_pelajaran FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_spesialisasi_updated_at BEFORE UPDATE ON spesialisasi FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_mata_pelajaran_spesialisasi_updated_at BEFORE UPDATE ON mata_pelajaran_spesialisasi FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Stored Procedure for validation
CREATE OR REPLACE FUNCTION validate_subject_specialization(p_subject_id UUID, p_spec_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- If both are null, it's valid (or handle as invalid based on requirements)
    IF p_subject_id IS NULL OR p_spec_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM mata_pelajaran_spesialisasi 
        WHERE mata_pelajaran_id = p_subject_id AND spesialisasi_id = p_spec_id
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate tutor subject-specialization correlation
CREATE OR REPLACE FUNCTION trigger_validate_tutor_correlation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mata_pelajaran_id IS NOT NULL AND NEW.spesialisasi_id IS NOT NULL THEN
        IF NOT validate_subject_specialization(NEW.mata_pelajaran_id, NEW.spesialisasi_id) THEN
            RAISE EXCEPTION 'Spesialisasi yang dipilih tidak tersedia untuk mata pelajaran yang dipilih';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tutors table
DROP TRIGGER IF EXISTS validate_tutor_correlation_trigger ON tutors;
CREATE TRIGGER validate_tutor_correlation_trigger
BEFORE INSERT OR UPDATE ON tutors
FOR EACH ROW EXECUTE PROCEDURE trigger_validate_tutor_correlation();

-- Table for correlation error logging
CREATE TABLE IF NOT EXISTS correlation_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    mata_pelajaran_id UUID,
    spesialisasi_id UUID,
    error_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
