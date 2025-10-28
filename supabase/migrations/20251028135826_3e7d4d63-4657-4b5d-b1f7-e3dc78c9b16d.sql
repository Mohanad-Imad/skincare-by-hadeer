-- Create product_discounts table
CREATE TABLE IF NOT EXISTS public.product_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment to explain null product_id means discount applies to all products
COMMENT ON COLUMN public.product_discounts.product_id IS 'NULL means discount applies to all products';

-- Enable Row Level Security
ALTER TABLE public.product_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for product_discounts
CREATE POLICY "Anyone can view active product discounts" 
ON public.product_discounts 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Admins can manage product discounts" 
ON public.product_discounts 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_discounts_updated_at
BEFORE UPDATE ON public.product_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();