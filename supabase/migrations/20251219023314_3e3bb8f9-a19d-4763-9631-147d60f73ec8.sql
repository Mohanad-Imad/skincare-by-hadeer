-- Create weekly_product table for Product of the Week feature
CREATE TABLE public.weekly_product (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  special_price NUMERIC NOT NULL,
  minimum_cart_amount NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  title_ar TEXT NOT NULL DEFAULT 'منتج الأسبوع',
  title_en TEXT DEFAULT 'Product of the Week',
  description_ar TEXT,
  description_en TEXT,
  max_quantity_per_customer INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_product ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active weekly product"
ON public.weekly_product
FOR SELECT
USING (is_active = true AND starts_at <= now() AND ends_at > now());

CREATE POLICY "Admins can manage weekly product"
ON public.weekly_product
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_product_updated_at
BEFORE UPDATE ON public.weekly_product
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();