-- Add separate columns for navbar and sidebar visibility
ALTER TABLE public.navigation_links
ADD COLUMN show_in_navbar BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_in_sidebar BOOLEAN NOT NULL DEFAULT true;

-- Update existing records based on location column
UPDATE public.navigation_links
SET 
  show_in_navbar = (location IN ('navbar', 'both')),
  show_in_sidebar = (location IN ('sidebar', 'both'));

-- Drop the old location column
ALTER TABLE public.navigation_links
DROP COLUMN location;