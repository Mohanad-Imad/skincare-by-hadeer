-- Add logo_url column to guarantee_settings
ALTER TABLE public.guarantee_settings 
ADD COLUMN logo_url TEXT;

-- Create storage bucket for guarantee images
INSERT INTO storage.buckets (id, name, public)
VALUES ('guarantee-images', 'guarantee-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for guarantee images bucket
CREATE POLICY "Anyone can view guarantee images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'guarantee-images');

CREATE POLICY "Admins can upload guarantee images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'guarantee-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update guarantee images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'guarantee-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete guarantee images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'guarantee-images' AND is_admin(auth.uid()));