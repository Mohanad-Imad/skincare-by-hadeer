-- جدول أنواع المنتجات
CREATE TABLE public.product_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Package',
  description_ar TEXT,
  description_en TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول خصائص أنواع المنتجات
CREATE TABLE public.product_type_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_name_ar TEXT NOT NULL,
  attribute_name_en TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, select, checkbox, textarea
  options JSONB DEFAULT '[]', -- للقوائم المنسدلة: [{value: "x", label_ar: "ص", label_en: "y"}]
  placeholder_ar TEXT,
  placeholder_en TEXT,
  is_required BOOLEAN DEFAULT false,
  show_in_filters BOOLEAN DEFAULT false,
  show_in_product_card BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_type_id, attribute_key)
);

-- جدول قيم خصائص المنتجات
CREATE TABLE public.product_attribute_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.product_type_attributes(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- إضافة عمود product_type_id للمنتجات
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES public.product_types(id);

-- Enable RLS
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_type_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_types
CREATE POLICY "Anyone can view active product types"
  ON public.product_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage product types"
  ON public.product_types FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for product_type_attributes
CREATE POLICY "Anyone can view active attributes"
  ON public.product_type_attributes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage product type attributes"
  ON public.product_type_attributes FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for product_attribute_values
CREATE POLICY "Anyone can view attribute values"
  ON public.product_attribute_values FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage attribute values"
  ON public.product_attribute_values FOR ALL
  USING (is_admin(auth.uid()));

-- إضافة الأنواع الموجودة حالياً
INSERT INTO public.product_types (name_ar, name_en, slug, icon, display_order) VALUES
('العناية بالبشرة', 'Skincare', 'skincare', 'Sparkles', 1),
('الساعات', 'Watches', 'watches', 'Watch', 2),
('الملابس', 'Clothing', 'clothing', 'Shirt', 3);

-- إضافة خصائص العناية بالبشرة
INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, options, is_required, show_in_filters, display_order)
SELECT id, 'skin_type', 'مناسب لنوع البشرة', 'Suitable for Skin Type', 'multi-select', 
  '[{"value": "oily", "label_ar": "دهنية", "label_en": "Oily"}, {"value": "dry", "label_ar": "جافة", "label_en": "Dry"}, {"value": "combination", "label_ar": "مختلطة", "label_en": "Combination"}, {"value": "sensitive", "label_ar": "حساسة", "label_en": "Sensitive"}, {"value": "normal", "label_ar": "عادية", "label_en": "Normal"}]'::jsonb,
  false, true, 1
FROM public.product_types WHERE slug = 'skincare';

-- إضافة خصائص الساعات
INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'movement_type', 'نوع الحركة', 'Movement Type', 'text', 'مثال: أوتوماتيك، كوارتز', 1
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'case_material', 'مادة العلبة', 'Case Material', 'text', 'مثال: ستانلس ستيل، ذهب', 2
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'case_diameter', 'قطر العلبة', 'Case Diameter', 'text', 'مثال: 42mm', 3
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'water_resistance', 'مقاومة الماء', 'Water Resistance', 'text', 'مثال: 50 متر', 4
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'strap_type', 'نوع السوار', 'Strap Type', 'text', 'مثال: جلد، معدني', 5
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'strap_color', 'لون السوار', 'Strap Color', 'text', '', 6
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'dial_color', 'لون القرص', 'Dial Color', 'text', '', 7
FROM public.product_types WHERE slug = 'watches';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'warranty_years', 'فترة الضمان (بالسنوات)', 'Warranty (Years)', 'number', '', 8
FROM public.product_types WHERE slug = 'watches';

-- إضافة خصائص الملابس
INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'available_sizes', 'المقاسات المتوفرة', 'Available Sizes', 'text', 'مثال: S, M, L, XL', 1
FROM public.product_types WHERE slug = 'clothing';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'available_colors', 'الألوان المتوفرة', 'Available Colors', 'text', 'مثال: أسود, أبيض, أزرق', 2
FROM public.product_types WHERE slug = 'clothing';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'material', 'المادة', 'Material', 'text', 'مثال: قطن، بوليستر', 3
FROM public.product_types WHERE slug = 'clothing';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'fit_type', 'نوع القصة', 'Fit Type', 'text', 'مثال: slim fit, regular', 4
FROM public.product_types WHERE slug = 'clothing';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'season', 'الموسم', 'Season', 'text', 'مثال: صيفي، شتوي', 5
FROM public.product_types WHERE slug = 'clothing';

INSERT INTO public.product_type_attributes (product_type_id, attribute_key, attribute_name_ar, attribute_name_en, field_type, placeholder_ar, display_order)
SELECT id, 'care_instructions', 'تعليمات العناية', 'Care Instructions', 'textarea', 'مثال: غسيل يدوي، لا يوضع في المجفف', 6
FROM public.product_types WHERE slug = 'clothing';

-- Triggers for updated_at
CREATE TRIGGER update_product_types_updated_at
  BEFORE UPDATE ON public.product_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_type_attributes_updated_at
  BEFORE UPDATE ON public.product_type_attributes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_attribute_values_updated_at
  BEFORE UPDATE ON public.product_attribute_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();