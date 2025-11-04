-- Add category linking columns to makeup_categories
ALTER TABLE public.makeup_categories
ADD COLUMN category_id uuid REFERENCES public.categories(id),
ADD COLUMN subcategory_id uuid REFERENCES public.categories(id);

-- Add index for better query performance
CREATE INDEX idx_makeup_categories_category_id ON public.makeup_categories(category_id);
CREATE INDEX idx_makeup_categories_subcategory_id ON public.makeup_categories(subcategory_id);