-- Create price_history table to track all price changes
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id),
  change_amount NUMERIC NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('increase', 'decrease')),
  affected_products_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all price history
CREATE POLICY "Admins can view price history"
ON public.price_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert price history
CREATE POLICY "Admins can insert price history"
ON public.price_history
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create function to update all product prices and log the change
CREATE OR REPLACE FUNCTION public.update_all_product_prices(
  amount_to_add NUMERIC,
  p_change_type TEXT,
  p_admin_id UUID
)
RETURNS TABLE(updated_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update all product variant prices
  UPDATE product_variants 
  SET price = GREATEST(0, price + amount_to_add)
  WHERE price > 0;
  
  -- Get count of affected products
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Insert into price history
  INSERT INTO price_history (admin_id, change_amount, change_type, affected_products_count)
  VALUES (p_admin_id, ABS(amount_to_add), p_change_type, v_count);
  
  -- Return the count
  RETURN QUERY SELECT v_count;
END;
$$;