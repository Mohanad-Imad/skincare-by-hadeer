-- Create discount_codes table
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active discount codes"
  ON public.discount_codes
  FOR SELECT
  USING (is_active = true AND valid_from <= now() AND valid_until >= now());

-- Add discount_code_id to orders table
ALTER TABLE public.orders
ADD COLUMN discount_code_id UUID REFERENCES public.discount_codes(id),
ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- Trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();