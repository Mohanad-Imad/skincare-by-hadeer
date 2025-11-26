-- Drop the old function
DROP FUNCTION IF EXISTS public.get_products_by_price_range(numeric, numeric);

-- Create improved function with correct discount logic
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
    -- Get product-specific discount
    SELECT MAX(pd.discount_percentage) as product_discount
    FROM product_discounts pd
    WHERE pd.is_active = true
      AND pd.valid_from <= now()
      AND (pd.valid_until IS NULL OR pd.valid_until >= now())
      AND pd.product_id = p.id
  ) specific_discount ON true
  LEFT JOIN LATERAL (
    -- Get general discount (applies to all products)
    SELECT MAX(pd.discount_percentage) as general_discount
    FROM product_discounts pd
    WHERE pd.is_active = true
      AND pd.valid_from <= now()
      AND (pd.valid_until IS NULL OR pd.valid_until >= now())
      AND pd.product_id IS NULL
  ) general_discount ON true
  LEFT JOIN LATERAL (
    -- Choose the higher discount
    SELECT GREATEST(
      COALESCE(specific_discount.product_discount, 0),
      COALESCE(general_discount.general_discount, 0)
    ) as final_discount
  ) discount ON true
  WHERE 
    (min_price IS NULL OR (pv.price - (pv.price * discount.final_discount / 100)) >= min_price)
    AND (max_price IS NULL OR (pv.price - (pv.price * discount.final_discount / 100)) <= max_price)
$$;