-- حذف جميع التصنيفات التي لا ترتبط بأي منتج
-- حذف التصنيفات الفرعية أولاً (لأنها مرتبطة بالتصنيفات الرئيسية)
DELETE FROM categories 
WHERE parent_category_id IS NOT NULL;

-- حذف التصنيفات الرئيسية غير المستخدمة
DELETE FROM categories 
WHERE id NOT IN (
  SELECT DISTINCT category_id 
  FROM products 
  WHERE category_id IS NOT NULL
) AND parent_category_id IS NULL;