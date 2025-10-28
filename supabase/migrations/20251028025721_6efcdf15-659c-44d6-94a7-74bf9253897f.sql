-- Create celebrity_routines table
CREATE TABLE public.celebrity_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_name_ar TEXT NOT NULL,
  celebrity_name_en TEXT NOT NULL,
  image_url TEXT,
  country_ar TEXT NOT NULL,
  country_en TEXT NOT NULL,
  skin_type skin_type NOT NULL,
  tagline_ar TEXT,
  tagline_en TEXT,
  morning_routine_ar TEXT NOT NULL,
  morning_routine_en TEXT NOT NULL,
  evening_routine_ar TEXT NOT NULL,
  evening_routine_en TEXT NOT NULL,
  favorite_products JSONB DEFAULT '[]'::jsonb,
  expert_notes_ar TEXT,
  expert_notes_en TEXT,
  tips_ar TEXT,
  tips_en TEXT,
  region TEXT,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.celebrity_routines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active celebrity routines"
ON public.celebrity_routines
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage celebrity routines"
ON public.celebrity_routines
FOR ALL
USING (is_admin(auth.uid()));

-- Create saved_celebrity_routines table for user favorites
CREATE TABLE public.saved_celebrity_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL REFERENCES public.celebrity_routines(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, routine_id)
);

-- Enable RLS
ALTER TABLE public.saved_celebrity_routines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own saved routines"
ON public.saved_celebrity_routines
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save routines"
ON public.saved_celebrity_routines
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved routines"
ON public.saved_celebrity_routines
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_celebrity_routines_updated_at
BEFORE UPDATE ON public.celebrity_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();