-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a permissive policy that allows guest orders (user_id is null)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));