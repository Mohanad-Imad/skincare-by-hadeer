-- Allow guests to see their just-created order (needed for returning the order after insert)
CREATE POLICY "Guests can view own order after creation"
ON public.orders
FOR SELECT
TO anon
USING (user_id IS NULL);

-- Allow guests to view their order items
CREATE POLICY "Guests can view order items"
ON public.order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
  )
);