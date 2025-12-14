-- Add column to control showing "coming soon" message for makeup section
ALTER TABLE public.makeup_banner 
ADD COLUMN show_coming_soon boolean NOT NULL DEFAULT true;