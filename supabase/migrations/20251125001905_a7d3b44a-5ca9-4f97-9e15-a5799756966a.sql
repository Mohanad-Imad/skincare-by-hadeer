-- Add live activity feed control to store settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS show_live_activity_feed boolean DEFAULT true;