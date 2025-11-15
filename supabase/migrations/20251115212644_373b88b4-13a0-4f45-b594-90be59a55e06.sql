-- Create navigation_links table for dynamic navigation management
CREATE TABLE public.navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location TEXT NOT NULL DEFAULT 'both', -- 'navbar', 'sidebar', or 'both'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active navigation links"
ON public.navigation_links
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage navigation links"
ON public.navigation_links
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default navigation links
INSERT INTO public.navigation_links (title_ar, title_en, url, icon, display_order, location, is_active) VALUES
('الرئيسية', 'Home', '/', 'Home', 1, 'navbar', true),
('المنتجات', 'Products', '/products', 'Package', 2, 'both', true),
('الفئات', 'Categories', '/categories', 'Grid', 3, 'navbar', true),
('المدونة', 'Blog', '/blog', 'BookOpen', 4, 'both', true),
('استشارة مجانية', 'Free Consultation', '/consultation', 'MessageCircle', 5, 'both', true),
('روتينات المشاهير', 'Celebrity Routines', '/celebrity-routines', 'Star', 6, 'both', true),
('المكياج', 'Makeup', '/makeup', 'Palette', 7, 'both', true),
('ضمان الاسترجاع', 'Return Guarantee', '/guarantee', 'ShieldCheck', 8, 'both', true);

-- Create trigger for updated_at
CREATE TRIGGER update_navigation_links_updated_at
BEFORE UPDATE ON public.navigation_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();