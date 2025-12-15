-- Update orders RLS policy to allow guest checkout (user_id can be null)
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  -- المستخدم المسجل يمكنه إنشاء طلب لنفسه
  (auth.uid() = user_id)
  OR 
  -- الضيوف يمكنهم إنشاء طلبات بدون user_id
  (user_id IS NULL)
);

-- Update order_items RLS policy to allow inserting items for guest orders
DROP POLICY IF EXISTS "Authenticated users can create order items" ON public.order_items;

CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.user_id = auth.uid()
      OR orders.user_id IS NULL
    )
  )
);