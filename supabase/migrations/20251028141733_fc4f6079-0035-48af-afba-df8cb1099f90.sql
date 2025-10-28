-- Make valid_until nullable for open-ended discounts
ALTER TABLE product_discounts 
ALTER COLUMN valid_until DROP NOT NULL;

-- Update RLS policy to handle null valid_until (open-ended discounts)
DROP POLICY IF EXISTS "Anyone can view active product discounts" ON product_discounts;

CREATE POLICY "Anyone can view active product discounts" 
ON product_discounts 
FOR SELECT 
USING (
  is_active = true 
  AND valid_from <= now() 
  AND (valid_until IS NULL OR valid_until >= now())
);