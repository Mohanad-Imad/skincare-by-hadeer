-- Add image_url column to product_reviews table for photo reviews
ALTER TABLE public.product_reviews 
ADD COLUMN image_url text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.product_reviews.image_url IS 'URL of the review image uploaded by the customer';