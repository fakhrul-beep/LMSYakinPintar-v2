-- Backup Skema Legacy Program
-- Digunakan untuk referensi jika ingin mengembalikan fungsi program penuh

CREATE TABLE IF NOT EXISTS public.programs_legacy_backup (
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

-- Copy data jika ada
INSERT INTO public.programs_legacy_backup 
SELECT * FROM public.programs;

-- Index backup
CREATE INDEX IF NOT EXISTS idx_programs_legacy_slug ON public.programs_legacy_backup(slug);
CREATE INDEX IF NOT EXISTS idx_programs_legacy_category ON public.programs_legacy_backup(category);
