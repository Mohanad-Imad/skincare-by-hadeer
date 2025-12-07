-- Create announcement_bar table for dynamic top announcements
CREATE TABLE public.announcement_bar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  link_url TEXT,
  background_color TEXT DEFAULT '#ec4899',
  text_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage announcement bar" 
ON public.announcement_bar 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active announcements" 
ON public.announcement_bar 
FOR SELECT 
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_announcement_bar_updated_at
BEFORE UPDATE ON public.announcement_bar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();