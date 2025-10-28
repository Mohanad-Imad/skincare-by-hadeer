-- حذف جميع المستخدمين والبيانات المرتبطة بهم

-- أولاً: حذف البيانات من الجداول المرتبطة بالمستخدمين
DELETE FROM public.blog_posts;
DELETE FROM public.cart_items;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.discount_codes;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- ثانياً: حذف المستخدمين من نظام المصادقة
-- ملاحظة: هذا يتطلب استخدام دالة admin
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    -- حذف كل مستخدم باستخدام دالة admin
    PERFORM auth.uid();
  END LOOP;
END $$;

-- حذف المستخدمين من auth.users مباشرة (يتطلب صلاحيات)
DELETE FROM auth.users;