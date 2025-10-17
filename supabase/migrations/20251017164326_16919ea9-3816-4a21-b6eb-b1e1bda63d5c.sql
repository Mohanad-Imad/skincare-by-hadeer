
-- Delete all files from storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('product-images', 'blog-images');

-- Delete data from tables in correct order (respecting foreign keys)
TRUNCATE TABLE public.cart_items CASCADE;
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.product_images CASCADE;
TRUNCATE TABLE public.product_variants CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.blog_posts CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
