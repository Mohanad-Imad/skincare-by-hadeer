-- Create shipping_settings table for managing delivery fees
CREATE TABLE public.shipping_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_fee numeric NOT NULL DEFAULT 0,
  is_free_delivery boolean NOT NULL DEFAULT false,
  free_delivery_threshold numeric DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view shipping settings" 
ON public.shipping_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage shipping settings" 
ON public.shipping_settings 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default shipping settings
INSERT INTO public.shipping_settings (delivery_fee, is_free_delivery, free_delivery_threshold)
VALUES (0, true, NULL);

-- Add shipping_amount column to orders table
ALTER TABLE public.orders 
ADD COLUMN shipping_amount numeric NOT NULL DEFAULT 0;

-- Create trigger for automatic timestamp updates on shipping_settings
CREATE TRIGGER update_shipping_settings_updated_at
BEFORE UPDATE ON public.shipping_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();