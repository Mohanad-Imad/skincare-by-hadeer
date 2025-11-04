-- Create makeup_banner table
CREATE TABLE IF NOT EXISTS public.makeup_banner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#FFC0CB',
  text_color TEXT DEFAULT '#000000',
  button_text_ar TEXT DEFAULT 'تسوق الآن',
  button_text_en TEXT DEFAULT 'Shop Now',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create makeup_categories table
CREATE TABLE IF NOT EXISTS public.makeup_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_makeup_categories junction table
CREATE TABLE IF NOT EXISTS public.product_makeup_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  makeup_category_id UUID NOT NULL REFERENCES public.makeup_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, makeup_category_id)
);

-- Enable RLS
ALTER TABLE public.makeup_banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makeup_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_makeup_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for makeup_banner
CREATE POLICY "Anyone can view active makeup banner"
  ON public.makeup_banner FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage makeup banner"
  ON public.makeup_banner FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for makeup_categories
CREATE POLICY "Anyone can view active makeup categories"
  ON public.makeup_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage makeup categories"
  ON public.makeup_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for product_makeup_categories
CREATE POLICY "Anyone can view product makeup categories"
  ON public.product_makeup_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product makeup categories"
  ON public.product_makeup_categories FOR ALL
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_makeup_banner_updated_at
  BEFORE UPDATE ON public.makeup_banner
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_makeup_categories_updated_at
  BEFORE UPDATE ON public.makeup_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default makeup categories
INSERT INTO public.makeup_categories (name_ar, name_en, slug, display_order) VALUES
  ('كريم أساس', 'Foundation', 'foundation', 1),
  ('باودر', 'Powder', 'powder', 2),
  ('برايمر', 'Primer', 'primer', 3),
  ('كونسيلر', 'Concealer', 'concealer', 4),
  ('بلاش', 'Blush', 'blush', 5),
  ('برونزر', 'Bronzer', 'bronzer', 6),
  ('هايلايتر', 'Highlighter', 'highlighter', 7),
  ('مثبت مكياج', 'Setting Spray', 'setting-spray', 8),
  ('ماسكارا', 'Mascara', 'mascara', 9),
  ('ظلال عيون', 'Eyeshadow', 'eyeshadow', 10),
  ('كحل سائل', 'Liquid Eyeliner', 'liquid-eyeliner', 11),
  ('كحل', 'Eyeliner', 'eyeliner', 12),
  ('رموش', 'Lashes', 'lashes', 13),
  ('حواجب', 'Eyebrows', 'eyebrows', 14),
  ('حمرة', 'Lipstick', 'lipstick', 15),
  ('حمرة سائلة', 'Liquid Lipstick', 'liquid-lipstick', 16),
  ('محدد شفاه', 'Lip Liner', 'lip-liner', 17),
  ('مجموعة فرش', 'Brush Set', 'brush-set', 18),
  ('مقطاطة', 'Tweezers', 'tweezers', 19),
  ('اسفنجة و بلندر', 'Sponge & Blender', 'sponge-blender', 20);

-- Insert a default banner
INSERT INTO public.makeup_banner (title_ar, title_en, description_ar, description_en, image_url, is_active, display_order)
VALUES ('عالم المكياج', 'Makeup World', 'اكتشفي أحدث منتجات المكياج', 'Discover the latest makeup products', '', true, 0);