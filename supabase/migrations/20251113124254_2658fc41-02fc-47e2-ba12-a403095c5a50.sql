-- Add display_order and is_active columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);