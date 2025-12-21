-- Create weekly_bundle table for exclusive bundle offers
CREATE TABLE public.weekly_bundle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  special_price NUMERIC NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_bundle ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage weekly bundle" 
ON public.weekly_bundle 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active weekly bundle" 
ON public.weekly_bundle 
FOR SELECT 
USING (is_active = true AND starts_at <= now() AND ends_at > now());

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_bundle_updated_at
BEFORE UPDATE ON public.weekly_bundle
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();