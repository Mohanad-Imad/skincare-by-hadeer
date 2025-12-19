-- Add custom image field to weekly_product table
ALTER TABLE public.weekly_product 
ADD COLUMN IF NOT EXISTS image_url TEXT;