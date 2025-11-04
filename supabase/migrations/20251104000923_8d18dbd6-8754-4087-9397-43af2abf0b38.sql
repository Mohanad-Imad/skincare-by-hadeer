-- Create secondary_banners table for the smaller promotional banners
CREATE TABLE IF NOT EXISTS public.secondary_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text_ar TEXT DEFAULT 'تسوق الآن',
  button_text_en TEXT DEFAULT 'Shop Now',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secondary_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active secondary banners"
ON public.secondary_banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage secondary banners"
ON public.secondary_banners
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_secondary_banners_updated_at
BEFORE UPDATE ON public.secondary_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_secondary_banners_display_order ON public.secondary_banners(display_order) WHERE is_active = true;