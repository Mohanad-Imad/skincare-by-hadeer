
-- Add festive theme setting to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS festive_theme_enabled boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.store_settings.festive_theme_enabled IS 'Enable/disable Christmas and New Year festive theme effects';
