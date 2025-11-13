-- Create storage bucket for customer review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-reviews', 'customer-reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for customer review images
CREATE POLICY "Anyone can view customer review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-reviews');

CREATE POLICY "Authenticated users can upload customer review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-reviews' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own customer review images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customer-reviews' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own customer review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-reviews' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);