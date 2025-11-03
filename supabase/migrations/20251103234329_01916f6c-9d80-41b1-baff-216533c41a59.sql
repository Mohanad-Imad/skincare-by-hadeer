-- Create quick_links table for quick access links
CREATE TABLE public.quick_links (
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
ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active quick links"
ON public.quick_links
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quick links"
ON public.quick_links
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_quick_links_updated_at
BEFORE UPDATE ON public.quick_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for ordering
CREATE INDEX idx_quick_links_display_order ON public.quick_links(display_order);