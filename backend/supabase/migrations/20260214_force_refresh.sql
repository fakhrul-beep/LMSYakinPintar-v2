-- Dummy migration to force schema cache refresh
CREATE TABLE IF NOT EXISTS public.dummy_refresh (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
DROP TABLE public.dummy_refresh;
