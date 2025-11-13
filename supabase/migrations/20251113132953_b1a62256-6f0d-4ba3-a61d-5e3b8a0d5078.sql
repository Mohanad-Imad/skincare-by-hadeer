-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'اسم المتجر',
  currency TEXT NOT NULL DEFAULT 'ريال',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage store settings"
  ON public.store_settings
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view store settings"
  ON public.store_settings
  FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO public.store_settings (store_name, currency)
VALUES ('اسم المتجر', 'ريال')
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();