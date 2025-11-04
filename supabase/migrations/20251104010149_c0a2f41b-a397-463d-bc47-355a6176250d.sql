-- Create brands_links table for brand quick access
CREATE TABLE public.brands_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active brands links"
  ON public.brands_links
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage brands links"
  ON public.brands_links
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_brands_links_updated_at
  BEFORE UPDATE ON public.brands_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();