-- إنشاء جدول البنرات الإعلانية
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text_ar TEXT DEFAULT 'تسوق الآن',
  button_text_en TEXT DEFAULT 'Shop Now',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.banners
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger للتحديث التلقائي
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();