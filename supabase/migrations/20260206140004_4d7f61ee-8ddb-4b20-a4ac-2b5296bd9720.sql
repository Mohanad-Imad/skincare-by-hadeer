-- Add policy for public access to discount codes by ID (for influencer stats page)
CREATE POLICY "Anyone can view discount code by id"
ON public.discount_codes
FOR SELECT
USING (true);

-- Drop the old restrictive policy since we now have a more permissive one
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;

-- Add policy for public access to orders by discount_code_id (for influencer stats)
CREATE POLICY "Anyone can view orders by discount code"
ON public.orders
FOR SELECT
USING (discount_code_id IS NOT NULL);