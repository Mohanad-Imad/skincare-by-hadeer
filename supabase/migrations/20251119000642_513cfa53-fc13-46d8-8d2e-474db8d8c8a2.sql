-- إضافة عمود product_type إلى جدول products
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'skincare';

-- إنشاء جدول خصائص الساعات
CREATE TABLE product_watch_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT, -- نوع الحركة: ميكانيكي، كوارتز، أوتوماتيك
  case_material TEXT, -- مادة العلبة: ستانلس ستيل، ذهب، تيتانيوم
  case_diameter TEXT, -- قطر العلبة
  water_resistance TEXT, -- مقاومة الماء
  strap_type TEXT, -- نوع السوار: جلد، معدني، سيليكون
  strap_color TEXT, -- لون السوار
  dial_color TEXT, -- لون القرص
  warranty_years INTEGER, -- فترة الضمان بالسنوات
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id)
);

-- إنشاء جدول خصائص الملابس
CREATE TABLE product_clothing_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  available_sizes TEXT[], -- المقاسات المتوفرة: S, M, L, XL
  available_colors TEXT[], -- الألوان المتوفرة
  material TEXT, -- المادة: قطن، بوليستر، حرير
  fit_type TEXT, -- نوع القصة: slim fit, regular, oversized
  season TEXT, -- الموسم: صيفي، شتوي، لجميع الفصول
  care_instructions TEXT, -- تعليمات العناية
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id)
);

-- إنشاء indexes للأداء
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_watch_attributes_product_id ON product_watch_attributes(product_id);
CREATE INDEX idx_clothing_attributes_product_id ON product_clothing_attributes(product_id);

-- RLS policies لجدول product_watch_attributes
ALTER TABLE product_watch_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view watch attributes"
  ON product_watch_attributes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage watch attributes"
  ON product_watch_attributes FOR ALL
  USING (is_admin(auth.uid()));

-- RLS policies لجدول product_clothing_attributes
ALTER TABLE product_clothing_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clothing attributes"
  ON product_clothing_attributes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage clothing attributes"
  ON product_clothing_attributes FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger لتحديث updated_at
CREATE TRIGGER update_watch_attributes_updated_at
  BEFORE UPDATE ON product_watch_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_attributes_updated_at
  BEFORE UPDATE ON product_clothing_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();