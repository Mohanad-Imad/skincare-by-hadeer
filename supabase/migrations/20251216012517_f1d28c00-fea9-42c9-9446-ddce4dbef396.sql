-- Create favorites/wishlist table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own favorites
CREATE POLICY "Users can add to own favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites"
ON public.favorites
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);