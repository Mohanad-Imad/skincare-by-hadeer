-- Add is_expert_choice column to products table
ALTER TABLE public.products
ADD COLUMN is_expert_choice boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.is_expert_choice IS 'Indicates if product is selected as expert choice';

-- Create index for better query performance
CREATE INDEX idx_products_expert_choice ON public.products(is_expert_choice) WHERE is_expert_choice = true;