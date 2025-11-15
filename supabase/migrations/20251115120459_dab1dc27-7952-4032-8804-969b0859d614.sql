-- Add separate color settings for light and dark modes
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS light_background text DEFAULT '350 60% 96%',
ADD COLUMN IF NOT EXISTS light_foreground text DEFAULT '340 25% 20%',
ADD COLUMN IF NOT EXISTS light_card text DEFAULT '0 0% 99%',
ADD COLUMN IF NOT EXISTS light_primary text DEFAULT '340 75% 60%',
ADD COLUMN IF NOT EXISTS light_secondary text DEFAULT '20 60% 88%',
ADD COLUMN IF NOT EXISTS light_accent text DEFAULT '320 35% 85%',
ADD COLUMN IF NOT EXISTS light_muted text DEFAULT '340 25% 90%',
ADD COLUMN IF NOT EXISTS light_border text DEFAULT '340 25% 85%',
ADD COLUMN IF NOT EXISTS dark_background text DEFAULT '340 25% 12%',
ADD COLUMN IF NOT EXISTS dark_foreground text DEFAULT '340 15% 95%',
ADD COLUMN IF NOT EXISTS dark_card text DEFAULT '340 20% 16%',
ADD COLUMN IF NOT EXISTS dark_primary text DEFAULT '340 70% 70%',
ADD COLUMN IF NOT EXISTS dark_secondary text DEFAULT '340 15% 22%',
ADD COLUMN IF NOT EXISTS dark_accent text DEFAULT '320 20% 25%',
ADD COLUMN IF NOT EXISTS dark_muted text DEFAULT '340 15% 20%',
ADD COLUMN IF NOT EXISTS dark_border text DEFAULT '340 15% 25%';