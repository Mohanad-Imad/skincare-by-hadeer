-- Drop the old function
DROP FUNCTION IF EXISTS public.get_products_by_price_range(numeric, numeric);

-- Create improved function that considers discounts
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
  LEFT JOIN LATERAL (
    SELECT 
      COALESCE(
        MAX(CASE 
          WHEN pd.product_id = p.id THEN pd.discount_percentage 
          ELSE NULL 
        END),
        MAX(CASE 
          WHEN pd.product_id IS NULL THEN pd.discount_percentage 
          ELSE NULL 
        END),
        0
      ) as discount_percentage
    FROM product_discounts pd
    WHERE pd.is_active = true
      AND pd.valid_from <= now()
      AND (pd.valid_until IS NULL OR pd.valid_until >= now())
      AND (pd.product_id = p.id OR pd.product_id IS NULL)
  ) discount ON true
  WHERE 
    (min_price IS NULL OR (pv.price - (pv.price * COALESCE(discount.discount_percentage, 0) / 100)) >= min_price)
    AND (max_price IS NULL OR (pv.price - (pv.price * COALESCE(discount.discount_percentage, 0) / 100)) <= max_price)
$$;