-- Create function to filter products by price range
CREATE OR REPLACE FUNCTION public.get_products_by_price_range(
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL
)
RETURNS TABLE (product_id uuid)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT DISTINCT p.id as product_id
  FROM products p
  INNER JOIN product_variants pv ON p.id = pv.product_id
  WHERE 
    (min_price IS NULL OR pv.price >= min_price)
    AND (max_price IS NULL OR pv.price <= max_price)
$$;