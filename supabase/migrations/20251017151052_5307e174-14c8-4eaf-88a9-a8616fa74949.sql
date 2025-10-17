-- Fix critical security issue: Remove unauthenticated access to orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Fix critical security issue: Remove unauthenticated access to order creation
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders" 
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix critical security issue: Remove unauthenticated access to order items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" 
ON order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Fix critical security issue: Secure order item creation
DROP POLICY IF EXISTS "Authenticated users can create order items" ON order_items;
CREATE POLICY "Authenticated users can create order items" 
ON order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Fix weak authorization: Update categories to require admin role
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" 
ON categories FOR ALL
USING (is_admin(auth.uid()));

-- Fix weak authorization: Update products to require admin role
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" 
ON products FOR ALL
USING (is_admin(auth.uid()));

-- Fix weak authorization: Update product variants to require admin role
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;
CREATE POLICY "Admins can manage variants" 
ON product_variants FOR ALL
USING (is_admin(auth.uid()));

-- Fix weak authorization: Update product images to require admin role
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images" 
ON product_images FOR ALL
USING (is_admin(auth.uid()));

-- Add admin access to profiles for order fulfillment
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (is_admin(auth.uid()));