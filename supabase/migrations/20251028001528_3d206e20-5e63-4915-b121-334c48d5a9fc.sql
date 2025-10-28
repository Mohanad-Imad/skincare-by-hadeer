-- إضافة عمود parent_category_id لجدول categories لدعم التصنيف الهرمي
ALTER TABLE public.categories
ADD COLUMN parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX idx_categories_parent ON public.categories(parent_category_id);

-- إنشاء قسم رئيسي: العناية بالبشرة
INSERT INTO public.categories (id, name_ar, name_en, description_ar, description_en)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'العناية بالبشرة',
  'Skincare',
  'منتجات العناية بالبشرة',
  'Skincare Products'
);

-- إنشاء قسم رئيسي: ميك اب
INSERT INTO public.categories (id, name_ar, name_en, description_ar, description_en)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'ميك اب',
  'Makeup',
  'منتجات الميك اب والتجميل',
  'Makeup and Beauty Products'
);

-- إنشاء قسم رئيسي: عطور
INSERT INTO public.categories (id, name_ar, name_en, description_ar, description_en)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'عطور',
  'Perfumes',
  'عطور رجالية ونسائية',
  'Men and Women Perfumes'
);

-- إنشاء أقسام فرعية للعناية بالبشرة
INSERT INTO public.categories (name_ar, name_en, description_ar, description_en, parent_category_id)
VALUES 
  ('غسول', 'Cleanser', 'منتجات الغسول والتنظيف', 'Cleanser and Cleansing Products', '00000000-0000-0000-0000-000000000001'),
  ('سيروم', 'Serum', 'سيروم العناية بالبشرة', 'Skincare Serums', '00000000-0000-0000-0000-000000000001'),
  ('كريمات ومرطبات', 'Creams & Moisturizers', 'كريمات ومرطبات للبشرة', 'Face Creams and Moisturizers', '00000000-0000-0000-0000-000000000001'),
  ('ماسكات', 'Masks', 'ماسكات العناية بالبشرة', 'Face Masks', '00000000-0000-0000-0000-000000000001'),
  ('تونر', 'Toner', 'تونر للبشرة', 'Face Toner', '00000000-0000-0000-0000-000000000001');

-- تحديث جميع المنتجات الحالية لتكون تحت قسم "العناية بالبشرة" الرئيسي
-- في حالة وجود منتجات بدون تصنيف أو تصنيف قديم
UPDATE public.products
SET category_id = '00000000-0000-0000-0000-000000000001'
WHERE category_id IS NULL OR category_id NOT IN (
  SELECT id FROM public.categories WHERE parent_category_id IS NOT NULL
);