-- Add image_url to sub_problems table
ALTER TABLE public.sub_problems ADD COLUMN IF NOT EXISTS image_url TEXT;