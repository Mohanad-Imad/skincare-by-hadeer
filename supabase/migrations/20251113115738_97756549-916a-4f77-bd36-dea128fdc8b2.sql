-- Create announcement_bar table
CREATE TABLE public.announcement_bar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text_ar TEXT NOT NULL,
  text_en TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view active announcements"
ON public.announcement_bar
FOR SELECT
USING (is_active = true);

-- Create policies for authenticated users (admin)
CREATE POLICY "Authenticated users can manage announcements"
ON public.announcement_bar
FOR ALL
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_announcement_bar_updated_at
BEFORE UPDATE ON public.announcement_bar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();