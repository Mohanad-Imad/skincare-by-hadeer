-- Fix guest checkout: allow anon (guest) inserts for orders + order_items

-- Orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;

CREATE POLICY "Guests can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Order items
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Guests can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Guests can create order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
  )
);

CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);