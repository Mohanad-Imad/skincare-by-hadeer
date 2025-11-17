-- Create friendly_stores table
CREATE TABLE public.friendly_stores (
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
ALTER TABLE public.friendly_stores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active friendly stores"
ON public.friendly_stores
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage friendly stores"
ON public.friendly_stores
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_friendly_stores_updated_at
BEFORE UPDATE ON public.friendly_stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();