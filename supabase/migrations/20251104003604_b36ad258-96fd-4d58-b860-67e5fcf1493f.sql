-- Create tertiary_banners table for the third independent banner
CREATE TABLE public.tertiary_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tertiary_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active tertiary banners"
  ON public.tertiary_banners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tertiary banners"
  ON public.tertiary_banners
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_tertiary_banners_updated_at
  BEFORE UPDATE ON public.tertiary_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();